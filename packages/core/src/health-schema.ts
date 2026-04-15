import { z } from "zod";

export const healthStatusSchema = z.enum(["ok", "error", "not_configured"]);

export const environmentHealthSchema = z.object({
  status: z.enum(["ok", "error"]),
  missing: z.array(z.string())
});

export const serviceHealthSchema = z.object({
  status: healthStatusSchema,
  message: z.string()
});

export const storageHealthSchema = z.object({
  status: healthStatusSchema,
  provider: z.enum(["s3", "r2", "supabase"]).nullable(),
  message: z.string()
});

export const applicationHealthSchema = z.object({
  env: environmentHealthSchema,
  db: serviceHealthSchema,
  redis: serviceHealthSchema,
  storage: storageHealthSchema
});

export type ApplicationHealth = z.infer<typeof applicationHealthSchema>;

