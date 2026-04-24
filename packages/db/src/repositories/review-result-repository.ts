import { and, eq, inArray } from "drizzle-orm";

import { getDb } from "../client";
import { reviewResults } from "../schema";

export type ReviewResultRow = typeof reviewResults.$inferSelect;

export async function insertReviewResultRows(
  values: Array<typeof reviewResults.$inferInsert>
): Promise<ReviewResultRow[]> {
  if (values.length === 0) {
    return [];
  }

  return getDb().insert(reviewResults).values(values).returning();
}

export async function listReviewResultRowsByImageIds(
  imageIds: readonly string[],
  reviewerType?: typeof reviewResults.$inferSelect.reviewerType
): Promise<ReviewResultRow[]> {
  if (imageIds.length === 0) {
    return [];
  }

  const predicates = [inArray(reviewResults.imageId, [...imageIds])];

  if (reviewerType) {
    predicates.push(eq(reviewResults.reviewerType, reviewerType));
  }

  return getDb()
    .select()
    .from(reviewResults)
    .where(and(...predicates));
}
