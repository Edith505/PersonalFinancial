import "dotenv/config";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client.js";

if (process.env.DATABASE_URL !== "file:./prisma/demo.db") {
  throw new Error(
    "Seed refusé : DATABASE_URL doit cibler file:./prisma/demo.db.",
  );
}

const databasePath = fileURLToPath(new URL("./demo.db", import.meta.url));

if (!existsSync(databasePath)) {
  throw new Error(
    "Base de démonstration introuvable. Appliquez la migration avant le seed.",
  );
}

const adapter = new PrismaBetterSqlite3({
  url: `file:${databasePath.replaceAll("\\", "/")}`,
});

const prisma = new PrismaClient({ adapter });

// Identifiants fixes réservés aux données fictives du seed.
function demoId(value: number): string {
  return `c${String(value).padStart(24, "0")}`;
}

const userId = demoId(1);
const primaryProfileId = demoId(10);
const secondaryProfileId = demoId(11);

async function main() {
  await prisma.$transaction(async (tx) => {
    const otherUser = await tx.user.findFirst({
      where: {
        id: { not: userId },
      },
      select: { id: true },
    });

    if (otherUser) {
      throw new Error(
        "Seed refusé : cette base contient un autre utilisateur.",
      );
    }

    await tx.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: "alex.morgan@example.com",
        displayName: "Alex Morgan",
      },
    });

    for (const profile of [
      { id: primaryProfileId, name: "Profil principal" },
      { id: secondaryProfileId, name: "Profil secondaire" },
    ]) {
      await tx.financialProfile.upsert({
        where: { id: profile.id },
        update: {},
        create: {
          ...profile,
          userId,
        },
      });
    }

    for (const currency of [
      { code: "CAD", name: "Dollar canadien", minorUnit: 2 },
      { code: "MGA", name: "Ariary malgache", minorUnit: 2 },
    ]) {
      await tx.currency.upsert({
        where: { code: currency.code },
        update: {},
        create: currency,
      });
    }

    const accounts = [
      {
        id: demoId(20),
        name: "Compte principal",
        type: "CHECKING",
        openingBalanceMinor: 425000n,
        creditLimitMinor: null,
      },
      {
        id: demoId(21),
        name: "Épargne",
        type: "SAVINGS",
        openingBalanceMinor: 800000n,
        creditLimitMinor: null,
      },
      {
        id: demoId(22),
        name: "Espèces",
        type: "CASH",
        openingBalanceMinor: 15000n,
        creditLimitMinor: null,
      },
      {
        id: demoId(23),
        name: "Compte Visa Horizon",
        type: "CREDIT",
        openingBalanceMinor: -124560n,
        creditLimitMinor: 500000n,
      },
    ] as const;

    for (const account of accounts) {
      await tx.financialAccount.upsert({
        where: { id: account.id },
        update: {},
        create: {
          ...account,
          userId,
          financialProfileId: primaryProfileId,
          currencyCode: "CAD",
          openingBalanceDate: new Date("2026-11-01T00:00:00.000Z"),
          description: "Compte fictif de démonstration.",
        },
      });
    }

    await tx.paymentCard.upsert({
      where: { id: demoId(30) },
      update: {},
      create: {
        id: demoId(30),
        userId,
        linkedAccountId: demoId(23),
        nickname: "Visa Horizon",
        cardholderName: "Alex Morgan",
        brand: "VISA",
        type: "CREDIT",
        last4: "4821",
        visualTheme: "slate",
      },
    });

    await tx.setting.upsert({
      where: { userId },
      update: {},
      create: {
        id: demoId(40),
        userId,
        defaultCurrencyCode: "CAD",
        defaultFinancialProfileId: primaryProfileId,
        locale: "fr-CA",
        timeZone: "America/Toronto",
        theme: "SYSTEM",
        dateFormat: "YYYY_MM_DD",
      },
    });
  });

  const [profiles, accounts, cards] = await Promise.all([
    prisma.financialProfile.count({ where: { userId } }),
    prisma.financialAccount.count({ where: { userId } }),
    prisma.paymentCard.count({ where: { userId } }),
  ]);

  console.log("Seed de démonstration terminé.");
  console.log(`Profils : ${profiles}`);
  console.log(`Comptes : ${accounts}`);
  console.log(`Cartes : ${cards}`);
}

try {
  await main();
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Échec du seed.",
  );
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}