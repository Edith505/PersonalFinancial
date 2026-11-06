import { Router } from "express";
import { cancelTransferController, createTransferController, getTransferOptionsController, listTransfersController } from "../controllers/transfer.controller.js";

export const transferRouter = Router();

transferRouter.get("/options", getTransferOptionsController);
transferRouter.get("/", listTransfersController);
transferRouter.post("/", createTransferController);
transferRouter.patch("/:id/cancel", cancelTransferController);
