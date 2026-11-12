import { z } from "zod";

const identifierSchema = z.string().trim().min(1).max(100);
const monthSchema = z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/);
const amountSchema = z.string().max(12).regex(/^(0|[1-9]\d*)$/)
  .transform((value) => BigInt(value))
  .pipe(z.bigint().min(0n).max(999_999_999_999n));

export const listBudgetsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  month: monthSchema.optional(),
  currencyCode: z.string().regex(/^[A-Z]{3}$/).optional(),
  financialProfileId: identifierSchema.optional(),
}).strict();

export const createBudgetSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(1000).optional(),
  month: monthSchema,
  currencyCode: z.string().regex(/^[A-Z]{3}$/),
  financialProfileId: identifierSchema.nullable().optional(),
  items: z.array(z.object({
    categoryId: identifierSchema,
    amountMinor: amountSchema,
  }).strict()).min(1).max(50),
}).strict().refine((data) => new Set(data.items.map((item) => item.categoryId)).size === data.items.length, {
  path: ["items"],
  message: "Chaque catégorie ne peut apparaître qu’une fois dans le budget.",
});

export type ListBudgetsQuery = z.infer<typeof listBudgetsQuerySchema>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;

export const budgetPeriodParamsSchema = z.object({
  id: identifierSchema,
  periodId: identifierSchema,
}).strict();

export const updateBudgetLimitsSchema = z.object({
  items: z.array(z.object({
    id: identifierSchema,
    amountMinor: amountSchema,
  }).strict()).min(1).max(50),
}).strict().refine((data) => new Set(data.items.map((item) => item.id)).size === data.items.length, {
  path: ["items"],
  message: "Chaque ligne ne peut apparaître qu’une fois.",
});

export type UpdateBudgetLimitsInput = z.infer<typeof updateBudgetLimitsSchema>;

export const copyBudgetPeriodSchema = z.object({ month: monthSchema }).strict();
export type CopyBudgetPeriodInput = z.infer<typeof copyBudgetPeriodSchema>;
