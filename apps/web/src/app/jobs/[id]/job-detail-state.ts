import type { GenerationJobDetail } from "@character-factory/core";

type JobImage = GenerationJobDetail["generatedImages"][number];

export function sortGeneratedImagesByReview(images: readonly JobImage[]): JobImage[] {
  return [...images].sort((left, right) => {
    const leftScore = left.autoReview?.totalScore ?? -1;
    const rightScore = right.autoReview?.totalScore ?? -1;

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    return Date.parse(right.createdAt) - Date.parse(left.createdAt);
  });
}
