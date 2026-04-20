import { z } from "zod";

import { normalizeText } from "./schema-helpers";
import {
  defaultVariantStrategies,
  serializeTaskPrompt,
  type TaskPrompt,
  type VariantStrategy,
  variantStrategySchema
} from "./prompt-schema";

export const jobModeSchema = z.enum(["explore", "refine", "edit"]);

export type JobMode = z.infer<typeof jobModeSchema>;

export const jobStatusSchema = z.enum([
  "queued",
  "running",
  "reviewing",
  "completed",
  "failed"
]);

export type JobStatus = z.infer<typeof jobStatusSchema>;

export const imageQualitySchema = z.enum(["low", "medium", "high"]);

export type ImageQuality = z.infer<typeof imageQualitySchema>;

const generationJobTaskPromptInputSchema = z
  .object({
    action: z.unknown().optional(),
    expression: z.unknown().optional(),
    prop: z.unknown().optional(),
    view: z.unknown().optional(),
    pose: z.unknown().optional(),
    composition: z.unknown().optional()
  })
  .passthrough()
  .default({});

export const generationJobInputConfigSchema = z
  .object({
    taskPrompt: generationJobTaskPromptInputSchema.optional(),
    variantStrategies: z.array(z.unknown()).optional(),
    imagesPerVariant: z.coerce.number().int().min(1).max(8).default(4),
    size: z.string().trim().min(1).max(32).default("1024x1536"),
    quality: imageQualitySchema.default("high")
  });

export const generationJobCreateInputSchema = z
  .object({
    characterId: z.uuid(),
    mode: jobModeSchema.default("explore"),
    sourceImageId: z.uuid().nullable().optional(),
    inputConfig: generationJobInputConfigSchema.optional(),
    createdBy: z.string().optional()
  })
  .superRefine((value, context) => {
    if (value.mode !== "explore" && !value.sourceImageId) {
      context.addIssue({
        code: "custom",
        path: ["sourceImageId"],
        message: "sourceImageId is required for refine and edit jobs."
      });
    }
  });

export type GenerationJobCreateInput = z.infer<typeof generationJobCreateInputSchema>;

export const generationJobListQuerySchema = z.object({
  characterId: z.uuid().optional(),
  mode: jobModeSchema.optional(),
  status: jobStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(24).default(12)
});

export type GenerationJobListQuery = z.infer<typeof generationJobListQuerySchema>;

export interface GenerationJobInputConfig {
  taskPrompt: TaskPrompt;
  variantStrategies: VariantStrategy[];
  imagesPerVariant: number;
  size: string;
  quality: ImageQuality;
}

export interface SerializedGenerationJobCreateInput {
  characterId: string;
  mode: JobMode;
  sourceImageId: string | null;
  inputConfig: GenerationJobInputConfig;
  batchSize: number;
  createdBy: string;
}

export interface GenerationJobRecord {
  id: string;
  characterId: string;
  mode: JobMode;
  status: JobStatus;
  sourceImageId: string | null;
  inputConfig: GenerationJobInputConfig;
  batchSize: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationJobCharacterSummary {
  id: string;
  code: string;
  name: string;
  universe: {
    id: string;
    code: string;
    name: string;
  };
}

export interface GenerationJobListItem extends GenerationJobRecord {
  character: GenerationJobCharacterSummary;
}

export type GenerationJobDetail = GenerationJobListItem;

function defaultJobVariantStrategies(mode: JobMode): VariantStrategy[] {
  return mode === "explore" ? [...defaultVariantStrategies] : ["style_lock"];
}

function serializeJobVariantStrategies(
  input: unknown,
  mode: JobMode
): VariantStrategy[] {
  if (!Array.isArray(input)) {
    return defaultJobVariantStrategies(mode);
  }

  const normalized = [...new Set(input)]
    .map((value) => variantStrategySchema.safeParse(value))
    .filter((result) => result.success)
    .map((result) => result.data);

  return normalized.length > 0 ? normalized : defaultJobVariantStrategies(mode);
}

export function serializeGenerationJobInputConfig(
  input: unknown,
  mode: JobMode
): GenerationJobInputConfig {
  const parsed = generationJobInputConfigSchema.parse(input ?? {});

  return {
    taskPrompt: serializeTaskPrompt(parsed.taskPrompt),
    variantStrategies: serializeJobVariantStrategies(parsed.variantStrategies, mode),
    imagesPerVariant: parsed.imagesPerVariant,
    size: normalizeText(parsed.size) || "1024x1536",
    quality: parsed.quality
  };
}

export function serializeGenerationJobCreateInput(
  input: GenerationJobCreateInput
): SerializedGenerationJobCreateInput {
  const inputConfig = serializeGenerationJobInputConfig(input.inputConfig, input.mode);

  return {
    characterId: input.characterId,
    mode: input.mode,
    sourceImageId: input.sourceImageId ?? null,
    inputConfig,
    batchSize: inputConfig.imagesPerVariant * inputConfig.variantStrategies.length,
    createdBy: normalizeText(input.createdBy)
  };
}
