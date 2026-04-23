import { describe, expect, it } from "vitest";

import { sortGeneratedImagesByReview } from "./job-detail-state";

describe("job detail image sorting", () => {
  it("places higher scored reviewed images ahead of unrated candidates", () => {
    const sorted = sortGeneratedImagesByReview([
      {
        id: "1",
        jobId: "job-1",
        promptVersionId: null,
        sourceApi: "placeholder",
        modelName: "model",
        imageUrl: "image://1",
        thumbUrl: null,
        revisedPrompt: null,
        generationMeta: {},
        status: "created",
        createdAt: "2026-04-23T00:00:00.000Z",
        promptVariant: null,
        autoReview: null
      },
      {
        id: "2",
        jobId: "job-1",
        promptVersionId: null,
        sourceApi: "placeholder",
        modelName: "model",
        imageUrl: "image://2",
        thumbUrl: null,
        revisedPrompt: null,
        generationMeta: {},
        status: "reviewed",
        createdAt: "2026-04-22T00:00:00.000Z",
        promptVariant: null,
        autoReview: {
          id: "review-2",
          imageId: "2",
          reviewerType: "auto",
          characterCode: "SZ-V1",
          isValidCandidate: true,
          totalScore: 86,
          dimensionScores: {
            styleUnity: 22,
            characterIdentity: 16,
            ratioAccuracy: 17,
            posePropMatch: 8,
            paletteMatch: 9,
            sheetIntegrity: 9,
            masterPotential: 5
          },
          failureTags: [],
          fixSuggestions: [],
          bestUse: "candidate_master",
          createdAt: "2026-04-22T00:00:00.000Z"
        }
      }
    ]);

    expect(sorted[0]?.id).toBe("2");
    expect(sorted[1]?.id).toBe("1");
  });
});
