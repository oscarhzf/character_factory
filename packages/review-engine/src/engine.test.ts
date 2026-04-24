import { describe, expect, it } from "vitest";

import { rankReviews, reviewCandidateImage } from "./engine";

describe("review engine", () => {
  it("returns a structured review for a candidate image", () => {
    const review = reviewCandidateImage({
      characterCode: "SZ-V1",
      variantKey: "1-style_lock",
      strategy: "style_lock",
      candidateNumber: 1,
      taskPrompt: {
        action: "holding a smartphone",
        expression: "focused",
        prop: "smartphone",
        view: "front full body",
        pose: "slight forward lean",
        composition: "character sheet centered"
      }
    });

    expect(review.characterCode).toBe("SZ-V1");
    expect(review.totalScore).toBeGreaterThan(0);
    expect(review.bestUse).toBe("candidate_master");
    expect(review.dimensionScores.styleUnity).toBeGreaterThanOrEqual(20);
    expect(review.failureTags).toHaveLength(0);
  });

  it("ranks higher-scoring reviews first", () => {
    const ranked = rankReviews([
      {
        totalScore: 72,
        bestUse: "refine" as const,
        failureTags: ["palette_off"]
      },
      {
        totalScore: 88,
        bestUse: "candidate_master" as const,
        failureTags: []
      }
    ]);

    expect(ranked[0]?.totalScore).toBe(88);
    expect(ranked[1]?.totalScore).toBe(72);
  });
});
