import {
  getEnvironmentHealthStatus,
  readServerEnv,
  type ApplicationHealth
} from "@character-factory/core";
import Redis from "ioredis";

import { getPool } from "./client";
import { ensureRootEnvLoaded } from "./load-env";

export async function getApplicationHealth(): Promise<ApplicationHealth> {
  ensureRootEnvLoaded();
  const envHealth = getEnvironmentHealthStatus();

  const [db, redis, storage] = await Promise.all([
    getDatabaseHealth(),
    getRedisHealth(),
    getStorageHealth()
  ]);

  return {
    env: envHealth,
    db,
    redis,
    storage
  };
}

export async function getDatabaseHealth(): Promise<ApplicationHealth["db"]> {
  try {
    const pool = getPool();
    await pool.query("select 1");

    return {
      status: "ok",
      message: "connected"
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Database unavailable."
    };
  }
}

export async function getRedisHealth(): Promise<ApplicationHealth["redis"]> {
  ensureRootEnvLoaded();
  let client: Redis | null = null;

  try {
    const env = readServerEnv();

    if (!env.REDIS_URL) {
      return {
        status: "not_configured",
        message: "REDIS_URL is not configured."
      };
    }

    client = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 0
    });

    await client.connect();
    const result = await client.ping();

    return {
      status: result === "PONG" ? "ok" : "error",
      message: result === "PONG" ? "connected" : `Unexpected response: ${result}`
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Redis unavailable."
    };
  } finally {
    client?.disconnect();
  }
}

export async function getStorageHealth(): Promise<ApplicationHealth["storage"]> {
  ensureRootEnvLoaded();
  try {
    const env = readServerEnv();

    if (!env.STORAGE_PROVIDER) {
      return {
        status: "not_configured",
        provider: null,
        message: "Storage provider is not configured."
      };
    }

    const requiredFields = [
      env.STORAGE_ENDPOINT,
      env.STORAGE_BUCKET,
      env.STORAGE_ACCESS_KEY_ID,
      env.STORAGE_SECRET_ACCESS_KEY
    ];

    const hasMissingField = requiredFields.some(
      (value) => value === undefined || value.trim().length === 0
    );

    if (hasMissingField) {
      return {
        status: "error",
        provider: env.STORAGE_PROVIDER,
        message: "Storage configuration is incomplete."
      };
    }

    return {
      status: "ok",
      provider: env.STORAGE_PROVIDER,
      message: "configured"
    };
  } catch (error) {
    return {
      status: "error",
      provider: null,
      message: error instanceof Error ? error.message : "Storage unavailable."
    };
  }
}
