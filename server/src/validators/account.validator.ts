import { z } from "zod";

export const listAccountsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(10000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export type ListAccountsQuery = z.infer<
  typeof listAccountsQuerySchema
>;

// Limite applicative, en unités mineures.
const MAX_AMOUNT_MINOR = 999_999_999_999n;

const signedAmountSchema = z
  .string()
  .max(14)
  .regex(/^(0|-?[1-9]\d*)$/, "Un entier sous forme de texte est attendu.")
  .transform((value) => BigInt(value))
  .pipe(
    z.bigint().min(-MAX_AMOUNT_MINOR).max(MAX_AMOUNT_MINOR),
  );

const creditLimitSchema = z
  .string()
  .max(12)
  .regex(/^[1-9]\d*$/, "La limite doit être strictement positive.")
  .transform((value) => BigInt(value))
  .pipe(z.bigint().max(MAX_AMOUNT_MINOR));

export const createAccountSchema = z
  .object({
    financialProfileId: z.string().trim().min(1).max(100),
    name: z.string().trim().min(1).max(100),
    type: z.enum([
      "CHECKING",
      "SAVINGS",
      "CASH",
      "CREDIT",
      "LIABILITY",
      "INVESTMENT",
      "MOBILE_MONEY",
      "OTHER",
    ]),
    currencyCode: z.string().regex(/^[A-Z]{3}$/),
    openingBalanceMinor: signedAmountSchema,
    openingBalanceDate: z.iso.datetime({ offset: true }),
    creditLimitMinor: creditLimitSchema.nullable().optional(),
    institutionName: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().min(1).max(1000).optional(),
  })
  .strict()
  .superRefine((data, context) => {
    if (data.type !== "CREDIT" && data.creditLimitMinor != null) {
      context.addIssue({
        code: "custom",
        path: ["creditLimitMinor"],
        message: "La limite de crédit nécessite un compte CREDIT.",
      });
    }

    const openingDate = new Date(data.openingBalanceDate);

    if (
      !Number.isFinite(openingDate.getTime()) ||
      openingDate.getTime() > Date.now()
    ) {
      context.addIssue({
        code: "custom",
        path: ["openingBalanceDate"],
        message: "La date d’ouverture doit être valide et non future.",
      });
    }
  });

export type CreateAccountInput = z.infer<typeof createAccountSchema>;

export const accountParamsSchema = z
  .object({
    id: z.string().min(1).max(100),
  })
  .strict();

export const accountStatusSchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();

export const updateAccountSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    institutionName: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .nullable()
      .optional(),
    description: z
      .string()
      .trim()
      .min(1)
      .max(1000)
      .nullable()
      .optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.name !== undefined ||
      data.institutionName !== undefined ||
      data.description !== undefined,
    "Au moins un champ doit être fourni.",
  );

export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;