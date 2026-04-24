import { z } from "zod";

import { normalizeStringArray, normalizeText } from "./schema-helpers";

export const reviewerTypeSchema = z.enum(["auto", "human"]);

export type ReviewerType = z.infer<typeof reviewerTypeSchema>;

export const reviewFailureTagValues = [
  "ratio_too_tall",
  "legs_too_long",
  "head_too_small",
  "style_drift",
  "palette_off",
  "prop_missing",
  "expression_weak",
  "sheet_format_broken",
  "identity_not_distinct"
] as const;

export const reviewFailureTagSchema = z.enum(reviewFailureTagValues);

export type ReviewFailureTag = z.infer<typeof reviewFailureTagSchema>;

export const reviewBestUseValues = [
  "discard",
  "keep_for_reference",
  "refine",
  "candidate_master"
] as const;

export const reviewBestUseSchema = z.enum(reviewBestUseValues);

export type ReviewBestUse = z.infer<typeof reviewBestUseSchema>;

const reviewDimensionScoresInputSchema = z
  .object({
    styleUnity: z.coerce.number(),
    characterIdentity: z.coerce.number(),
    ratioAccuracy: z.coerce.number(),
    posePropMatch: z.coerce.number(),
    paletteMatch: z.coerce.number(),
    sheetIntegrity: z.coerce.number(),
    masterPotential: z.coerce.number()
  })
  .strict();

export const reviewDimensionScoresSchema = z
  .object({
    styleUnity: z.number().min(0).max(25),
    characterIdentity: z.number().min(0).max(20),
    ratioAccuracy: z.number().min(0).max(20),
    posePropMatch: z.number().min(0).max(10),
    paletteMatch: z.number().min(0).max(10),
    sheetIntegrity: z.number().min(0).max(10),
    masterPotential: z.number().min(0).max(5)
  })
  .strict();

export type ReviewDimensionScores = z.infer<typeof reviewDimensionScoresSchema>;

const imageReviewInputSchema = z
  .object({
    characterCode: z.unknown(),
    isValidCandidate: z.unknown(),
    totalScore: z.coerce.number(),
    dimensionScores: reviewDimensionScoresInputSchema,
    failureTags: z.unknown().optional(),
    fixSuggestions: z.unknown().optional(),
    bestUse: z.unknown()
  })
  .strict();

export const imageReviewSchema = z
  .object({
    characterCode: z.string().trim().min(1),
    isValidCandidate: z.boolean(),
    totalScore: z.number().min(0).max(100),
    dimensionScores: reviewDimensionScoresSchema,
    failureTags: z.array(reviewFailureTagSchema).max(5),
    fixSuggestions: z.array(z.string().trim().min(1)),
    bestUse: reviewBestUseSchema
  })
  .strict();

export type ImageReview = z.infer<typeof imageReviewSchema>;

const reviewNotesInputSchema = z
  .object({
    characterCode: z.unknown(),
    isValidCandidate: z.unknown(),
    dimensionScores: reviewDimensionScoresInputSchema.optional(),
    fixSuggestions: z.unknown().optional(),
    bestUse: z.unknown().optional()
  })
  .passthrough();

export const reviewNotesSchema = z
  .object({
    characterCode: z.string().trim().min(1),
    isValidCandidate: z.boolean(),
    dimensionScores: reviewDimensionScoresSchema,
    fixSuggestions: z.array(z.string().trim().min(1)),
    bestUse: reviewBestUseSchema
  })
  .strict();

export type ReviewNotes = z.infer<typeof reviewNotesSchema>;

export interface ReviewResultRecord extends ImageReview {
  id: string;
  imageId: string;
  reviewerType: ReviewerType;
  createdAt: string;
}

function roundScore(value: number): number {
  return Number(value.toFixed(2));
}

export function serializeReviewDimensionScores(
  input: unknown
): ReviewDimensionScores {
  const parsed = reviewDimensionScoresInputSchema.parse(input);

  return reviewDimensionScoresSchema.parse({
    styleUnity: roundScore(parsed.styleUnity),
    characterIdentity: roundScore(parsed.characterIdentity),
    ratioAccuracy: roundScore(parsed.ratioAccuracy),
    posePropMatch: roundScore(parsed.posePropMatch),
    paletteMatch: roundScore(parsed.paletteMatch),
    sheetIntegrity: roundScore(parsed.sheetIntegrity),
    masterPotential: roundScore(parsed.masterPotential)
  });
}

export function serializeImageReview(input: unknown): ImageReview {
  const parsed = imageReviewInputSchema.parse(input);

  return imageReviewSchema.parse({
    characterCode: normalizeText(parsed.characterCode),
    isValidCandidate: Boolean(parsed.isValidCandidate),
    totalScore: roundScore(parsed.totalScore),
    dimensionScores: serializeReviewDimensionScores(parsed.dimensionScores),
    failureTags: normalizeStringArray(parsed.failureTags)
      .map((tag) => reviewFailureTagSchema.safeParse(tag))
      .filter((result) => result.success)
      .map((result) => result.data)
      .slice(0, 5),
    fixSuggestions: normalizeStringArray(parsed.fixSuggestions),
    bestUse: reviewBestUseSchema.parse(parsed.bestUse)
  });
}

export function serializeReviewNotes(input: unknown): ReviewNotes {
  const parsed = reviewNotesInputSchema.parse(input ?? {});

  return reviewNotesSchema.parse({
    characterCode: normalizeText(parsed.characterCode),
    isValidCandidate: Boolean(parsed.isValidCandidate),
    dimensionScores: serializeReviewDimensionScores(parsed.dimensionScores ?? {}),
    fixSuggestions: normalizeStringArray(parsed.fixSuggestions),
    bestUse: reviewBestUseSchema.parse(parsed.bestUse)
  });
}
