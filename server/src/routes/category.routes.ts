import { Router } from "express";
import {
  createCategoryController,
  listCategoriesController,
} from "../controllers/category.controller.js";

export const categoryRouter = Router();

categoryRouter.get("/", listCategoriesController);
categoryRouter.post("/", createCategoryController);