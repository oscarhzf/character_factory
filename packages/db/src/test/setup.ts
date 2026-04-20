import { readServerEnv } from "@character-factory/core";
import { beforeAll, beforeEach, afterAll } from "vitest";
import { Pool } from "pg";

import { closePool } from "../client";
import { ensureRootEnvLoaded } from "../load-env";
import { runMigrations } from "../migrate";

const resetStatement = `
  truncate table
    human_decisions,
    character_anchor_images,
    review_results,
    generated_images,
    prompt_versions,
    generation_jobs,
    characters,
    universes
  restart identity cascade
`;

function getTestDatabaseUrl(): string {
  ensureRootEnvLoaded();
  const env = readServerEnv();
  const databaseUrl = env.TEST_DATABASE_URL ?? env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("TEST_DATABASE_URL or DATABASE_URL must be configured for tests.");
  }

  return databaseUrl;
}

async function withTestPool<T>(
  callback: (pool: Pool) => Promise<T>
): Promise<T> {
  const pool = new Pool({
    connectionString: getTestDatabaseUrl()
  });

  try {
    return await callback(pool);
  } finally {
    await pool.end();
  }
}

async function resetDatabaseSchema(): Promise<void> {
  await withTestPool(async (pool) => {
    await pool.query("drop schema if exists public cascade");
    await pool.query("create schema public");
    await pool.query("grant all on schema public to public");
  });
}

async function truncateApplicationTables(): Promise<void> {
  await withTestPool(async (pool) => {
    await pool.query(resetStatement);
  });
}

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  await closePool();
  await resetDatabaseSchema();
  await runMigrations();
});

beforeEach(async () => {
  await closePool();
  await truncateApplicationTables();
});

afterAll(async () => {
  await closePool();
});
