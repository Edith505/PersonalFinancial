import { z } from "zod";

const identifierSchema = z.string().trim().min(1).max(100);
const transactionTypeSchema = z.enum(["INCOME", "EXPENSE"]);

export const transactionParamsSchema = z.object({ id: identifierSchema }).strict();
export const cancelTransactionSchema = z.object({}).strict();

export const listTransactionsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(10000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    type: transactionTypeSchema.optional(),
    accountId: identifierSchema.optional(),
    financialProfileId: identifierSchema.optional(),
  })
  .strict();

export const createTransactionSchema = z
  .object({
    accountId: identifierSchema,
    paymentCardId: identifierSchema.optional(),
    financialProfileId: identifierSchema,
    categoryId: identifierSchema,
    type: transactionTypeSchema,
    description: z.string().trim().min(1).max(250),
    merchant: z.string().trim().min(1).max(120).optional(),
    amountMinor: z
      .string()
      .max(12)
      .regex(/^[1-9]\d*$/, "Le montant doit être un entier positif sous forme de texte.")
      .transform((value) => BigInt(value))
      .pipe(z.bigint().min(1n).max(999_999_999_999n)),
    transactionDate: z.iso.datetime({ offset: true }),
  })
  .strict()
  .refine((value) => value.paymentCardId === undefined || value.type === "EXPENSE", {
    message: "Une carte peut être associée uniquement à une dépense.",
    path: ["paymentCardId"],
  });

export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
