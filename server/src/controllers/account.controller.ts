import type { RequestHandler } from "express";
import { getCurrentUserId } from "../services/currentUser.service.js";
import { AppError } from "../utils/AppError.js";

import {
  createAccount,
  listAccounts,
  updateAccount,
  setAccountStatus,
  getAccountOptions,
  getAccountDetails,
} from "../services/account.service.js";

import {
  accountParamsSchema,
  createAccountSchema,
  listAccountsQuerySchema,
  updateAccountSchema,
  accountStatusSchema,
} from "../validators/account.validator.js";


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

export const createAccountController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const result = createAccountSchema.safeParse(request.body);

    if (!result.success) {
      throw new AppError(
        400,
        "INVALID_ACCOUNT",
        "Les données du compte sont invalides.",
      );
    }

    const userId = await getCurrentUserId();
    const account = await createAccount(userId, result.data);

    response.status(201).json({ item: account });
  } catch (error) {
    next(error);
  }
};


export const updateAccountController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const params = accountParamsSchema.safeParse(request.params);
    const body = updateAccountSchema.safeParse(request.body);

    if (!params.success || !body.success) {
      throw new AppError(
        400,
        "INVALID_ACCOUNT_UPDATE",
        "Les données de modification sont invalides.",
      );
    }

    const userId = await getCurrentUserId();

    const account = await updateAccount(
      userId,
      params.data.id,
      body.data,
    );

    response.json({ item: account });
  } catch (error) {
    next(error);
  }
};


export const setAccountStatusController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const params = accountParamsSchema.safeParse(request.params);
    const body = accountStatusSchema.safeParse(request.body);

    if (!params.success || !body.success) {
      throw new AppError(
        400,
        "INVALID_ACCOUNT_STATUS",
        "Le statut doit être un booléen isActive.",
      );
    }

    const userId = await getCurrentUserId();

    const account = await setAccountStatus(
      userId,
      params.data.id,
      body.data.isActive,
    );

    response.json({ item: account });
  } catch (error) {
    next(error);
  }
};

export const getAccountOptionsController: RequestHandler = async (
  _request,
  response,
  next,
) => {
  try {
    const userId = await getCurrentUserId();
    const options = await getAccountOptions(userId);

    response.json(options);
  } catch (error) {
    next(error);
  }
};

export const getAccountDetailsController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const params = accountParamsSchema.safeParse(request.params);

    if (!params.success) {
      throw new AppError(
        400,
        "INVALID_ACCOUNT_ID",
        "L’identifiant du compte est invalide.",
      );
    }

    const userId = await getCurrentUserId();
    const account = await getAccountDetails(userId, params.data.id);

    response.json({ item: account });
  } catch (error) {
    next(error);
  }
};