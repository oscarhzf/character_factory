import {
  type GeneratedImageRecord,
  variantStrategySchema
} from "@character-factory/core";

import {
  listGeneratedImageRowsByJob,
  type GeneratedImageRowWithPromptVariant
} from "../repositories/generated-image-repository";
import { parseEntityId } from "../service-input";
import { mapDatabaseError } from "../service-error";
import { mapReviewResultRowToRecord } from "./review-result-service";

export function mapGeneratedImageRowToRecord(
  row: GeneratedImageRowWithPromptVariant
): GeneratedImageRecord {
  const autoReview =
    row.autoReview &&
    row.autoReview.id &&
    row.autoReview.reviewerType &&
    row.autoReview.totalScore &&
    row.autoReview.styleScore &&
    row.autoReview.identityScore &&
    row.autoReview.ratioScore &&
    row.autoReview.poseScore &&
    row.autoReview.paletteScore &&
    row.autoReview.sheetScore &&
    row.autoReview.masterPotentialScore &&
    row.autoReview.createdAt
      ? mapReviewResultRowToRecord({
          id: row.autoReview.id,
          imageId: row.image.id,
          reviewerType:
            row.autoReview.reviewerType === "human" ? "human" : "auto",
          totalScore: row.autoReview.totalScore,
          styleScore: row.autoReview.styleScore,
          identityScore: row.autoReview.identityScore,
          ratioScore: row.autoReview.ratioScore,
          poseScore: row.autoReview.poseScore,
          paletteScore: row.autoReview.paletteScore,
          sheetScore: row.autoReview.sheetScore,
          masterPotentialScore: row.autoReview.masterPotentialScore,
          tagsJson: row.autoReview.tagsJson,
          notesJson: row.autoReview.notesJson,
          createdAt: row.autoReview.createdAt
        })
      : null;

  return {
    id: row.image.id,
    jobId: row.image.jobId,
    promptVersionId: row.image.promptVersionId ?? null,
    sourceApi: row.image.sourceApi,
    modelName: row.image.modelName,
    imageUrl: row.image.imageUrl,
    thumbUrl: row.image.thumbUrl ?? null,
    revisedPrompt: row.image.revisedPrompt ?? null,
    generationMeta:
      row.image.generationMetaJson &&
      typeof row.image.generationMetaJson === "object" &&
      !Array.isArray(row.image.generationMetaJson)
        ? (row.image.generationMetaJson as Record<string, unknown>)
        : {},
    status: row.image.status,
    createdAt: row.image.createdAt.toISOString(),
    promptVariant:
      row.promptVariant &&
      row.promptVariant.id &&
      row.promptVariant.variantKey &&
      row.promptVariant.strategy
        ? {
            id: row.promptVariant.id,
            variantKey: row.promptVariant.variantKey,
            strategy: variantStrategySchema.parse(row.promptVariant.strategy)
          }
        : null,
    autoReview
  };
}

export async function listGeneratedImagesByJob(
  jobId: string
): Promise<GeneratedImageRecord[]> {
  const generationJobId = parseEntityId(jobId);

  try {
    const rows = await listGeneratedImageRowsByJob(generationJobId);
    return rows.map((row) => mapGeneratedImageRowToRecord(row));
  } catch (error) {
    throw mapDatabaseError(error);
  }
}
