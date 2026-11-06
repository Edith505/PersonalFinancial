import assert from "node:assert/strict";
import { once } from "node:events";
import { cp, mkdir, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const serverRoot = fileURLToPath(new URL("../", import.meta.url));

test("API des categories sur une base temporaire", async (t) => {
  // La copie du serveur conserve la resolution de ses dependances locales,
  // mais son chemin relatif de base pointe uniquement vers ce dossier.
  const temporaryRoot = await mkdtemp(path.join(serverRoot, ".categories-test-"));
  let httpServer;
  let prisma;

  try {
    await cp(path.join(serverRoot, "dist"), path.join(temporaryRoot, "dist"), {
      recursive: true,
    });
    await mkdir(path.join(temporaryRoot, "prisma"));
    const database = new DatabaseSync(path.join(temporaryRoot, "prisma", "demo.db"));
    try {
      database.exec("PRAGMA foreign_keys = ON;");
      const migrationRoot = path.join(serverRoot, "prisma", "migrations");
      const migrations = await readdir(migrationRoot, { withFileTypes: true });
      for (const name of migrations.filter((item) => item.isDirectory()).map((item) => item.name).sort()) {
        database.exec(await readFile(path.join(migrationRoot, name, "migration.sql"), "utf8"));
      }
    } finally {
      database.close();
    }

    process.env.DATABASE_URL = "file:./prisma/demo.db";
    process.env.FRONTEND_ORIGIN = "http://127.0.0.1:5173";
    process.env.PORT = "3001";
    const moduleUrl = (name) => pathToFileURL(path.join(temporaryRoot, "dist", name)).href;
    ({ prisma } = await import(moduleUrl("config/database.js")));
    const { app } = await import(moduleUrl("app.js"));
    const ownerId = `c${String(1).padStart(24, "0")}`;
    const otherId = "category-test-other-user";
    await prisma.user.create({ data: { id: ownerId, displayName: "Test principal" } });
    await prisma.user.create({ data: { id: otherId, displayName: "Autre utilisateur" } });
    await prisma.category.create({ data: { userId: otherId, name: "Alimentation", type: "EXPENSE" } });

    httpServer = app.listen(0, "127.0.0.1");
    await once(httpServer, "listening");
    const baseUrl = `http://127.0.0.1:${httpServer.address().port}/api/categories`;
    async function request(suffix = "", body) {
      const response = await fetch(baseUrl + suffix, body === undefined ? {} : {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return { status: response.status, body: await response.json() };
    }

    await t.test("isolation du proprietaire et liste vide", async () => {
      const result = await request();
      assert.equal(result.status, 200);
      assert.deepEqual(result.body.items, []);
      assert.equal(result.body.pagination.total, 0);
    });

    await t.test("donnees invalides refusees sans ecriture", async () => {
      for (const body of [
        { name: "   ", type: "EXPENSE" },
        { name: "Test", type: "TRANSFER" },
        { name: "Test", type: "EXPENSE", userId: otherId },
      ]) {
        const result = await request("", body);
        assert.equal(result.status, 400);
        assert.equal(result.body.error.code, "INVALID_CATEGORY");
      }
      assert.equal(await prisma.category.count({ where: { userId: ownerId } }), 0);
      assert.equal(await prisma.auditLog.count(), 0);
    });

    await t.test("creation et audit avec proprietaire serveur", async () => {
      for (const input of [
        { name: " Alimentation ", type: "EXPENSE" },
        { name: "Transport", type: "EXPENSE" },
        { name: "Salaire", type: "INCOME" },
      ]) {
        const result = await request("", input);
        assert.equal(result.status, 201);
        assert.equal(result.body.item.name, input.name.trim());
        assert.equal(result.body.item.isActive, true);
        assert.equal("userId" in result.body.item, false);
        const saved = await prisma.category.findUnique({ where: { id: result.body.item.id } });
        assert.equal(saved.userId, ownerId);
        assert.equal(await prisma.auditLog.count({ where: {
          userId: ownerId, entityId: saved.id, action: "CREATE", entityType: "CATEGORY",
        } }), 1);
      }
    });

    await t.test("doublon refuse sans audit supplementaire", async () => {
      const result = await request("", { name: "Alimentation", type: "EXPENSE" });
      assert.equal(result.status, 409);
      assert.equal(result.body.error.code, "CATEGORY_ALREADY_EXISTS");
      assert.equal(await prisma.category.count({ where: { userId: ownerId } }), 3);
      assert.equal(await prisma.auditLog.count({ where: { userId: ownerId } }), 3);
    });

    await t.test("filtrage et pagination sans fuite entre utilisateurs", async () => {
      const first = await request("?type=EXPENSE&pageSize=1&page=1");
      const second = await request("?type=EXPENSE&pageSize=1&page=2");
      for (const result of [first, second]) {
        assert.equal(result.status, 200);
        assert.equal(result.body.items.length, 1);
        assert.equal(result.body.items[0].type, "EXPENSE");
        assert.equal(result.body.pagination.total, 2);
        assert.equal(result.body.pagination.totalPages, 2);
      }
      assert.notEqual(first.body.items[0].id, second.body.items[0].id);
      const income = await request("?type=INCOME");
      assert.equal(income.body.pagination.total, 1);
      assert.equal(income.body.items[0].name, "Salaire");
    });

    await t.test("parametres invalides refuses", async () => {
      for (const suffix of ["?userId=autre", "?type=TRANSFER", "?page=0", "?pageSize=500"]) {
        const result = await request(suffix);
        assert.equal(result.status, 400);
        assert.equal(result.body.error.code, "INVALID_QUERY");
      }
    });
  } finally {
    if (httpServer) await new Promise((resolve, reject) => httpServer.close((error) => error ? reject(error) : resolve()));
    if (prisma) await prisma.$disconnect();
    // Verification du chemin avant suppression recursive de la copie de test.
    if (path.dirname(temporaryRoot) !== path.resolve(serverRoot) || !path.basename(temporaryRoot).startsWith(".categories-test-")) {
      throw new Error("Chemin temporaire inattendu : nettoyage annule.");
    }
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
