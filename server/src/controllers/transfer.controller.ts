import type { RequestHandler } from "express";
import { getCurrentUserId } from "../services/currentUser.service.js";
import { cancelTransfer, createTransfer, getTransferOptions, listTransfers } from "../services/transfer.service.js";
import { AppError } from "../utils/AppError.js";
import { cancelTransferSchema, createTransferSchema, listTransfersQuerySchema, transferParamsSchema } from "../validators/transfer.validator.js";

export const cancelTransferController: RequestHandler = async (request, response, next) => {
  try {
    const params = transferParamsSchema.safeParse(request.params);
    const body = cancelTransferSchema.safeParse(request.body ?? {});
    if (!params.success || !body.success) {
      throw new AppError(400, "INVALID_TRANSFER_CANCELLATION", "Les paramètres d’annulation sont invalides.");
    }
    const userId = await getCurrentUserId();
    const transfer = await cancelTransfer(userId, params.data.id);
    response.json({ item: transfer });
  } catch (error) {
    next(error);
  }
};

export const listTransfersController: RequestHandler = async (request, response, next) => {
  try {
    const result = listTransfersQuerySchema.safeParse(request.query);
    if (!result.success) {
      throw new AppError(400, "INVALID_QUERY", "Les paramètres de recherche sont invalides.");
    }
    const userId = await getCurrentUserId();
    response.json(await listTransfers(userId, result.data));
  } catch (error) {
    next(error);
  }
};

export const getTransferOptionsController: RequestHandler = async (_request, response, next) => {
  try {
    const userId = await getCurrentUserId();
    response.json(await getTransferOptions(userId));
  } catch (error) {
    next(error);
  }
};

export const createTransferController: RequestHandler = async (request, response, next) => {
  try {
    const result = createTransferSchema.safeParse(request.body);
    if (!result.success) {
      throw new AppError(400, "INVALID_TRANSFER", "Vérifiez les comptes, le montant et la date du virement.");
    }
    const userId = await getCurrentUserId();
    const transfer = await createTransfer(userId, result.data);
    response.status(201).json({ item: transfer });
  } catch (error) {
    next(error);
  }
};
