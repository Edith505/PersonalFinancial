import type { RequestHandler } from "express";
import { listAccounts } from "../services/account.service.js";
import { getCurrentUserId } from "../services/currentUser.service.js";
import { AppError } from "../utils/AppError.js";
import { listAccountsQuerySchema } from "../validators/account.validator.js";

export const listAccountsController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const result = listAccountsQuerySchema.safeParse(request.query);

    if (!result.success) {
      throw new AppError(
        400,
        "INVALID_QUERY",
        "Les paramètres de pagination sont invalides.",
      );
    }

    const userId = await getCurrentUserId();
    const accounts = await listAccounts(userId, result.data);

    response.json(accounts);
  } catch (error) {
    next(error);
  }
};