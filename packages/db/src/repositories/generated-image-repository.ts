import { asc, eq } from "drizzle-orm";

import { getDb } from "../client";
import { generatedImages, promptVersions } from "../schema";

export type GeneratedImageRow = typeof generatedImages.$inferSelect;

export interface GeneratedImageRowWithPromptVariant {
  image: GeneratedImageRow;
  promptVariant: {
    id: string;
    variantKey: string | null;
    strategy: string | null;
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
      }
    })
    .from(generatedImages)
    .leftJoin(promptVersions, eq(generatedImages.promptVersionId, promptVersions.id))
    .where(eq(generatedImages.jobId, jobId))
    .orderBy(asc(generatedImages.createdAt));
}
