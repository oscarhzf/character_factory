import { z } from "zod";

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim().length === 0) {
    return undefined;
  }

  return value;
};

const optionalNonEmptyStringSchema = z.preprocess(
  emptyStringToUndefined,
  z.string().min(1).optional()
);

export const storageProviderSchema = z.preprocess(
  emptyStringToUndefined,
  z.enum(["s3", "r2", "supabase"]).optional()
);

export const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Character Factory"),
  DATABASE_URL: optionalNonEmptyStringSchema,
  TEST_DATABASE_URL: optionalNonEmptyStringSchema,
  REDIS_URL: optionalNonEmptyStringSchema,
  STORAGE_PROVIDER: storageProviderSchema,
  STORAGE_ENDPOINT: optionalNonEmptyStringSchema,
  STORAGE_BUCKET: optionalNonEmptyStringSchema,
  STORAGE_ACCESS_KEY_ID: optionalNonEmptyStringSchema,
  STORAGE_SECRET_ACCESS_KEY: optionalNonEmptyStringSchema
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export const coreRequiredEnvKeys = ["DATABASE_URL"] as const;

export interface EnvironmentHealthStatus {
  status: "ok" | "error";
  missing: string[];
}

export function readServerEnv(
  input: Record<string, string | undefined> = process.env
): ServerEnv {
  return serverEnvSchema.parse(input);
}

export function getEnvironmentHealthStatus(
  input: Record<string, string | undefined> = process.env
): EnvironmentHealthStatus {
  const missing = coreRequiredEnvKeys.filter((key) => {
    const value = input[key];
    return value === undefined || value.trim().length === 0;
  });

  return {
    status: missing.length === 0 ? "ok" : "error",
    missing: [...missing]
  };
}
