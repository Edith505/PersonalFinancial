import type { RequestHandler } from "express";
import { getCurrentUserId } from "../services/currentUser.service.js";
import { createProfile, listProfiles } from "../services/profile.service.js";
import { AppError } from "../utils/AppError.js";
import { createProfileSchema, listProfilesQuerySchema } from "../validators/profile.validator.js";

export const listProfilesController: RequestHandler = async (request, response, next) => {
  try {
    const query = listProfilesQuerySchema.safeParse(request.query);
    if (!query.success) throw new AppError(400, "INVALID_QUERY", "Les paramètres de recherche sont invalides.");
    response.json(await listProfiles(await getCurrentUserId(), query.data));
  } catch (error) {
    next(error);
  }
};

export const createProfileController: RequestHandler = async (request, response, next) => {
  try {
    const body = createProfileSchema.safeParse(request.body);
    if (!body.success) throw new AppError(400, "INVALID_PROFILE", "Les informations du profil sont invalides.");
    response.status(201).json({ item: await createProfile(await getCurrentUserId(), body.data) });
  } catch (error) {
    next(error);
  }
};
