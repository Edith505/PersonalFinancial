import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import type { DashboardQuery } from "../validators/dashboard.validator.js";
import { getAccountBalances } from "./account-balances.js";

export async function getDashboard(userId: string, query: DashboardQuery) {
  const asOf = new Date();
  const month = query.month ?? asOf.toISOString().slice(0, 7);
  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7)) - 1;

  return prisma.$transaction(async (tx) => {
    const currencies = await tx.currency.findMany({
      where: { OR: [{ isActive: true }, { accounts: { some: { userId } } }] },
      select: { code: true, name: true, minorUnit: true },
      orderBy: { code: "asc" },
    });
    const setting = await tx.setting.findUnique({
      where: { userId },
      select: { defaultCurrencyCode: true },
    });
    const defaultCurrency = currencies.find((item) => item.code === setting?.defaultCurrencyCode) ?? currencies[0];
    const currency = query.currencyCode
      ? currencies.find((item) => item.code === query.currencyCode)
      : defaultCurrency;
    if (!currency) throw new AppError(400, "INVALID_CURRENCY", "Cette devise n’est pas disponible.");

    const accounts = await tx.financialAccount.findMany({
      // Les comptes inactifs restent inclus : leur désactivation n'efface pas leur solde.
      where: { userId, currencyCode: currency.code },
      select: { id: true, type: true, openingBalanceMinor: true, openingBalanceDate: true },
    });
    const balances = await getAccountBalances(tx, userId, accounts, asOf);
    let netBalanceMinor = 0n;
    let savingsMinor = 0n;
    let creditOutstandingMinor = 0n;
    for (const account of accounts) {
      const balance = balances.get(account.id) ?? 0n;
      netBalanceMinor += balance;
      if (account.type === "SAVINGS") savingsMinor += balance;
      if (account.type === "CREDIT" && balance < 0n) creditOutstandingMinor -= balance;
    }

    const cashFlow: Array<{ month: string; incomeMinor: string; expensesMinor: string }> = [];
    for (let offset = -5; offset <= 0; offset += 1) {
      const start = new Date(Date.UTC(year, monthIndex + offset, 1));
      const end = new Date(Date.UTC(year, monthIndex + offset + 1, 1));
      const totals = await tx.transaction.groupBy({
        by: ["type"],
        where: {
          userId,
          currencyCode: currency.code,
          status: "POSTED",
          type: { in: ["INCOME", "EXPENSE"] },
          transactionDate: { gte: start, lt: end, lte: asOf },
        },
        _sum: { amountMinor: true },
      });
      cashFlow.push({
        month: start.toISOString().slice(0, 7),
        incomeMinor: (totals.find((item) => item.type === "INCOME")?._sum.amountMinor ?? 0n).toString(),
        expensesMinor: (totals.find((item) => item.type === "EXPENSE")?._sum.amountMinor ?? 0n).toString(),
      });
    }

    const start = new Date(Date.UTC(year, monthIndex, 1));
    const end = new Date(Date.UTC(year, monthIndex + 1, 1));
    const recent = await tx.transaction.findMany({
      where: {
        userId,
        currencyCode: currency.code,
        status: "POSTED",
        type: { in: ["INCOME", "EXPENSE"] },
        transactionDate: { gte: start, lt: end, lte: asOf },
      },
      orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
      take: 5,
      select: {
        id: true, description: true, type: true, amountMinor: true,
        transactionDate: true, account: { select: { name: true } },
      },
    });
    const activity = cashFlow[cashFlow.length - 1];
    return {
      asOf: asOf.toISOString(),
      period: { month, timeZone: "UTC", start: start.toISOString(), endExclusive: end.toISOString() },
      currency,
      currencies,
      accountCount: accounts.length,
      balances: {
        netBalanceMinor: netBalanceMinor.toString(),
        savingsMinor: savingsMinor.toString(),
        creditOutstandingMinor: creditOutstandingMinor.toString(),
      },
      activity: { incomeMinor: activity?.incomeMinor ?? "0", expensesMinor: activity?.expensesMinor ?? "0" },
      cashFlow,
      recentTransactions: recent.map((item) => ({
        id: item.id,
        description: item.description,
        type: item.type,
        amountMinor: item.amountMinor.toString(),
        transactionDate: item.transactionDate.toISOString(),
        accountName: item.account.name,
      })),
    };
  });
}
