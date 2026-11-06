import { z } from "zod";

const identifierSchema = z.string().trim().min(1).max(100);

export const transferParamsSchema = z.object({ id: identifierSchema }).strict();
export const cancelTransferSchema = z.object({}).strict();

export const listTransfersQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(10000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    accountId: identifierSchema.optional(),
  })
  .strict();

export const createTransferSchema = z
  .object({
    sourceAccountId: identifierSchema,
    destinationAccountId: identifierSchema,
    amountMinor: z
      .string()
      .max(12)
      .regex(/^[1-9]\d*$/, "Le montant doit être un entier positif sous forme de texte.")
      .transform((value) => BigInt(value))
      .pipe(z.bigint().min(1n).max(999_999_999_999n)),
    transferDate: z.iso.datetime({ offset: true }),
    description: z.string().trim().min(1).max(250).optional(),
  })
  .strict()
  .refine((data) => data.sourceAccountId !== data.destinationAccountId, {
    path: ["destinationAccountId"],
    message: "Les comptes source et destinataire doivent être différents.",
  });

export type ListTransfersQuery = z.infer<typeof listTransfersQuerySchema>;
export type CreateTransferInput = z.infer<typeof createTransferSchema>;
