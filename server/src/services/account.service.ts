import { prisma } from "../config/database.js";
import type {
  CreateAccountInput,
  ListAccountsQuery,
  UpdateAccountInput,
} from "../validators/account.validator.js";

import { AppError } from "../utils/AppError.js";



export async function listAccounts(
  userId: string,
  query: ListAccountsQuery,
) {
  const asOf = new Date();

  return prisma.$transaction(async (tx) => {
    const total = await tx.financialAccount.count({
      where: { userId },
    });

    const accounts = await tx.financialAccount.findMany({
      where: { userId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: {
        id: true,
        name: true,
        type: true,
        currencyCode: true,
        openingBalanceMinor: true,
        openingBalanceDate: true,
        creditLimitMinor: true,
        isActive: true,
        financialProfile: {
          select: {
            id: true,
            name: true,
          },
        },
        currency: {
          select: {
            minorUnit: true,
          },
        },
      },
    });

    const balances = new Map<string, bigint>(
      accounts.map((account) => [
        account.id,
        account.openingBalanceDate <= asOf
          ? account.openingBalanceMinor
          : 0n,
      ]),
    );

    if (accounts.length > 0) {
      const transactionTotals = await tx.transaction.groupBy({
        by: ["accountId", "type"],
        where: {
          userId,
          status: "POSTED",
          OR: accounts.map((account) => ({
            accountId: account.id,
            transactionDate: {
              gte: account.openingBalanceDate,
              lte: asOf,
            },
          })),
        },
        _sum: { amountMinor: true },
      });

      for (const total of transactionTotals) {
        const amount = total._sum.amountMinor ?? 0n;
        const movement = total.type === "EXPENSE" ? -amount : amount;

        balances.set(
          total.accountId,
          (balances.get(total.accountId) ?? 0n) + movement,
        );
      }

      const outgoingTotals = await tx.transfer.groupBy({
        by: ["sourceAccountId"],
        where: {
          userId,
          status: "POSTED",
          OR: accounts.map((account) => ({
            sourceAccountId: account.id,
            transferDate: {
              gte: account.openingBalanceDate,
              lte: asOf,
            },
          })),
        },
        _sum: { sourceAmountMinor: true },
      });

      for (const total of outgoingTotals) {
        balances.set(
          total.sourceAccountId,
          (balances.get(total.sourceAccountId) ?? 0n) -
            (total._sum.sourceAmountMinor ?? 0n),
        );
      }

      const incomingTotals = await tx.transfer.groupBy({
        by: ["destinationAccountId"],
        where: {
          userId,
          status: "POSTED",
          OR: accounts.map((account) => ({
            destinationAccountId: account.id,
            transferDate: {
              gte: account.openingBalanceDate,
              lte: asOf,
            },
          })),
        },
        _sum: { destinationAmountMinor: true },
      });

      for (const total of incomingTotals) {
        balances.set(
          total.destinationAccountId,
          (balances.get(total.destinationAccountId) ?? 0n) +
            (total._sum.destinationAmountMinor ?? 0n),
        );
      }
    }

    return {
      items: accounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        currencyCode: account.currencyCode,
        minorUnit: account.currency.minorUnit,
        openingBalanceMinor: account.openingBalanceMinor.toString(),
        openingBalanceDate: account.openingBalanceDate.toISOString(),
        balanceMinor: (balances.get(account.id) ?? 0n).toString(),
        creditLimitMinor: account.creditLimitMinor?.toString() ?? null,
        isActive: account.isActive,
        financialProfile: account.financialProfile,
      })),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
      asOf: asOf.toISOString(),
    };
  });
}

export async function createAccount(
  userId: string,
  input: CreateAccountInput,
) {
  return prisma.$transaction(async (tx) => {
    const profile = await tx.financialProfile.findFirst({
      where: {
        id: input.financialProfileId,
        userId,
        isActive: true,
      },
      select: { id: true, name: true },
    });

    if (!profile) {
      throw new AppError(
        404,
        "PROFILE_NOT_FOUND",
        "Le profil demandé est indisponible.",
      );
    }

    const currency = await tx.currency.findFirst({
      where: {
        code: input.currencyCode,
        isActive: true,
      },
      select: { code: true, minorUnit: true },
    });

    if (!currency) {
      throw new AppError(
        400,
        "INVALID_CURRENCY",
        "Cette devise n’est pas disponible.",
      );
    }

    const account = await tx.financialAccount.create({
      data: {
        userId,
        financialProfileId: profile.id,
        name: input.name,
        type: input.type,
        currencyCode: currency.code,
        openingBalanceMinor: input.openingBalanceMinor,
        openingBalanceDate: new Date(input.openingBalanceDate),
        creditLimitMinor: input.creditLimitMinor ?? null,
        institutionName: input.institutionName ?? null,
        description: input.description ?? null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        type: true,
        currencyCode: true,
        openingBalanceMinor: true,
        openingBalanceDate: true,
        creditLimitMinor: true,
        isActive: true,
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "CREATE",
        entityType: "FINANCIAL_ACCOUNT",
        entityId: account.id,
      },
    });

    return {
      id: account.id,
      name: account.name,
      type: account.type,
      currencyCode: account.currencyCode,
      minorUnit: currency.minorUnit,
      openingBalanceMinor: account.openingBalanceMinor.toString(),
      openingBalanceDate: account.openingBalanceDate.toISOString(),
      balanceMinor: account.openingBalanceMinor.toString(),
      creditLimitMinor: account.creditLimitMinor?.toString() ?? null,
      isActive: account.isActive,
      financialProfile: profile,
    };
  });
}

export async function updateAccount(
  userId: string,
  accountId: string,
  input: UpdateAccountInput,
) {
  return prisma.$transaction(async (tx) => {
    const account = await tx.financialAccount.findUnique({
      where: {
        userId_id: { userId, id: accountId },
      },
      select: {
        id: true,
        name: true,
        institutionName: true,
        description: true,
      },
    });

    if (!account) {
      throw new AppError(
        404,
        "ACCOUNT_NOT_FOUND",
        "Le compte demandé est indisponible.",
      );
    }

    const data = {
      name: input.name ?? account.name,
      institutionName:
        input.institutionName === undefined
          ? account.institutionName
          : input.institutionName,
      description:
        input.description === undefined
          ? account.description
          : input.description,
    };

    const hasChanges =
      data.name !== account.name ||
      data.institutionName !== account.institutionName ||
      data.description !== account.description;

    if (!hasChanges) {
      return account;
    }

    const updatedAccount = await tx.financialAccount.update({
      where: {
        userId_id: { userId, id: accountId },
      },
      data,
      select: {
        id: true,
        name: true,
        institutionName: true,
        description: true,
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "UPDATE",
        entityType: "FINANCIAL_ACCOUNT",
        entityId: accountId,
      },
    });

    return updatedAccount;
  });
}

export async function setAccountStatus(
  userId: string,
  accountId: string,
  isActive: boolean,
) {
  return prisma.$transaction(async (tx) => {
    const account = await tx.financialAccount.findUnique({
      where: {
        userId_id: { userId, id: accountId },
      },
      select: {
        id: true,
        isActive: true,
        financialProfile: {
          select: { isActive: true },
        },
        currency: {
          select: { isActive: true },
        },
      },
    });

    if (!account) {
      throw new AppError(
        404,
        "ACCOUNT_NOT_FOUND",
        "Le compte demandé est indisponible.",
      );
    }

    if (account.isActive === isActive) {
      return { id: account.id, isActive: account.isActive };
    }

    if (isActive) {
      if (
        !account.financialProfile.isActive ||
        !account.currency.isActive
      ) {
        throw new AppError(
          409,
          "ACCOUNT_REACTIVATION_BLOCKED",
          "Le profil et la devise doivent être actifs.",
        );
      }
    } else {
      const activeCard = await tx.paymentCard.findFirst({
        where: {
          userId,
          linkedAccountId: accountId,
          isActive: true,
        },
        select: { id: true },
      });

      const activeSchedule = await tx.scheduledTransaction.findFirst({
        where: {
          userId,
          accountId,
          isActive: true,
        },
        select: { id: true },
      });

      if (activeCard || activeSchedule) {
        throw new AppError(
          409,
          "ACCOUNT_DEACTIVATION_BLOCKED",
          "Désactivez d’abord les cartes et opérations récurrentes liées.",
        );
      }
    }

    const updatedAccount = await tx.financialAccount.update({
      where: {
        userId_id: { userId, id: accountId },
      },
      data: { isActive },
      select: {
        id: true,
        isActive: true,
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: isActive ? "REACTIVATE" : "DEACTIVATE",
        entityType: "FINANCIAL_ACCOUNT",
        entityId: accountId,
      },
    });

    return updatedAccount;
  });
}

export async function getAccountOptions(userId: string) {
  return prisma.$transaction(async (tx) => {
    const profiles = await tx.financialProfile.findMany({
      where: { userId, isActive: true },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: { id: true, name: true },
    });

    const currencies = await tx.currency.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
      select: {
        code: true,
        name: true,
        minorUnit: true,
      },
    });

    return { profiles, currencies };
  });
}