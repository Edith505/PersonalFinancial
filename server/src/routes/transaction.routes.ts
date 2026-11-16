import { Router } from "express";
import {
  cancelTransactionController,
  createTransactionController,
  getTransactionOptionsController,
  getTransactionFilterOptionsController,
  listTransactionsController,
} from "../controllers/transaction.controller.js";

export const transactionRouter = Router();

transactionRouter.get("/options", getTransactionOptionsController);
transactionRouter.get("/filter-options", getTransactionFilterOptionsController);
transactionRouter.get("/", listTransactionsController);
transactionRouter.post("/", createTransactionController);
transactionRouter.patch("/:id/cancel", cancelTransactionController);
