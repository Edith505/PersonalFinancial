import type { RequestHandler } from "express";
import {
  createCategory,
  listCategories,
} from "../services/category.service.js";
import { getCurrentUserId } from "../services/currentUser.service.js";
import { AppError } from "../utils/AppError.js";
import {
  createCategorySchema,
  listCategoriesQuerySchema,
} from "../validators/category.validator.js";

export const listCategoriesController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const result = listCategoriesQuerySchema.safeParse(request.query);

    if (!result.success) {
      throw new AppError(
        400,
        "INVALID_QUERY",
        "Les paramètres de recherche sont invalides.",
      );
    }

    const userId = await getCurrentUserId();
    const categories = await listCategories(userId, result.data);

    response.json(categories);
  } catch (error) {
    next(error);
  }
};

export const createCategoryController: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const result = createCategorySchema.safeParse(request.body);

    if (!result.success) {
      throw new AppError(
        400,
        "INVALID_CATEGORY",
        "Le nom et le type de catégorie sont invalides.",
      );
    }

    const userId = await getCurrentUserId();
    const category = await createCategory(userId, result.data);

    response.status(201).json({ item: category });
  } catch (error) {
    next(error);
  }
};