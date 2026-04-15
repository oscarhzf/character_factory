import { z } from "zod";

import { normalizeStringArray, normalizeText } from "./schema-helpers";

export const variantStrategyValues = [
  "ratio_boost",
  "style_lock",
  "pose_clarity"
] as const;

export const variantStrategySchema = z.enum(variantStrategyValues);

export type VariantStrategy = z.infer<typeof variantStrategySchema>;

export const defaultVariantStrategies = [...variantStrategyValues];

export const taskPromptSchema = z.object({
  action: z.string(),
  expression: z.string(),
  prop: z.string(),
  view: z.string(),
  pose: z.string(),
  composition: z.string()
});

export type TaskPrompt = z.infer<typeof taskPromptSchema>;

export const defaultTaskPrompt: TaskPrompt = {
  action: "",
  expression: "",
  prop: "",
  view: "",
  pose: "",
  composition: ""
};

export const promptPatchSchema = z.object({
  preserve: z.array(z.string()),
  strengthen: z.array(z.string()),
  suppress: z.array(z.string()),
  append: z.array(z.string()),
  remove: z.array(z.string())
});

export type PromptPatch = z.infer<typeof promptPatchSchema>;

export const defaultPromptPatch: PromptPatch = {
  preserve: [],
  strengthen: [],
  suppress: [],
  append: [],
  remove: []
};

export const promptDebugSectionsSchema = z.object({
  universe: z.array(z.string()),
  character: z.array(z.string()),
  task: z.array(z.string()),
  variant: z.array(z.string()),
  patch: z.array(z.string()),
  output: z.array(z.string()),
  negative: z.array(z.string())
});

export type PromptDebugSections = z.infer<typeof promptDebugSectionsSchema>;

export const promptDebugPayloadSchema = z.object({
  variantKey: z.string().trim().min(1),
  strategy: variantStrategySchema,
  resolvedTaskPrompt: taskPromptSchema,
  normalizedPatch: promptPatchSchema,
  sections: promptDebugSectionsSchema
});

export type PromptDebugPayload = z.infer<typeof promptDebugPayloadSchema>;

const taskPromptInputSchema = z
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

const promptPatchInputSchema = z
  .object({
    preserve: z.unknown().optional(),
    strengthen: z.unknown().optional(),
    suppress: z.unknown().optional(),
    append: z.unknown().optional(),
    remove: z.unknown().optional()
  })
  .passthrough()
  .default({});

export const promptCompileInputSchema = z.object({
  characterId: z.uuid(),
  jobId: z.uuid().optional(),
  parentPromptVersionId: z.uuid().optional(),
  scope: z.string().trim().min(1).default("debug"),
  taskPrompt: taskPromptInputSchema.optional(),
  variantStrategies: z.array(z.unknown()).optional(),
  basePatch: promptPatchInputSchema.optional()
});

export type PromptCompileInput = z.infer<typeof promptCompileInputSchema>;

export const promptVersionListQuerySchema = z.object({
  characterId: z.uuid(),
  limit: z.coerce.number().int().min(1).max(24).default(9)
});

export interface SerializedPromptCompileInput {
  characterId: string;
  jobId: string | null;
  parentPromptVersionId: string | null;
  scope: string;
  taskPrompt: TaskPrompt;
  variantStrategies: VariantStrategy[];
  basePatch: PromptPatch;
}

export interface PromptVersionRecord {
  id: string;
  characterId: string;
  jobId: string | null;
  parentPromptVersionId: string | null;
  scope: string;
  variantKey: string;
  strategy: VariantStrategy;
  compiledPrompt: string;
  compiledNegativePrompt: string;
  patch: PromptPatch | null;
  debugPayload: PromptDebugPayload;
  createdAt: string;
}

export interface PromptCompileResult {
  character: {
    id: string;
    code: string;
    name: string;
  };
  universe: {
    id: string;
    code: string;
    name: string;
  };
  resolvedTaskPrompt: TaskPrompt;
  variants: PromptVersionRecord[];
}

export function serializeTaskPrompt(input: unknown): TaskPrompt {
  const parsed = taskPromptInputSchema.parse(input ?? {});

  return {
    action: normalizeText(parsed.action),
    expression: normalizeText(parsed.expression),
    prop: normalizeText(parsed.prop),
    view: normalizeText(parsed.view),
    pose: normalizeText(parsed.pose),
    composition: normalizeText(parsed.composition)
  };
}

export function resolveTaskPrompt(
  defaults: unknown,
  overrides: unknown
): TaskPrompt {
  const defaultValues = serializeTaskPrompt(defaults);
  const overrideValues = serializeTaskPrompt(overrides);

  return {
    action: overrideValues.action || defaultValues.action,
    expression: overrideValues.expression || defaultValues.expression,
    prop: overrideValues.prop || defaultValues.prop,
    view: overrideValues.view || defaultValues.view,
    pose: overrideValues.pose || defaultValues.pose,
    composition: overrideValues.composition || defaultValues.composition
  };
}

export function serializePromptPatch(input: unknown): PromptPatch {
  const parsed = promptPatchInputSchema.parse(input ?? {});

  return {
    preserve: normalizeStringArray(parsed.preserve),
    strengthen: normalizeStringArray(parsed.strengthen),
    suppress: normalizeStringArray(parsed.suppress),
    append: normalizeStringArray(parsed.append),
    remove: normalizeStringArray(parsed.remove)
  };
}

export function hasPromptPatchContent(patch: PromptPatch): boolean {
  return Object.values(patch).some((value) => value.length > 0);
}

export function serializeVariantStrategies(input: unknown): VariantStrategy[] {
  if (!Array.isArray(input)) {
    return [...defaultVariantStrategies];
  }

  const normalized = [...new Set(input)]
    .map((value) => variantStrategySchema.safeParse(value))
    .filter((result) => result.success)
    .map((result) => result.data);

  return normalized.length > 0 ? normalized : [...defaultVariantStrategies];
}

export function serializePromptCompileInput(
  input: PromptCompileInput
): SerializedPromptCompileInput {
  return {
    characterId: input.characterId,
    jobId: input.jobId ?? null,
    parentPromptVersionId: input.parentPromptVersionId ?? null,
    scope: normalizeText(input.scope) || "debug",
    taskPrompt: serializeTaskPrompt(input.taskPrompt),
    variantStrategies: serializeVariantStrategies(input.variantStrategies),
    basePatch: serializePromptPatch(input.basePatch)
  };
}
