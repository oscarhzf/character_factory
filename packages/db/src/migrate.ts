import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { closePool, getPool } from "./client";

const sourceDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(sourceDirectory, "../../../");
const migrationsDirectory = path.join(projectRoot, "db/migrations");

async function ensureMigrationsTable(): Promise<void> {
  const pool = getPool();

  await pool.query(`
    create table if not exists schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    )
  `);
}

async function listPendingMigrations(): Promise<string[]> {
  const pool = getPool();
  const files = (await fs.readdir(migrationsDirectory))
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();

  const appliedResult = await pool.query<{ id: string }>(
    "select id from schema_migrations"
  );
  const appliedIds = new Set(
    appliedResult.rows.map((row: { id: string }) => row.id)
  );

  return files.filter((fileName) => !appliedIds.has(fileName));
}

async function applyMigration(fileName: string): Promise<void> {
  const pool = getPool();
  const sql = await fs.readFile(path.join(migrationsDirectory, fileName), "utf8");
  const client = await pool.connect();

  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("insert into schema_migrations (id) values ($1)", [
      fileName
    ]);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function runMigrations(): Promise<string[]> {
  await ensureMigrationsTable();
  const pendingMigrations = await listPendingMigrations();

  for (const fileName of pendingMigrations) {
    await applyMigration(fileName);
  }

  return pendingMigrations;
}

function isDirectExecution(): boolean {
  const entryPoint = process.argv[1];

  if (!entryPoint) {
    return false;
  }

  return path.resolve(entryPoint) === fileURLToPath(import.meta.url);
}

async function main(): Promise<void> {
  const pendingMigrations = await runMigrations();

  for (const fileName of pendingMigrations) {
    console.log(`Applied migration: ${fileName}`);
  }

  if (pendingMigrations.length === 0) {
    console.log("No pending migrations.");
  }

  await closePool();
}

if (isDirectExecution()) {
  main().catch(async (error) => {
    console.error(error);
    await closePool();
    process.exitCode = 1;
  });
}
