import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "./env.js";

const relativePath = env.DATABASE_URL.slice("file:./".length);

const databasePath = fileURLToPath(
  new URL(`../../${relativePath}`, import.meta.url),
);

if (!existsSync(databasePath)) {
  throw new Error(
    "Base de démonstration introuvable. Appliquez les migrations.",
  );
}

const adapter = new PrismaBetterSqlite3({
  url: `file:${databasePath.replaceAll("\\", "/")}`,
});

export const prisma = new PrismaClient({ adapter });