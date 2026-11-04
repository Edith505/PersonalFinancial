import { prisma } from "../config/database.js";
import type { ListAccountsQuery } from "../validators/account.validator.js";

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