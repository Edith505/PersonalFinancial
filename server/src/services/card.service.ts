import { prisma } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { CreateCardInput, ListCardsQuery, UpdateCardInput } from "../validators/card.validator.js";
import { AppError } from "../utils/AppError.js";

const cardSelect = {
  id: true,
  nickname: true,
  cardholderName: true,
  brand: true,
  type: true,
  last4: true,
  expiryMonth: true,
  expiryYear: true,
  isActive: true,
  linkedAccount: {
    select: {
      id: true,
      name: true,
      currencyCode: true,
      isActive: true,
      financialProfile: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.PaymentCardSelect;

export async function listCards(userId: string, query: ListCardsQuery) {
  const where: Prisma.PaymentCardWhereInput = {
    userId,
    ...(query.status ? { isActive: query.status === "ACTIVE" } : {}),
  };

  return prisma.$transaction(async (tx) => {
    const total = await tx.paymentCard.count({ where });
    const items = await tx.paymentCard.findMany({
      where,
      orderBy: [{ nickname: "asc" }, { id: "asc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: cardSelect,
    });
    return {
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  });
}

export async function getCardOptions(userId: string) {
  const accounts = await prisma.financialAccount.findMany({
    where: {
      userId,
      isActive: true,
      financialProfile: { userId, isActive: true },
      currency: { isActive: true },
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      currencyCode: true,
      financialProfile: { select: { id: true, name: true } },
    },
  });
  return { accounts };
}

export async function createCard(userId: string, input: CreateCardInput) {
  return prisma.$transaction(async (tx) => {
    const account = await tx.financialAccount.findFirst({
      where: { id: input.linkedAccountId, userId },
      select: {
        id: true,
        isActive: true,
        financialProfile: { select: { isActive: true } },
        currency: { select: { isActive: true } },
      },
    });
    if (!account) {
      throw new AppError(404, "ACCOUNT_NOT_FOUND", "Le compte demandé est indisponible.");
    }
    if (!account.isActive || !account.financialProfile.isActive || !account.currency.isActive) {
      throw new AppError(409, "CARD_ACCOUNT_UNAVAILABLE", "Choisissez un compte actif dont le profil et la devise sont actifs.");
    }

    const card = await tx.paymentCard.create({
      data: {
        userId,
        linkedAccountId: account.id,
        nickname: input.nickname,
        cardholderName: input.cardholderName,
        brand: input.brand,
        type: input.type,
        last4: input.last4,
        expiryMonth: input.expiryMonth ?? null,
        expiryYear: input.expiryYear ?? null,
        isActive: true,
      },
      select: cardSelect,
    });
    await tx.auditLog.create({
      data: { userId, action: "CREATE", entityType: "PAYMENT_CARD", entityId: card.id },
    });
    return card;
  });
}

export async function setCardStatus(userId: string, cardId: string, isActive: boolean) {
  return prisma.$transaction(async (tx) => {
    const card = await tx.paymentCard.findUnique({
      where: { userId_id: { userId, id: cardId } },
      select: cardSelect,
    });
    if (!card) {
      throw new AppError(404, "CARD_NOT_FOUND", "La carte demandée est indisponible.");
    }
    if (card.isActive === isActive) return card;

    if (isActive) {
      const account = await tx.financialAccount.findFirst({
        where: {
          userId,
          id: card.linkedAccount.id,
          isActive: true,
          financialProfile: { userId, isActive: true },
          currency: { isActive: true },
        },
        select: { id: true },
      });
      if (!account) {
        throw new AppError(409, "CARD_REACTIVATION_BLOCKED", "Le compte associé, son profil et sa devise doivent être actifs.");
      }
    } else {
      const activeSchedule = await tx.scheduledTransaction.findFirst({
        where: { userId, paymentCardId: cardId, isActive: true },
        select: { id: true },
      });
      if (activeSchedule) {
        throw new AppError(409, "CARD_DEACTIVATION_BLOCKED", "Désactivez d’abord les opérations planifiées actives liées à cette carte.");
      }
    }

    const updated = await tx.paymentCard.update({
      where: { userId_id: { userId, id: cardId } },
      data: { isActive },
      select: cardSelect,
    });
    await tx.auditLog.create({
      data: {
        userId,
        action: isActive ? "REACTIVATE" : "DEACTIVATE",
        entityType: "PAYMENT_CARD",
        entityId: cardId,
      },
    });
    return updated;
  });
}

export async function updateCard(userId: string, cardId: string, input: UpdateCardInput) {
  return prisma.$transaction(async (tx) => {
    const card = await tx.paymentCard.findUnique({
      where: { userId_id: { userId, id: cardId } },
      select: cardSelect,
    });
    if (!card) {
      throw new AppError(404, "CARD_NOT_FOUND", "La carte demandée est indisponible.");
    }
    const data = {
      nickname: input.nickname ?? card.nickname,
      cardholderName: input.cardholderName ?? card.cardholderName,
      expiryMonth: input.expiryMonth === undefined ? card.expiryMonth : input.expiryMonth,
      expiryYear: input.expiryYear === undefined ? card.expiryYear : input.expiryYear,
    };
    if (data.nickname === card.nickname && data.cardholderName === card.cardholderName &&
        data.expiryMonth === card.expiryMonth && data.expiryYear === card.expiryYear) {
      return card;
    }
    const updated = await tx.paymentCard.update({
      where: { userId_id: { userId, id: cardId } },
      data,
      select: cardSelect,
    });
    await tx.auditLog.create({
      data: { userId, action: "UPDATE", entityType: "PAYMENT_CARD", entityId: cardId },
    });
    return updated;
  });
}
