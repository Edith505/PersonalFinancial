import { Router } from "express";
import { createProfileController, listProfilesController } from "../controllers/profile.controller.js";

export const profileRouter = Router();
profileRouter.get("/", listProfilesController);
profileRouter.post("/", createProfileController);
