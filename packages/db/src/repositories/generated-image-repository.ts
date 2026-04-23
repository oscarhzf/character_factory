import { and, asc, eq, inArray } from "drizzle-orm";

import { getDb } from "../client";
import { generatedImages, promptVersions, reviewResults } from "../schema";

export type GeneratedImageRow = typeof generatedImages.$inferSelect;

export interface GeneratedImageRowWithPromptVariant {
  image: GeneratedImageRow;
  promptVariant: {
    id: string;
    variantKey: string | null;
    strategy: string | null;
  } | null;
  autoReview: {
    id: string | null;
    reviewerType: string | null;
    totalScore: string | null;
    styleScore: string | null;
    identityScore: string | null;
    ratioScore: string | null;
    poseScore: string | null;
    paletteScore: string | null;
    sheetScore: string | null;
    masterPotentialScore: string | null;
    tagsJson: unknown;
    notesJson: unknown;
    createdAt: Date | null;
  } | null;
}

export async function insertGeneratedImageRows(
  values: Array<typeof generatedImages.$inferInsert>
): Promise<GeneratedImageRow[]> {
  return getDb().insert(generatedImages).values(values).returning();
}

export async function listGeneratedImageRowsByJob(
  jobId: string
): Promise<GeneratedImageRowWithPromptVariant[]> {
  return getDb()
    .select({
      image: generatedImages,
      promptVariant: {
        id: promptVersions.id,
        variantKey: promptVersions.variantKey,
        strategy: promptVersions.strategy
      },
      autoReview: {
        id: reviewResults.id,
        reviewerType: reviewResults.reviewerType,
        totalScore: reviewResults.totalScore,
        styleScore: reviewResults.styleScore,
        identityScore: reviewResults.identityScore,
        ratioScore: reviewResults.ratioScore,
        poseScore: reviewResults.poseScore,
        paletteScore: reviewResults.paletteScore,
        sheetScore: reviewResults.sheetScore,
        masterPotentialScore: reviewResults.masterPotentialScore,
        tagsJson: reviewResults.tagsJson,
        notesJson: reviewResults.notesJson,
        createdAt: reviewResults.createdAt
      }
    })
    .from(generatedImages)
    .leftJoin(promptVersions, eq(generatedImages.promptVersionId, promptVersions.id))
    .leftJoin(
      reviewResults,
      and(
        eq(reviewResults.imageId, generatedImages.id),
        eq(reviewResults.reviewerType, "auto")
      )
    )
    .where(eq(generatedImages.jobId, jobId))
    .orderBy(asc(generatedImages.createdAt));
}

export async function updateGeneratedImageStatuses(
  imageIds: readonly string[],
  status: typeof generatedImages.$inferSelect.status
): Promise<GeneratedImageRow[]> {
  if (imageIds.length === 0) {
    return [];
  }

  return getDb()
    .update(generatedImages)
    .set({
      status
    })
    .where(inArray(generatedImages.id, [...imageIds]))
    .returning();
}
