import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1024).max(65535).default(3001),
  FRONTEND_ORIGIN: z
    .literal("http://127.0.0.1:5173")
    .default("http://127.0.0.1:5173"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const invalidFields = result.error.issues
    .map((issue) => issue.path.join("."))
    .join(", ");

  console.error(`Configuration invalide : ${invalidFields}`);
  process.exit(1);
}

export const env = result.data;