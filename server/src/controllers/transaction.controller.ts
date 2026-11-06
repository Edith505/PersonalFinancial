import type { RequestHandler } from "express";
import { getCurrentUserId } from "../services/currentUser.service.js";
import {
  cancelTransaction,
  createTransaction,
  getTransactionOptions,
  listTransactions,
} from "../services/transaction.service.js";
import { AppError } from "../utils/AppError.js";
import {
  cancelTransactionSchema,
  createTransactionSchema,
  listTransactionsQuerySchema,
  transactionParamsSchema,
} from "../validators/transaction.validator.js";

export const cancelTransactionController: RequestHandler = async (request, response, next) => {
  try {
    const params = transactionParamsSchema.safeParse(request.params);
    const body = cancelTransactionSchema.safeParse(request.body ?? {});
    if (!params.success || !body.success) {
      throw new AppError(400, "INVALID_TRANSACTION_CANCELLATION", "Les paramètres d’annulation sont invalides.");
    }
    const userId = await getCurrentUserId();
    const transaction = await cancelTransaction(userId, params.data.id);
    response.json({ item: transaction });
  } catch (error) {
    next(error);
  }
};

export const listTransactionsController: RequestHandler = async (request, response, next) => {
  try {
    const result = listTransactionsQuerySchema.safeParse(request.query);
    if (!result.success) {
      throw new AppError(400, "INVALID_QUERY", "Les paramètres de recherche sont invalides.");
    }
    const userId = await getCurrentUserId();
    response.json(await listTransactions(userId, result.data));
  } catch (error) {
    next(error);
  }
};

export const getTransactionOptionsController: RequestHandler = async (_request, response, next) => {
  try {
    const userId = await getCurrentUserId();
    response.json(await getTransactionOptions(userId));
  } catch (error) {
    next(error);
  }
};

export const createTransactionController: RequestHandler = async (request, response, next) => {
  try {
    const result = createTransactionSchema.safeParse(request.body);
    if (!result.success) {
      throw new AppError(400, "INVALID_TRANSACTION", "Vérifiez le montant, la date et les informations de la transaction.");
    }
    const userId = await getCurrentUserId();
    const transaction = await createTransaction(userId, result.data);
    response.status(201).json({ item: transaction });
  } catch (error) {
    next(error);
  }
};
