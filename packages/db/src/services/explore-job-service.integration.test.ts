import { describe, expect, it } from "vitest";

import "../test/setup";

import { createCharacter } from "./character-service";
import { generateExploreCandidates } from "./explore-job-service";
import { createJob } from "./job-service";
import { createUniverse } from "./universe-service";

describe("explore job services integration", () => {
  it("generates placeholder candidate images and completes the explore job", async () => {
    const universe = await createUniverse({
      code: "GBA-URBAN",
      name: "广东城市拟人",
      globalPromptTemplate:
        "4-head anime character sheet, new guochao urban style, clean lineart",
      globalNegativeTemplate:
        "photorealistic, realistic proportions, long legs, painterly background"
    });

    const character = await createCharacter({
      universeId: universe.id,
      code: "GZ-V1",
      name: "广州",
      status: "active",
      variableDefaults: {
        action: "holding tea",
        expression: "friendly grin",
        prop: "tea cup",
        view: "front full body",
        pose: "welcoming wave",
        composition: "character sheet centered"
      }
    });

    const created = await createJob({
      characterId: character.id,
      mode: "explore",
      inputConfig: {
        variantStrategies: ["ratio_boost", "style_lock", "pose_clarity"],
        imagesPerVariant: 2,
        size: "1024x1536",
        quality: "high"
      }
    });

    expect(created.status).toBe("queued");
    expect(created.generatedImages).toEqual([]);

    const generated = await generateExploreCandidates(created.id);

    expect(generated.status).toBe("completed");
    expect(generated.generatedImages).toHaveLength(6);
    expect(generated.generatedImages[0]?.sourceApi).toBe("placeholder");
    expect(generated.generatedImages[0]?.modelName).toBe("explore-placeholder-v1");
    expect(generated.generatedImages[0]?.status).toBe("reviewed");
    expect(generated.generatedImages[0]?.imageUrl).toContain(
      "data:image/svg+xml"
    );
    expect(generated.generatedImages[0]?.promptVariant?.variantKey).toBe(
      "1-ratio_boost"
    );
    expect(generated.generatedImages[0]?.autoReview?.totalScore).toBeGreaterThan(0);
    expect(generated.generatedImages[0]?.autoReview?.reviewerType).toBe("auto");
  });
});
