import {
  reviewerTypeSchema,
  serializeReviewNotes,
  type ImageReview,
  type ReviewResultRecord
} from "@character-factory/core";

import {
  insertReviewResultRows,
  listReviewResultRowsByImageIds,
  type ReviewResultRow
} from "../repositories/review-result-repository";
import { parseEntityId } from "../service-input";
import { mapDatabaseError } from "../service-error";

function toNumericValue(value: string | number): number {
  return typeof value === "number" ? value : Number.parseFloat(value);
}

export function mapReviewResultRowToRecord(
  row: ReviewResultRow
): ReviewResultRecord {
  const notes = serializeReviewNotes(row.notesJson);

  return {
    id: row.id,
    imageId: row.imageId,
    reviewerType: reviewerTypeSchema.parse(row.reviewerType),
    characterCode: notes.characterCode,
    isValidCandidate: notes.isValidCandidate,
    totalScore: toNumericValue(row.totalScore),
    dimensionScores: notes.dimensionScores,
    failureTags: Array.isArray(row.tagsJson) ? row.tagsJson : [],
    fixSuggestions: notes.fixSuggestions,
    bestUse: notes.bestUse,
    createdAt: row.createdAt.toISOString()
  };
}

export async function createAutoReviewResults(
  input: Array<{
    imageId: string;
    review: ImageReview;
  }>
): Promise<ReviewResultRecord[]> {
  try {
    const rows = await insertReviewResultRows(
      input.map((entry) => ({
        imageId: parseEntityId(entry.imageId),
        reviewerType: "auto",
        totalScore: entry.review.totalScore.toFixed(2),
        styleScore: entry.review.dimensionScores.styleUnity.toFixed(2),
        identityScore: entry.review.dimensionScores.characterIdentity.toFixed(2),
        ratioScore: entry.review.dimensionScores.ratioAccuracy.toFixed(2),
        poseScore: entry.review.dimensionScores.posePropMatch.toFixed(2),
        paletteScore: entry.review.dimensionScores.paletteMatch.toFixed(2),
        sheetScore: entry.review.dimensionScores.sheetIntegrity.toFixed(2),
        masterPotentialScore:
          entry.review.dimensionScores.masterPotential.toFixed(2),
        tagsJson: entry.review.failureTags,
        notesJson: {
          characterCode: entry.review.characterCode,
          isValidCandidate: entry.review.isValidCandidate,
          dimensionScores: entry.review.dimensionScores,
          fixSuggestions: entry.review.fixSuggestions,
          bestUse: entry.review.bestUse
        }
      }))
    );

    return rows.map((row) => mapReviewResultRowToRecord(row));
  } catch (error) {
    throw mapDatabaseError(error);
  }
}

export async function listAutoReviewResultsByImageIds(
  imageIds: readonly string[]
): Promise<ReviewResultRecord[]> {
  try {
    const rows = await listReviewResultRowsByImageIds(imageIds, "auto");
    return rows.map((row) => mapReviewResultRowToRecord(row));
  } catch (error) {
    throw mapDatabaseError(error);
  }
}
