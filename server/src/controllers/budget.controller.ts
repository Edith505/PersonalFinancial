import type { RequestHandler } from "express";
import { getCurrentUserId } from "../services/currentUser.service.js";
import { copyBudgetPeriod, createBudget, getBudgetOptions, listBudgets, updateBudgetLimits } from "../services/budget.service.js";
import { budgetPeriodParamsSchema, copyBudgetPeriodSchema, createBudgetSchema, listBudgetsQuerySchema, updateBudgetLimitsSchema } from "../validators/budget.validator.js";
import { AppError } from "../utils/AppError.js";

export const copyBudgetPeriodController: RequestHandler = async (request, response, next) => {
  try {
    const params = budgetPeriodParamsSchema.safeParse(request.params);
    const body = copyBudgetPeriodSchema.safeParse(request.body);
    if (!params.success || !body.success) throw new AppError(400, "INVALID_BUDGET_COPY", "Choisissez une période source et un mois valides.");
    const userId = await getCurrentUserId();
    const budget = await copyBudgetPeriod(userId, params.data.id, params.data.periodId, body.data);
    response.status(201).json({ item: budget });
  } catch (error) { next(error); }
};

export const updateBudgetLimitsController: RequestHandler = async (request, response, next) => {
  try {
    const params = budgetPeriodParamsSchema.safeParse(request.params);
    const body = updateBudgetLimitsSchema.safeParse(request.body);
    if (!params.success || !body.success) throw new AppError(400, "INVALID_BUDGET_LIMITS", "Vérifiez les lignes et leurs plafonds. Les montants doivent être positifs ou nuls.");
    const userId = await getCurrentUserId();
    const budget = await updateBudgetLimits(userId, params.data.id, params.data.periodId, body.data);
    response.json({ item: budget });
  } catch (error) { next(error); }
};

export const listBudgetsController: RequestHandler = async (request, response, next) => {
  try {
    const result = listBudgetsQuerySchema.safeParse(request.query);
    if (!result.success) throw new AppError(400, "INVALID_QUERY", "Les paramètres de recherche sont invalides.");
    const userId = await getCurrentUserId();
    response.json(await listBudgets(userId, result.data));
  } catch (error) { next(error); }
};

export const getBudgetOptionsController: RequestHandler = async (_request, response, next) => {
  try {
    const userId = await getCurrentUserId();
    response.json(await getBudgetOptions(userId));
  } catch (error) { next(error); }
};

export const createBudgetController: RequestHandler = async (request, response, next) => {
  try {
    const result = createBudgetSchema.safeParse(request.body);
    if (!result.success) throw new AppError(400, "INVALID_BUDGET", "Vérifiez le mois, la devise et les plafonds par catégorie. Une catégorie ne peut apparaître qu’une fois.");
    const userId = await getCurrentUserId();
    const budget = await createBudget(userId, result.data);
    response.status(201).json({ item: budget });
  } catch (error) { next(error); }
};
