import type { RequestHandler } from "express";
import { getCurrentUserId } from "../services/currentUser.service.js";
import { getDashboard } from "../services/dashboard.service.js";
import { dashboardQuerySchema } from "../validators/dashboard.validator.js";
import { AppError } from "../utils/AppError.js";

export const getDashboardController: RequestHandler = async (request, response, next) => {
  try {
    const result = dashboardQuerySchema.safeParse(request.query);
    if (!result.success) throw new AppError(400, "INVALID_QUERY", "Choisissez un mois et une devise valides.");
    const userId = await getCurrentUserId();
    response.json(await getDashboard(userId, result.data));
  } catch (error) {
    next(error);
  }
};
