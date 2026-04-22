import { z } from "zod";

import type { GeneratedImageRecord } from "./image-schema";
import {
  serializeTaskPrompt,
  serializeVariantStrategies,
  taskPromptSchema,
  variantStrategySchema,
  type PromptVersionRecord,
  type TaskPrompt,
  type VariantStrategy
} from "./prompt-schema";
import { normalizeNullableText, normalizeText } from "./schema-helpers";

export const jobModeValues = ["explore", "refine", "edit"] as const;

export const jobStatusValues = [
  "queued",
  "running",
  "reviewing",
  "completed",
  "failed"
] as const;

export const jobModeSchema = z.enum(jobModeValues);

export const jobStatusSchema = z.enum(jobStatusValues);

export type JobMode = z.infer<typeof jobModeSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;

const jobInputConfigInputSchema = z
  .object({
    taskPrompt: z.unknown().optional(),
    variantStrategies: z.array(z.unknown()).optional(),
    imagesPerVariant: z.coerce.number().int().min(1).max(12).optional(),
    size: z.unknown().optional(),
    quality: z.unknown().optional()
  })
  .passthrough()
  .default({});

export const jobInputConfigSchema = z.object({
  taskPrompt: taskPromptSchema,
  variantStrategies: z.array(variantStrategySchema),
  imagesPerVariant: z.number().int().min(1).max(12),
  size: z.string().trim().min(1),
  quality: z.string().trim().min(1)
});

export type JobInputConfig = z.infer<typeof jobInputConfigSchema>;

export const defaultJobInputConfig: JobInputConfig = {
  taskPrompt: {
    action: "",
    expression: "",
    prop: "",
    view: "",
    pose: "",
    composition: ""
  },
  variantStrategies: ["ratio_boost", "style_lock", "pose_clarity"],
  imagesPerVariant: 4,
  size: "1024x1536",
  quality: "high"
};

export const jobCreateInputSchema = z.object({
  characterId: z.uuid(),
  mode: jobModeSchema.default("explore"),
  sourceImageId: z.uuid().optional(),
  inputConfig: jobInputConfigInputSchema.optional(),
  createdBy: z.string().optional()
});

export type JobCreateInput = z.infer<typeof jobCreateInputSchema>;

export interface SerializedJobCreateInput {
  characterId: string;
  mode: JobMode;
  sourceImageId: string | null;
  inputConfig: JobInputConfig;
  createdBy: string | null;
}

export interface JobRecord {
  id: string;
  characterId: string;
  mode: JobMode;
  status: JobStatus;
  sourceImageId: string | null;
  inputConfig: JobInputConfig;
  batchSize: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobDetailRecord extends JobRecord {
  character: {
    id: string;
    code: string;
    name: string;
    status: "draft" | "active" | "locked";
    universe: {
      id: string;
      code: string;
      name: string;
    };
  };
  promptVariants: PromptVersionRecord[];
  generatedImages: GeneratedImageRecord[];
}

export function serializeJobInputConfig(input: unknown): JobInputConfig {
  const parsed = jobInputConfigInputSchema.parse(input ?? {});

  return {
    taskPrompt: serializeTaskPrompt(parsed.taskPrompt),
    variantStrategies: serializeVariantStrategies(parsed.variantStrategies),
    imagesPerVariant:
      parsed.imagesPerVariant ?? defaultJobInputConfig.imagesPerVariant,
    size: normalizeText(parsed.size) || defaultJobInputConfig.size,
    quality: normalizeText(parsed.quality) || defaultJobInputConfig.quality
  };
}

export function calculateJobBatchSize(inputConfig: JobInputConfig): number {
  return inputConfig.imagesPerVariant * inputConfig.variantStrategies.length;
}

export function serializeJobCreateInput(
  input: JobCreateInput
): SerializedJobCreateInput {
  const inputConfig = serializeJobInputConfig(input.inputConfig);

  return {
    characterId: input.characterId,
    mode: input.mode,
    sourceImageId: input.sourceImageId ?? null,
    inputConfig,
    createdBy: normalizeNullableText(input.createdBy)
  };
}

export function resolveJobTaskPrompt(
  inputConfig: JobInputConfig,
  fallbackTaskPrompt: TaskPrompt
): TaskPrompt {
  return {
    action: inputConfig.taskPrompt.action || fallbackTaskPrompt.action,
    expression: inputConfig.taskPrompt.expression || fallbackTaskPrompt.expression,
    prop: inputConfig.taskPrompt.prop || fallbackTaskPrompt.prop,
    view: inputConfig.taskPrompt.view || fallbackTaskPrompt.view,
    pose: inputConfig.taskPrompt.pose || fallbackTaskPrompt.pose,
    composition:
      inputConfig.taskPrompt.composition || fallbackTaskPrompt.composition
  };
}

export function isVariantStrategySelected(
  strategies: readonly VariantStrategy[],
  candidate: VariantStrategy
): boolean {
  return strategies.includes(candidate);
}
