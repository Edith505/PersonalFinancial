import { Router } from "express";
import { createBudgetController, getBudgetOptionsController, listBudgetsController, updateBudgetLimitsController } from "../controllers/budget.controller.js";

export const budgetRouter = Router();
budgetRouter.get("/options", getBudgetOptionsController);
budgetRouter.get("/", listBudgetsController);
budgetRouter.post("/", createBudgetController);
budgetRouter.patch("/:id/periods/:periodId/limits", updateBudgetLimitsController);
