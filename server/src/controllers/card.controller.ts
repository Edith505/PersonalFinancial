import type { RequestHandler } from "express";
import { createCard, getCardOptions, listCards, setCardStatus } from "../services/card.service.js";
import { getCurrentUserId } from "../services/currentUser.service.js";
import { AppError } from "../utils/AppError.js";
import { cardParamsSchema, createCardSchema, listCardsQuerySchema, setCardStatusSchema } from "../validators/card.validator.js";

export const listCardsController: RequestHandler = async (request, response, next) => {
  try {
    const result = listCardsQuerySchema.safeParse(request.query);
    if (!result.success) {
      throw new AppError(400, "INVALID_QUERY", "Les paramètres de recherche sont invalides.");
    }
    const userId = await getCurrentUserId();
    response.json(await listCards(userId, result.data));
  } catch (error) {
    next(error);
  }
};

export const getCardOptionsController: RequestHandler = async (_request, response, next) => {
  try {
    response.json(await getCardOptions(await getCurrentUserId()));
  } catch (error) {
    next(error);
  }
};

export const createCardController: RequestHandler = async (request, response, next) => {
  try {
    const result = createCardSchema.safeParse(request.body);
    if (!result.success) {
      throw new AppError(400, "INVALID_CARD", "Les informations de la carte sont invalides.");
    }
    const userId = await getCurrentUserId();
    response.status(201).json({ item: await createCard(userId, result.data) });
  } catch (error) {
    next(error);
  }
};

export const setCardStatusController: RequestHandler = async (request, response, next) => {
  try {
    const params = cardParamsSchema.safeParse(request.params);
    const body = setCardStatusSchema.safeParse(request.body);
    if (!params.success || !body.success) {
      throw new AppError(400, "INVALID_CARD_STATUS", "Le statut de la carte est invalide.");
    }
    const userId = await getCurrentUserId();
    const item = await setCardStatus(userId, params.data.id, body.data.isActive);
    response.json({ item });
  } catch (error) {
    next(error);
  }
};
