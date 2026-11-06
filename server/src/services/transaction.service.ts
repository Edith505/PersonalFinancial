import { prisma } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import { AppError } from "../utils/AppError.js";
import type {
  CreateTransactionInput,
  ListTransactionsQuery,
} from "../validators/transaction.validator.js";

const transactionSelect = {
  id: true,
  type: true,
  status: true,
  description: true,
  merchant: true,
  amountMinor: true,
  currencyCode: true,
  transactionDate: true,
  postedAt: true,
  account: {
    select: {
      id: true,
      name: true,
      currency: { select: { minorUnit: true } },
    },
  },
  financialProfile: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, type: true } },
} satisfies Prisma.TransactionSelect;

type SelectedTransaction = Prisma.TransactionGetPayload<{
  select: typeof transactionSelect;
}>;

function serializeTransaction(transaction: SelectedTransaction) {
  return {
    id: transaction.id,
    type: transaction.type,
    status: transaction.status,
    description: transaction.description,
    merchant: transaction.merchant,
    amountMinor: transaction.amountMinor.toString(),
    currencyCode: transaction.currencyCode,
    minorUnit: transaction.account.currency.minorUnit,
    transactionDate: transaction.transactionDate.toISOString(),
    postedAt: transaction.postedAt?.toISOString() ?? null,
    account: { id: transaction.account.id, name: transaction.account.name },
    financialProfile: transaction.financialProfile,
    category: transaction.category,
  };
}

export async function cancelTransaction(userId: string, transactionId: string) {
  return prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.findUnique({
      where: { userId_id: { userId, id: transactionId } },
      select: {
        ...transactionSelect,
        transferAsFee: { select: { id: true } },
        scheduledOccurrence: { select: { id: true } },
      },
    });

    if (!transaction) {
      throw new AppError(404, "TRANSACTION_NOT_FOUND", "La transaction demandée est indisponible.");
    }

    // Une nouvelle tentative après une réponse réseau perdue reste sans effet.
    if (transaction.status === "CANCELLED") {
      return serializeTransaction(transaction);
    }

    if (transaction.transferAsFee || transaction.scheduledOccurrence) {
      throw new AppError(409, "TRANSACTION_LINKED", "Cette transaction dépend d’un virement ou d’une opération récurrente. Son annulation doit être traitée avec l’opération liée.");
    }

    if (transaction.status !== "POSTED" || transaction.type === "ADJUSTMENT") {
      throw new AppError(409, "TRANSACTION_NOT_CANCELLABLE", "Seuls les revenus et dépenses comptabilisés peuvent être annulés ici.");
    }

    // Le compte peut être inactif : corriger son historique reste possible.
    // La date de comptabilisation initiale est conservée pour la traçabilité.
    const cancelled = await tx.transaction.update({
      where: { userId_id: { userId, id: transactionId } },
      data: { status: "CANCELLED" },
      select: transactionSelect,
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "CANCEL",
        entityType: "TRANSACTION",
        entityId: transactionId,
      },
    });

    // listAccounts exclut déjà les transactions qui ne sont pas POSTED.
    return serializeTransaction(cancelled);
  });
}

export async function listTransactions(userId: string, query: ListTransactionsQuery) {
  const where: Prisma.TransactionWhereInput = {
    userId,
    ...(query.type ? { type: query.type } : {}),
    ...(query.accountId ? { accountId: query.accountId } : {}),
    ...(query.financialProfileId ? { financialProfileId: query.financialProfileId } : {}),
  };

  return prisma.$transaction(async (tx) => {
    const total = await tx.transaction.count({ where });
    const items = await tx.transaction.findMany({
      where,
      orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: transactionSelect,
    });

    return {
      items: items.map(serializeTransaction),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  });
}

export async function getTransactionOptions(userId: string) {
  return prisma.$transaction(async (tx) => {
    const profiles = await tx.financialProfile.findMany({
      where: { userId, isActive: true },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: { id: true, name: true },
    });
    const accounts = await tx.financialAccount.findMany({
      where: {
        userId,
        isActive: true,
        financialProfile: { isActive: true },
        currency: { isActive: true },
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        type: true,
        financialProfileId: true,
        currencyCode: true,
        openingBalanceDate: true,
        currency: { select: { minorUnit: true } },
      },
    });
    const categories = await tx.category.findMany({
      where: { userId, isActive: true },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: { id: true, name: true, type: true },
    });

    return {
      profiles,
      categories,
      accounts: accounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        financialProfileId: account.financialProfileId,
        currencyCode: account.currencyCode,
        minorUnit: account.currency.minorUnit,
        openingBalanceDate: account.openingBalanceDate.toISOString(),
      })),
    };
  });
}

export async function createTransaction(userId: string, input: CreateTransactionInput) {
  return prisma.$transaction(async (tx) => {
    const account = await tx.financialAccount.findUnique({
      where: { userId_id: { userId, id: input.accountId } },
      select: {
        id: true,
        isActive: true,
        currencyCode: true,
        openingBalanceDate: true,
        financialProfile: { select: { isActive: true } },
        currency: { select: { isActive: true } },
      },
    });
    if (!account) {
      throw new AppError(404, "ACCOUNT_NOT_FOUND", "Le compte demandé est indisponible.");
    }
    if (!account.isActive || !account.financialProfile.isActive || !account.currency.isActive) {
      throw new AppError(409, "ACCOUNT_UNAVAILABLE", "Le compte, son profil et sa devise doivent être actifs.");
    }

    // Le profil bénéficiaire peut différer du profil propriétaire du compte.
    const profile = await tx.financialProfile.findFirst({
      where: { userId, id: input.financialProfileId, isActive: true },
      select: { id: true },
    });
    if (!profile) {
      throw new AppError(404, "PROFILE_NOT_FOUND", "Le profil demandé est indisponible.");
    }

    const category = await tx.category.findFirst({
      where: { userId, id: input.categoryId, isActive: true },
      select: { id: true, type: true },
    });
    if (!category) {
      throw new AppError(404, "CATEGORY_NOT_FOUND", "La catégorie demandée est indisponible.");
    }
    if (category.type !== input.type) {
      throw new AppError(400, "CATEGORY_TYPE_MISMATCH", "Le type de la catégorie doit correspondre à celui de la transaction.");
    }

    const transactionDate = new Date(input.transactionDate);
    const postedAt = new Date();
    if (!Number.isFinite(transactionDate.getTime()) || transactionDate > postedAt) {
      throw new AppError(400, "INVALID_TRANSACTION_DATE", "La date de transaction doit être valide et non future.");
    }
    if (transactionDate < account.openingBalanceDate) {
      throw new AppError(400, "TRANSACTION_BEFORE_OPENING", "La transaction ne peut pas précéder le début du suivi du compte.");
    }

    const transaction = await tx.transaction.create({
      data: {
        userId,
        accountId: account.id,
        financialProfileId: profile.id,
        categoryId: category.id,
        type: input.type,
        description: input.description,
        merchant: input.merchant ?? null,
        amountMinor: input.amountMinor,
        currencyCode: account.currencyCode,
        transactionDate,
        status: "POSTED",
        postedAt,
      },
      select: transactionSelect,
    });
    await tx.auditLog.create({
      data: {
        userId,
        entityType: "TRANSACTION",
        entityId: transaction.id,
        action: "CREATE",
      },
    });

    // Le solde est calculé depuis le journal par listAccounts.
    // Ne pas modifier openingBalanceMinor ici : le mouvement serait compté deux fois.
    return serializeTransaction(transaction);
  });
}
