import { beforeEach, describe, expect, it, vi } from "vitest";

const clientMocks = vi.hoisted(() => ({
  getPool: vi.fn(() => ({
    query: vi.fn().mockResolvedValue(undefined)
  }))
}));

vi.mock("./client", () => clientMocks);
vi.mock("./load-env", () => ({
  ensureRootEnvLoaded: vi.fn()
}));
vi.mock("ioredis", () => ({
  default: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    ping: vi.fn().mockResolvedValue("PONG"),
    disconnect: vi.fn()
  }))
}));

import {
  getApplicationHealth,
  getRedisHealth,
  getStorageHealth
} from "./health";

function setBaseEnv(): void {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/test";
  process.env.REDIS_URL = "redis://localhost:6379/0";
  process.env.STORAGE_ENDPOINT = "https://example.com";
  process.env.STORAGE_BUCKET = "bucket";
  process.env.STORAGE_ACCESS_KEY_ID = "key";
  process.env.STORAGE_SECRET_ACCESS_KEY = "secret";
}

describe("health env guards", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    setBaseEnv();
  });

  it("returns degraded service health instead of throwing when env parsing fails", async () => {
    process.env.STORAGE_PROVIDER = "invalid-provider";

    await expect(getRedisHealth()).resolves.toMatchObject({
      status: "error"
    });
    await expect(getStorageHealth()).resolves.toMatchObject({
      status: "error",
      provider: null
    });
    await expect(getApplicationHealth()).resolves.toMatchObject({
      db: { status: "ok" },
      redis: { status: "error" },
      storage: { status: "error", provider: null }
    });
  });
});
