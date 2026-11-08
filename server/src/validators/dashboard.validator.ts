import { z } from "zod";

export const dashboardQuerySchema = z.object({
  currencyCode: z.string().regex(/^[A-Z]{3}$/).optional(),
  month: z.string()
    .regex(/^(20\d{2})-(0[1-9]|1[0-2])$/)
    .refine((value) => value <= new Date().toISOString().slice(0, 7), "Choisissez un mois non futur.")
    .optional(),
}).strict();

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
