import { Router } from "express";
import {
  cancelTransactionController,
  createTransactionController,
  getTransactionOptionsController,
  listTransactionsController,
} from "../controllers/transaction.controller.js";

export const transactionRouter = Router();

transactionRouter.get("/options", getTransactionOptionsController);
transactionRouter.get("/", listTransactionsController);
transactionRouter.post("/", createTransactionController);
transactionRouter.patch("/:id/cancel", cancelTransactionController);
