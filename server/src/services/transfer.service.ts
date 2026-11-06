import { prisma } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import { AppError } from "../utils/AppError.js";
import type {
  CreateTransferInput,
  ListTransfersQuery,
} from "../validators/transfer.validator.js";

const transferSelect = {
  id: true,
  description: true,
  status: true,
  sourceAmountMinor: true,
  destinationAmountMinor: true,
  sourceCurrencyCode: true,
  destinationCurrencyCode: true,
  exchangeRate: true,
  transferDate: true,
  postedAt: true,
  sourceAccount: {
    select: { id: true, name: true, currency: { select: { minorUnit: true } } },
  },
  destinationAccount: {
    select: { id: true, name: true, currency: { select: { minorUnit: true } } },
  },
} satisfies Prisma.TransferSelect;

type SelectedTransfer = Prisma.TransferGetPayload<{ select: typeof transferSelect }>;

function serializeTransfer(transfer: SelectedTransfer) {
  return {
    id: transfer.id,
    description: transfer.description,
    status: transfer.status,
    sourceAmountMinor: transfer.sourceAmountMinor.toString(),
    destinationAmountMinor: transfer.destinationAmountMinor.toString(),
    sourceCurrencyCode: transfer.sourceCurrencyCode,
    destinationCurrencyCode: transfer.destinationCurrencyCode,
    sourceMinorUnit: transfer.sourceAccount.currency.minorUnit,
    destinationMinorUnit: transfer.destinationAccount.currency.minorUnit,
    exchangeRate: transfer.exchangeRate,
    transferDate: transfer.transferDate.toISOString(),
    postedAt: transfer.postedAt?.toISOString() ?? null,
    sourceAccount: { id: transfer.sourceAccount.id, name: transfer.sourceAccount.name },
    destinationAccount: { id: transfer.destinationAccount.id, name: transfer.destinationAccount.name },
  };
}

export async function listTransfers(userId: string, query: ListTransfersQuery) {
  const where: Prisma.TransferWhereInput = {
    userId,
    ...(query.accountId ? {
      OR: [
        { sourceAccountId: query.accountId },
        { destinationAccountId: query.accountId },
      ],
    } : {}),
  };

  return prisma.$transaction(async (tx) => {
    const total = await tx.transfer.count({ where });
    const transfers = await tx.transfer.findMany({
      where,
      orderBy: [{ transferDate: "desc" }, { id: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: transferSelect,
    });

    return {
      items: transfers.map(serializeTransfer),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  });
}

export async function cancelTransfer(userId: string, transferId: string) {
  return prisma.$transaction(async (tx) => {
    const transfer = await tx.transfer.findUnique({
      where: { userId_id: { userId, id: transferId } },
      select: {
        ...transferSelect,
        feeTransactionId: true,
        debtPayment: { select: { id: true } },
      },
    });

    if (!transfer) {
      throw new AppError(404, "TRANSFER_NOT_FOUND", "Le virement demandé est indisponible.");
    }
    if (transfer.status === "CANCELLED") {
      return serializeTransfer(transfer);
    }
    if (transfer.status !== "POSTED") {
      throw new AppError(409, "TRANSFER_NOT_CANCELLABLE", "Seuls les virements comptabilisés peuvent être annulés ici.");
    }
    if (transfer.feeTransactionId || transfer.debtPayment) {
      throw new AppError(409, "TRANSFER_LINKED", "Ce virement comporte des frais ou un remboursement de dette lié. Ces opérations doivent être traitées ensemble.");
    }

    // Le statut unique retire simultanément le débit et le crédit du calcul
    // des soldes. Les montants, comptes et dates historiques sont conservés.
    // Une correction reste possible même si un compte a été désactivé.
    const cancelled = await tx.transfer.update({
      where: { userId_id: { userId, id: transferId } },
      data: { status: "CANCELLED" },
      select: transferSelect,
    });
    await tx.auditLog.create({
      data: {
        userId,
        action: "CANCEL",
        entityType: "TRANSFER",
        entityId: transferId,
      },
    });
    return serializeTransfer(cancelled);
  });
}

export async function getTransferOptions(userId: string) {
  const accounts = await prisma.financialAccount.findMany({
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
      currencyCode: true,
      openingBalanceDate: true,
      currency: { select: { minorUnit: true } },
      financialProfile: { select: { id: true, name: true } },
    },
  });

  return {
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      currencyCode: account.currencyCode,
      minorUnit: account.currency.minorUnit,
      openingBalanceDate: account.openingBalanceDate.toISOString(),
      financialProfile: account.financialProfile,
    })),
  };
}

export async function createTransfer(userId: string, input: CreateTransferInput) {
  return prisma.$transaction(async (tx) => {
    if (input.sourceAccountId === input.destinationAccountId) {
      throw new AppError(400, "SAME_TRANSFER_ACCOUNT", "Choisissez deux comptes différents.");
    }

    const accounts = await tx.financialAccount.findMany({
      where: { userId, id: { in: [input.sourceAccountId, input.destinationAccountId] } },
      select: {
        id: true,
        isActive: true,
        currencyCode: true,
        openingBalanceDate: true,
        financialProfile: { select: { isActive: true } },
        currency: { select: { isActive: true } },
      },
    });
    const source = accounts.find((account) => account.id === input.sourceAccountId);
    const destination = accounts.find((account) => account.id === input.destinationAccountId);
    if (!source || !destination) {
      throw new AppError(404, "TRANSFER_ACCOUNT_NOT_FOUND", "Un des comptes demandés est indisponible.");
    }
    if (accounts.some((account) => !account.isActive || !account.financialProfile.isActive || !account.currency.isActive)) {
      throw new AppError(409, "TRANSFER_ACCOUNT_UNAVAILABLE", "Les deux comptes, leurs profils et leurs devises doivent être actifs.");
    }
    if (source.currencyCode !== destination.currencyCode) {
      throw new AppError(400, "TRANSFER_CURRENCY_MISMATCH", "Cette opération nécessite deux comptes de même devise.");
    }

    const transferDate = new Date(input.transferDate);
    const postedAt = new Date();
    if (!Number.isFinite(transferDate.getTime()) || transferDate > postedAt) {
      throw new AppError(400, "INVALID_TRANSFER_DATE", "La date du virement doit être valide et non future.");
    }
    if (transferDate < source.openingBalanceDate || transferDate < destination.openingBalanceDate) {
      throw new AppError(400, "TRANSFER_BEFORE_OPENING", "Le virement ne peut pas précéder le début du suivi de l’un des comptes.");
    }

    // Un seul enregistrement porte les deux côtés du mouvement.
    // listAccounts soustrait le montant source et ajoute le montant destinataire.
    const transfer = await tx.transfer.create({
      data: {
        userId,
        sourceAccountId: source.id,
        destinationAccountId: destination.id,
        sourceAmountMinor: input.amountMinor,
        destinationAmountMinor: input.amountMinor,
        sourceCurrencyCode: source.currencyCode,
        destinationCurrencyCode: destination.currencyCode,
        exchangeRate: "1",
        description: input.description ?? null,
        transferDate,
        status: "POSTED",
        postedAt,
      },
      select: transferSelect,
    });

    await tx.auditLog.create({
      data: {
        userId,
        entityType: "TRANSFER",
        entityId: transfer.id,
        action: "CREATE",
      },
    });

    return serializeTransfer(transfer);
  });
}
