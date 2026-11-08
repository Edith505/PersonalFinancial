import { prisma } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import { AppError } from "../utils/AppError.js";
import type { CreateBudgetInput, ListBudgetsQuery, UpdateBudgetLimitsInput } from "../validators/budget.validator.js";

function monthBounds(month: string) {
  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7)) - 1;
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
}

const periodSelect = {
  id: true,
  startDate: true,
  endDate: true,
  timeZone: true,
  budget: { select: {
    id: true, name: true, description: true, isActive: true,
    currencyCode: true, financialProfileId: true,
    currency: { select: { minorUnit: true } },
    financialProfile: { select: { id: true, name: true } },
  } },
  items: {
    orderBy: { id: "asc" },
    select: { id: true, amountMinor: true, category: { select: { id: true, name: true } } },
  },
} satisfies Prisma.BudgetPeriodSelect;

type SelectedPeriod = Prisma.BudgetPeriodGetPayload<{ select: typeof periodSelect }>;

export async function updateBudgetLimits(
  userId: string,
  budgetId: string,
  periodId: string,
  input: UpdateBudgetLimitsInput,
) {
  return prisma.$transaction(async (tx) => {
    const period = await tx.budgetPeriod.findFirst({
      where: { userId, id: periodId, budgetId, budget: { userId } },
      select: periodSelect,
    });
    if (!period) throw new AppError(404, "BUDGET_PERIOD_NOT_FOUND", "La période budgétaire demandée est indisponible.");
    if (!period.budget.isActive) throw new AppError(409, "BUDGET_INACTIVE", "Ce budget est inactif.");
    if (period.timeZone !== "UTC") throw new AppError(409, "BUDGET_PERIOD_UNSUPPORTED", "Cette période utilise un fuseau horaire qui n’est pas encore pris en charge.");

    const existing = new Map(period.items.map((item) => [item.id, item]));
    if (input.items.some((item) => !existing.has(item.id))) {
      throw new AppError(400, "INVALID_BUDGET_ITEMS", "Toutes les lignes doivent appartenir à cette période budgétaire.");
    }
    const changed = input.items.filter((item) => existing.get(item.id)?.amountMinor !== item.amountMinor);
    if (changed.length === 0) return summarizePeriod(tx, userId, period, new Date());

    // Toutes les lignes sont vérifiées avant la première écriture.
    // La transaction garantit que l’ensemble des plafonds est enregistré ou annulé.
    for (const item of changed) {
      await tx.budgetItem.update({
        where: { userId_id: { userId, id: item.id } },
        data: { amountMinor: item.amountMinor },
      });
    }
    const updated = await tx.budgetPeriod.update({
      where: { userId_id: { userId, id: period.id } },
      data: { updatedAt: new Date() },
      select: periodSelect,
    });
    await tx.auditLog.createMany({
      data: [
        { userId, action: "UPDATE", entityType: "BUDGET_PERIOD", entityId: period.id },
        ...changed.map((item) => ({ userId, action: "UPDATE" as const, entityType: "BUDGET_ITEM" as const, entityId: item.id })),
      ],
    });
    return summarizePeriod(tx, userId, updated, new Date());
  });
}

async function summarizePeriod(tx: Prisma.TransactionClient, userId: string, period: SelectedPeriod, asOf: Date) {
  const totals = await tx.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId,
      type: "EXPENSE",
      status: "POSTED",
      currencyCode: period.budget.currencyCode,
      ...(period.budget.financialProfileId ? { financialProfileId: period.budget.financialProfileId } : {}),
      transactionDate: {
        gte: new Date(`${period.startDate}T00:00:00Z`),
        lt: new Date(`${period.endDate}T00:00:00Z`),
        lte: asOf,
      },
    },
    _sum: { amountMinor: true },
  });
  const spentByCategory = new Map(totals.map((item) => [item.categoryId, item._sum.amountMinor ?? 0n]));
  let plannedMinor = 0n;
  let coveredSpentMinor = 0n;
  const items = period.items.map((item) => {
    const spent = spentByCategory.get(item.category.id) ?? 0n;
    plannedMinor += item.amountMinor;
    coveredSpentMinor += spent;
    return {
      id: item.id,
      category: item.category,
      plannedMinor: item.amountMinor.toString(),
      spentMinor: spent.toString(),
      remainingMinor: (item.amountMinor - spent).toString(),
      isOverBudget: spent > item.amountMinor,
    };
  });
  const totalExpensesMinor = totals.reduce((sum, item) => sum + (item._sum.amountMinor ?? 0n), 0n);
  return {
    id: period.budget.id,
    periodId: period.id,
    name: period.budget.name,
    description: period.budget.description,
    isActive: period.budget.isActive,
    currencyCode: period.budget.currencyCode,
    minorUnit: period.budget.currency.minorUnit,
    financialProfile: period.budget.financialProfile,
    period: { month: period.startDate.slice(0, 7), startDate: period.startDate, endDateExclusive: period.endDate, timeZone: period.timeZone },
    totals: {
      plannedMinor: plannedMinor.toString(),
      coveredSpentMinor: coveredSpentMinor.toString(),
      remainingMinor: (plannedMinor - coveredSpentMinor).toString(),
      unbudgetedSpentMinor: (totalExpensesMinor - coveredSpentMinor).toString(),
      totalExpensesMinor: totalExpensesMinor.toString(),
    },
    items,
  };
}

export async function listBudgets(userId: string, query: ListBudgetsQuery) {
  const asOf = new Date();
  const month = query.month ?? asOf.toISOString().slice(0, 7);
  const bounds = monthBounds(month);
  const where: Prisma.BudgetPeriodWhereInput = {
    userId,
    startDate: bounds.startDate,
    endDate: bounds.endDate,
    timeZone: "UTC",
    budget: {
      userId,
      ...(query.currencyCode ? { currencyCode: query.currencyCode } : {}),
      ...(query.financialProfileId ? { financialProfileId: query.financialProfileId } : {}),
    },
  };
  return prisma.$transaction(async (tx) => {
    const total = await tx.budgetPeriod.count({ where });
    const periods = await tx.budgetPeriod.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: periodSelect,
    });
    const items = [];
    for (const period of periods) items.push(await summarizePeriod(tx, userId, period, asOf));
    return {
      items,
      month,
      timeZone: "UTC",
      asOf: asOf.toISOString(),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) },
    };
  });
}

export async function getBudgetOptions(userId: string) {
  return prisma.$transaction(async (tx) => {
    const profiles = await tx.financialProfile.findMany({
      where: { userId, isActive: true },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: { id: true, name: true },
    });
    const currencies = await tx.currency.findMany({
      where: { isActive: true }, orderBy: { code: "asc" },
      select: { code: true, name: true, minorUnit: true },
    });
    const categories = await tx.category.findMany({
      where: { userId, isActive: true, type: "EXPENSE" },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: { id: true, name: true },
    });
    return { profiles, currencies, categories, timeZone: "UTC" };
  });
}

export async function createBudget(userId: string, input: CreateBudgetInput) {
  return prisma.$transaction(async (tx) => {
    if (input.financialProfileId) {
      const profile = await tx.financialProfile.findFirst({
        where: { userId, id: input.financialProfileId, isActive: true }, select: { id: true },
      });
      if (!profile) throw new AppError(404, "PROFILE_NOT_FOUND", "Le profil demandé est indisponible.");
    }
    const currency = await tx.currency.findFirst({
      where: { code: input.currencyCode, isActive: true }, select: { code: true },
    });
    if (!currency) throw new AppError(400, "INVALID_CURRENCY", "Cette devise n’est pas disponible.");
    const categories = await tx.category.findMany({
      where: { userId, id: { in: input.items.map((item) => item.categoryId) }, type: "EXPENSE", isActive: true },
      select: { id: true },
    });
    if (categories.length !== input.items.length) {
      throw new AppError(400, "INVALID_BUDGET_CATEGORIES", "Choisissez des catégories de dépenses actives, sans doublon.");
    }
    const budget = await tx.budget.create({
      data: {
        userId, name: input.name, description: input.description ?? null,
        financialProfileId: input.financialProfileId ?? null, currencyCode: currency.code,
      },
      select: { id: true },
    });
    const bounds = monthBounds(input.month);
    const createdPeriod = await tx.budgetPeriod.create({
      data: { userId, budgetId: budget.id, ...bounds, timeZone: "UTC" }, select: { id: true },
    });
    await tx.budgetItem.createMany({
      data: input.items.map((item) => ({ userId, budgetPeriodId: createdPeriod.id, categoryId: item.categoryId, amountMinor: item.amountMinor })),
    });
    const period = await tx.budgetPeriod.findUniqueOrThrow({
      where: { userId_id: { userId, id: createdPeriod.id } }, select: periodSelect,
    });
    await tx.auditLog.createMany({
      data: [
        { userId, action: "CREATE", entityType: "BUDGET", entityId: budget.id },
        { userId, action: "CREATE", entityType: "BUDGET_PERIOD", entityId: period.id },
        ...period.items.map((item) => ({ userId, action: "CREATE" as const, entityType: "BUDGET_ITEM" as const, entityId: item.id })),
      ],
    });
    return summarizePeriod(tx, userId, period, new Date());
  });
}
