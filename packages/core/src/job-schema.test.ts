import { describe, expect, it } from "vitest";

import {
  generationJobCreateInputSchema,
  serializeGenerationJobCreateInput
} from "./job-schema";

describe("generation job schema", () => {
  it("fills explore defaults and computes batch size", () => {
    const parsed = generationJobCreateInputSchema.parse({
      characterId: "9ac4a514-f0dd-466a-8f73-2e5b9e5f2f90"
    });

    const serialized = serializeGenerationJobCreateInput(parsed);

    expect(serialized).toMatchObject({
      mode: "explore",
      sourceImageId: null,
      batchSize: 12,
      inputConfig: {
        imagesPerVariant: 4,
        size: "1024x1536",
        quality: "high",
        variantStrategies: ["ratio_boost", "style_lock", "pose_clarity"]
      }
    });
  });

  it("requires a source image for refine jobs", () => {
    expect(() =>
      generationJobCreateInputSchema.parse({
        characterId: "9ac4a514-f0dd-466a-8f73-2e5b9e5f2f90",
        mode: "refine"
      })
    ).toThrowError(/sourceImageId/i);
  });
});
