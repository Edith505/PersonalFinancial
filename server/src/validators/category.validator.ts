import { z } from "zod";

const categoryTypeSchema = z.enum(["INCOME", "EXPENSE"]);

export const listCategoriesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(10000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    type: categoryTypeSchema.optional(),
  })
  .strict();

export const createCategorySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .transform((name) => name.normalize("NFC")),
    type: categoryTypeSchema,
  })
  .strict();

export type ListCategoriesQuery = z.infer<
  typeof listCategoriesQuerySchema
>;

export type CreateCategoryInput = z.infer<
  typeof createCategorySchema
>;