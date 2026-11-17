import { z } from "zod";

export const listProfilesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
}).strict();

export const createProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).transform((value) => value.normalize("NFC")),
  description: z.string().trim().min(1).max(1000).optional(),
}).strict();

export type ListProfilesQuery = z.infer<typeof listProfilesQuerySchema>;
export type CreateProfileInput = z.infer<typeof createProfileSchema>;
