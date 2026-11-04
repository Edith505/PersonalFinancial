import { Router } from "express";
import {
  createAccountController,
  listAccountsController,
  updateAccountController,
  setAccountStatusController,
  getAccountOptionsController,
} from "../controllers/account.controller.js";

export const accountRouter = Router();

accountRouter.get("/", listAccountsController);
accountRouter.post("/", createAccountController);
accountRouter.patch("/:id", updateAccountController);
accountRouter.patch("/:id/status", setAccountStatusController);
accountRouter.get("/options", getAccountOptionsController);