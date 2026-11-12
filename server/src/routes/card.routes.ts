import { Router } from "express";
import { createCardController, getCardOptionsController, listCardsController, setCardStatusController, updateCardController } from "../controllers/card.controller.js";

export const cardRouter = Router();
cardRouter.get("/", listCardsController);
cardRouter.get("/options", getCardOptionsController);
cardRouter.post("/", createCardController);
cardRouter.patch("/:id/status", setCardStatusController);
cardRouter.patch("/:id", updateCardController);
