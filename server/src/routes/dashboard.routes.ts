import { Router } from "express";
import { getDashboardController } from "../controllers/dashboard.controller.js";

export const dashboardRouter = Router();
dashboardRouter.get("/", getDashboardController);
