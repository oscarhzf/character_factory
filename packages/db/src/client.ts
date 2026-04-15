import { readServerEnv } from "@character-factory/core";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { ensureRootEnvLoaded } from "./load-env";
import * as schema from "./schema";

const globalScope = globalThis as typeof globalThis & {
  __characterFactoryPool?: Pool;
};

export function getDatabaseUrl(): string {
  ensureRootEnvLoaded();
  const env = readServerEnv();
  const isTestRuntime =
    env.NODE_ENV === "test" || process.env.VITEST === "true";
  const candidateDatabaseUrl =
    isTestRuntime ? env.TEST_DATABASE_URL ?? env.DATABASE_URL : env.DATABASE_URL;

  if (!candidateDatabaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return candidateDatabaseUrl;
}

export function getPool(): Pool {
  if (!globalScope.__characterFactoryPool) {
    globalScope.__characterFactoryPool = new Pool({
      connectionString: getDatabaseUrl()
    });
  }

  return globalScope.__characterFactoryPool;
}

export function getDb() {
  return drizzle(getPool(), { schema });
}

export async function closePool(): Promise<void> {
  if (!globalScope.__characterFactoryPool) {
    return;
  }

  const pool = globalScope.__characterFactoryPool;
  globalScope.__characterFactoryPool = undefined;

  try {
    await pool.end();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Called end on pool more than once")
    ) {
      return;
    }

    throw error;
  }
}
