import { z } from "zod";

import { normalizeNullableText, normalizeStringArray, normalizeText } from "./schema-helpers";

export const universeCodeSchema = z.string().trim().min(1).max(64);

export const universeNameSchema = z.string().trim().min(1).max(128);

export const styleConstitutionSchema = z.object({
  proportionRules: z.array(z.string()),
  styleKeywords: z.array(z.string()),
  renderingRules: z.array(z.string()),
  backgroundRules: z.array(z.string()),
  sheetRules: z.array(z.string())
});

export type StyleConstitution = z.infer<typeof styleConstitutionSchema>;

export const defaultStyleConstitution: StyleConstitution = {
  proportionRules: [],
  styleKeywords: [],
  renderingRules: [],
  backgroundRules: [],
  sheetRules: []
};

const styleConstitutionInputSchema = z
  .object({
    proportionRules: z.unknown().optional(),
    styleKeywords: z.unknown().optional(),
    renderingRules: z.unknown().optional(),
    backgroundRules: z.unknown().optional(),
    sheetRules: z.unknown().optional()
  })
  .passthrough()
  .default({});

export function serializeStyleConstitution(
  input: unknown
): StyleConstitution {
  const parsed = styleConstitutionInputSchema.parse(input ?? {});

  return {
    proportionRules: normalizeStringArray(parsed.proportionRules),
    styleKeywords: normalizeStringArray(parsed.styleKeywords),
    renderingRules: normalizeStringArray(parsed.renderingRules),
    backgroundRules: normalizeStringArray(parsed.backgroundRules),
    sheetRules: normalizeStringArray(parsed.sheetRules)
  };
}

export const universeCreateInputSchema = z.object({
  code: universeCodeSchema,
  name: universeNameSchema,
  styleConstitution: z.unknown().optional(),
  globalPromptTemplate: z.string().trim().min(1),
  globalNegativeTemplate: z.string().optional()
});

export const universeUpdateInputSchema = z
  .object({
    code: universeCodeSchema.optional(),
    name: universeNameSchema.optional(),
    styleConstitution: z.unknown().optional(),
    globalPromptTemplate: z.string().trim().min(1).optional(),
    globalNegativeTemplate: z.string().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided."
  });

export type UniverseCreateInput = z.infer<typeof universeCreateInputSchema>;
export type UniverseUpdateInput = z.infer<typeof universeUpdateInputSchema>;

export interface UniverseRecord {
  id: string;
  code: string;
  name: string;
  styleConstitution: StyleConstitution;
  globalPromptTemplate: string;
  globalNegativeTemplate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedUniverseInput {
  code: string;
  name: string;
  styleConstitution: StyleConstitution;
  globalPromptTemplate: string;
  globalNegativeTemplate: string | null;
}

export function serializeUniverseInput(
  input: UniverseCreateInput
): SerializedUniverseInput {
  return {
    code: normalizeText(input.code),
    name: normalizeText(input.name),
    styleConstitution: serializeStyleConstitution(input.styleConstitution),
    globalPromptTemplate: normalizeText(input.globalPromptTemplate),
    globalNegativeTemplate: normalizeNullableText(input.globalNegativeTemplate)
  };
}

export function serializeUniversePatch(
  input: UniverseUpdateInput
): Partial<SerializedUniverseInput> {
  const patch: Partial<SerializedUniverseInput> = {};

  if (input.code !== undefined) {
    patch.code = normalizeText(input.code);
  }

  if (input.name !== undefined) {
    patch.name = normalizeText(input.name);
  }

  if (input.styleConstitution !== undefined) {
    patch.styleConstitution = serializeStyleConstitution(input.styleConstitution);
  }

  if (input.globalPromptTemplate !== undefined) {
    patch.globalPromptTemplate = normalizeText(input.globalPromptTemplate);
  }

  if (input.globalNegativeTemplate !== undefined) {
    patch.globalNegativeTemplate = normalizeNullableText(
      input.globalNegativeTemplate
    );
  }

  return patch;
}
