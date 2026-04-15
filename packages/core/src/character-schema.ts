import { z } from "zod";

import { normalizeStringArray, normalizeText } from "./schema-helpers";

export const characterStatusSchema = z.enum(["draft", "active", "locked"]);

export const characterCodeSchema = z.string().trim().min(1).max(64);

export const characterNameSchema = z.string().trim().min(1).max(128);

export const fixedTraitsSchema = z.object({
  rolePersona: z.string(),
  identityKeywords: z.array(z.string()),
  visualSilhouette: z.string(),
  hairstyle: z.string(),
  outfitRules: z.array(z.string()),
  iconicProps: z.array(z.string())
});

export type FixedTraits = z.infer<typeof fixedTraitsSchema>;

export const semiFixedTraitsSchema = z.object({
  optionalProps: z.array(z.string()),
  expressionRange: z.array(z.string()),
  poseRange: z.array(z.string()),
  outfitVariants: z.array(z.string()),
  compositionHints: z.array(z.string())
});

export type SemiFixedTraits = z.infer<typeof semiFixedTraitsSchema>;

export const variableDefaultsSchema = z.object({
  action: z.string(),
  expression: z.string(),
  prop: z.string(),
  view: z.string(),
  pose: z.string(),
  composition: z.string()
});

export type VariableDefaults = z.infer<typeof variableDefaultsSchema>;

export const paletteSchema = z.object({
  primary: z.array(z.string()),
  secondary: z.array(z.string()),
  accent: z.array(z.string()),
  forbidden: z.array(z.string())
});

export type Palette = z.infer<typeof paletteSchema>;

export const negativeRulesSchema = z.object({
  anatomy: z.array(z.string()),
  style: z.array(z.string()),
  props: z.array(z.string()),
  composition: z.array(z.string())
});

export type NegativeRules = z.infer<typeof negativeRulesSchema>;

export const defaultFixedTraits: FixedTraits = {
  rolePersona: "",
  identityKeywords: [],
  visualSilhouette: "",
  hairstyle: "",
  outfitRules: [],
  iconicProps: []
};

export const defaultSemiFixedTraits: SemiFixedTraits = {
  optionalProps: [],
  expressionRange: [],
  poseRange: [],
  outfitVariants: [],
  compositionHints: []
};

export const defaultVariableDefaults: VariableDefaults = {
  action: "",
  expression: "",
  prop: "",
  view: "",
  pose: "",
  composition: ""
};

export const defaultPalette: Palette = {
  primary: [],
  secondary: [],
  accent: [],
  forbidden: []
};

export const defaultNegativeRules: NegativeRules = {
  anatomy: [],
  style: [],
  props: [],
  composition: []
};

const fixedTraitsInputSchema = z
  .object({
    rolePersona: z.unknown().optional(),
    identityKeywords: z.unknown().optional(),
    visualSilhouette: z.unknown().optional(),
    hairstyle: z.unknown().optional(),
    outfitRules: z.unknown().optional(),
    iconicProps: z.unknown().optional()
  })
  .passthrough()
  .default({});

const semiFixedTraitsInputSchema = z
  .object({
    optionalProps: z.unknown().optional(),
    expressionRange: z.unknown().optional(),
    poseRange: z.unknown().optional(),
    outfitVariants: z.unknown().optional(),
    compositionHints: z.unknown().optional()
  })
  .passthrough()
  .default({});

const variableDefaultsInputSchema = z
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

const paletteInputSchema = z
  .object({
    primary: z.unknown().optional(),
    secondary: z.unknown().optional(),
    accent: z.unknown().optional(),
    forbidden: z.unknown().optional()
  })
  .passthrough()
  .default({});

const negativeRulesInputSchema = z
  .object({
    anatomy: z.unknown().optional(),
    style: z.unknown().optional(),
    props: z.unknown().optional(),
    composition: z.unknown().optional()
  })
  .passthrough()
  .default({});

export function serializeFixedTraits(input: unknown): FixedTraits {
  const parsed = fixedTraitsInputSchema.parse(input ?? {});

  return {
    rolePersona: normalizeText(parsed.rolePersona),
    identityKeywords: normalizeStringArray(parsed.identityKeywords),
    visualSilhouette: normalizeText(parsed.visualSilhouette),
    hairstyle: normalizeText(parsed.hairstyle),
    outfitRules: normalizeStringArray(parsed.outfitRules),
    iconicProps: normalizeStringArray(parsed.iconicProps)
  };
}

export function serializeSemiFixedTraits(input: unknown): SemiFixedTraits {
  const parsed = semiFixedTraitsInputSchema.parse(input ?? {});

  return {
    optionalProps: normalizeStringArray(parsed.optionalProps),
    expressionRange: normalizeStringArray(parsed.expressionRange),
    poseRange: normalizeStringArray(parsed.poseRange),
    outfitVariants: normalizeStringArray(parsed.outfitVariants),
    compositionHints: normalizeStringArray(parsed.compositionHints)
  };
}

export function serializeVariableDefaults(input: unknown): VariableDefaults {
  const parsed = variableDefaultsInputSchema.parse(input ?? {});

  return {
    action: normalizeText(parsed.action),
    expression: normalizeText(parsed.expression),
    prop: normalizeText(parsed.prop),
    view: normalizeText(parsed.view),
    pose: normalizeText(parsed.pose),
    composition: normalizeText(parsed.composition)
  };
}

export function serializePalette(input: unknown): Palette {
  const parsed = paletteInputSchema.parse(input ?? {});

  return {
    primary: normalizeStringArray(parsed.primary),
    secondary: normalizeStringArray(parsed.secondary),
    accent: normalizeStringArray(parsed.accent),
    forbidden: normalizeStringArray(parsed.forbidden)
  };
}

export function serializeNegativeRules(input: unknown): NegativeRules {
  const parsed = negativeRulesInputSchema.parse(input ?? {});

  return {
    anatomy: normalizeStringArray(parsed.anatomy),
    style: normalizeStringArray(parsed.style),
    props: normalizeStringArray(parsed.props),
    composition: normalizeStringArray(parsed.composition)
  };
}

export const characterCreateInputSchema = z.object({
  universeId: z.uuid(),
  code: characterCodeSchema,
  name: characterNameSchema,
  status: characterStatusSchema.default("draft"),
  description: z.string().optional(),
  fixedTraits: z.unknown().optional(),
  semiFixedTraits: z.unknown().optional(),
  variableDefaults: z.unknown().optional(),
  palette: z.unknown().optional(),
  negativeRules: z.unknown().optional()
});

export const characterUpdateInputSchema = z
  .object({
    universeId: z.uuid().optional(),
    code: characterCodeSchema.optional(),
    name: characterNameSchema.optional(),
    status: characterStatusSchema.optional(),
    description: z.string().optional(),
    fixedTraits: z.unknown().optional(),
    semiFixedTraits: z.unknown().optional(),
    variableDefaults: z.unknown().optional(),
    palette: z.unknown().optional(),
    negativeRules: z.unknown().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided."
  });

export type CharacterCreateInput = z.infer<typeof characterCreateInputSchema>;
export type CharacterUpdateInput = z.infer<typeof characterUpdateInputSchema>;

export interface CharacterRecord {
  id: string;
  universeId: string;
  code: string;
  name: string;
  status: z.infer<typeof characterStatusSchema>;
  description: string;
  fixedTraits: FixedTraits;
  semiFixedTraits: SemiFixedTraits;
  variableDefaults: VariableDefaults;
  palette: Palette;
  negativeRules: NegativeRules;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterListItem extends CharacterRecord {
  universe: {
    id: string;
    code: string;
    name: string;
  };
}

export interface SerializedCharacterInput {
  universeId: string;
  code: string;
  name: string;
  status: z.infer<typeof characterStatusSchema>;
  description: string;
  fixedTraits: FixedTraits;
  semiFixedTraits: SemiFixedTraits;
  variableDefaults: VariableDefaults;
  palette: Palette;
  negativeRules: NegativeRules;
}

export function serializeCharacterInput(
  input: CharacterCreateInput
): SerializedCharacterInput {
  return {
    universeId: input.universeId,
    code: normalizeText(input.code),
    name: normalizeText(input.name),
    status: input.status,
    description: normalizeText(input.description),
    fixedTraits: serializeFixedTraits(input.fixedTraits),
    semiFixedTraits: serializeSemiFixedTraits(input.semiFixedTraits),
    variableDefaults: serializeVariableDefaults(input.variableDefaults),
    palette: serializePalette(input.palette),
    negativeRules: serializeNegativeRules(input.negativeRules)
  };
}

export function serializeCharacterPatch(
  input: CharacterUpdateInput
): Partial<SerializedCharacterInput> {
  const patch: Partial<SerializedCharacterInput> = {};

  if (input.universeId !== undefined) {
    patch.universeId = input.universeId;
  }

  if (input.code !== undefined) {
    patch.code = normalizeText(input.code);
  }

  if (input.name !== undefined) {
    patch.name = normalizeText(input.name);
  }

  if (input.status !== undefined) {
    patch.status = input.status;
  }

  if (input.description !== undefined) {
    patch.description = normalizeText(input.description);
  }

  if (input.fixedTraits !== undefined) {
    patch.fixedTraits = serializeFixedTraits(input.fixedTraits);
  }

  if (input.semiFixedTraits !== undefined) {
    patch.semiFixedTraits = serializeSemiFixedTraits(input.semiFixedTraits);
  }

  if (input.variableDefaults !== undefined) {
    patch.variableDefaults = serializeVariableDefaults(input.variableDefaults);
  }

  if (input.palette !== undefined) {
    patch.palette = serializePalette(input.palette);
  }

  if (input.negativeRules !== undefined) {
    patch.negativeRules = serializeNegativeRules(input.negativeRules);
  }

  return patch;
}
