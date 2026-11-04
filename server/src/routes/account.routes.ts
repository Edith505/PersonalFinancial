import { Router } from "express";
import { listAccountsController } from "../controllers/account.controller.js";

export const accountRouter = Router();

accountRouter.get("/", listAccountsController);