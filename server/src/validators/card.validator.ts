import { z } from "zod";

export const listCardsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
}).strict();

export type ListCardsQuery = z.infer<typeof listCardsQuerySchema>;

const cardNameSchema = z.string().trim().min(1).max(100)
  .transform((value) => value.normalize("NFC"));

export const createCardSchema = z.object({
  linkedAccountId: z.string().trim().min(1).max(100),
  nickname: cardNameSchema,
  cardholderName: cardNameSchema,
  brand: z.enum(["VISA", "MASTERCARD", "AMEX", "OTHER"]),
  type: z.enum(["CREDIT", "DEBIT", "PREPAID", "OTHER"]),
  last4: z.string().regex(/^\d{4}$/),
  expiryMonth: z.number().int().min(1).max(12).nullable().optional(),
  expiryYear: z.number().int().min(2000).max(2099).nullable().optional(),
}).strict().refine(
  (value) => (value.expiryMonth == null) === (value.expiryYear == null),
  { message: "Fournissez le mois et l’année d’expiration ensemble.", path: ["expiryMonth"] },
);

export type CreateCardInput = z.infer<typeof createCardSchema>;

export const cardParamsSchema = z.object({
  id: z.string().trim().min(1).max(100),
}).strict();

export const setCardStatusSchema = z.object({
  isActive: z.boolean(),
}).strict();
