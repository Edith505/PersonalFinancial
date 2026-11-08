import type { Prisma } from "../generated/prisma/client.js";

interface BalanceAccount {
  id: string;
  openingBalanceMinor: bigint;
  openingBalanceDate: Date;
}

export async function getAccountBalances(
  tx: Prisma.TransactionClient,
  userId: string,
  accounts: BalanceAccount[],
  asOf: Date,
) {
  const balances = new Map<string, bigint>(accounts.map((account) => [
    account.id,
    account.openingBalanceDate <= asOf ? account.openingBalanceMinor : 0n,
  ]));
  if (accounts.length === 0) return balances;

  const transactionTotals = await tx.transaction.groupBy({
    by: ["accountId", "type"],
    where: {
      userId,
      status: "POSTED",
      OR: accounts.map((account) => ({
        accountId: account.id,
        transactionDate: { gte: account.openingBalanceDate, lte: asOf },
      })),
    },
    _sum: { amountMinor: true },
  });
  for (const total of transactionTotals) {
    const amount = total._sum.amountMinor ?? 0n;
    balances.set(total.accountId, (balances.get(total.accountId) ?? 0n) + (total.type === "EXPENSE" ? -amount : amount));
  }

  const outgoingTotals = await tx.transfer.groupBy({
    by: ["sourceAccountId"],
    where: {
      userId,
      status: "POSTED",
      OR: accounts.map((account) => ({
        sourceAccountId: account.id,
        transferDate: { gte: account.openingBalanceDate, lte: asOf },
      })),
    },
    _sum: { sourceAmountMinor: true },
  });
  for (const total of outgoingTotals) {
    balances.set(total.sourceAccountId, (balances.get(total.sourceAccountId) ?? 0n) - (total._sum.sourceAmountMinor ?? 0n));
  }

  const incomingTotals = await tx.transfer.groupBy({
    by: ["destinationAccountId"],
    where: {
      userId,
      status: "POSTED",
      OR: accounts.map((account) => ({
        destinationAccountId: account.id,
        transferDate: { gte: account.openingBalanceDate, lte: asOf },
      })),
    },
    _sum: { destinationAmountMinor: true },
  });
  for (const total of incomingTotals) {
    balances.set(total.destinationAccountId, (balances.get(total.destinationAccountId) ?? 0n) + (total._sum.destinationAmountMinor ?? 0n));
  }
  return balances;
}
