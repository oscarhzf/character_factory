import { describe, expect, it } from "vitest";

import "../test/setup";

import { insertGeneratedImageRows } from "../repositories/generated-image-repository";
import { createCharacter } from "./character-service";
import { createJob, getJobDetail } from "./job-service";
import { createUniverse } from "./universe-service";

describe("job services integration", () => {
  it("creates a job and persists prompt variants on the job detail", async () => {
    const universe = await createUniverse({
      code: "GBA-URBAN",
      name: "广东城市拟人",
      globalPromptTemplate:
        "4-head anime character sheet, new guochao urban style, clean lineart",
      globalNegativeTemplate:
        "photorealistic, realistic proportions, long legs, painterly background",
      styleConstitution: {
        proportionRules: ["exact 4-head proportion", "compact torso"],
        styleKeywords: ["new guochao urban", "sheet consistency"],
        renderingRules: ["clean lineart", "clean cel shading"],
        backgroundRules: ["light gray plain background"],
        sheetRules: ["full body readable", "clear silhouette"]
      }
    });

    const character = await createCharacter({
      universeId: universe.id,
      code: "SZ-V1",
      name: "深圳",
      status: "active",
      description: "sharp and fast-moving city achiever",
      fixedTraits: {
        rolePersona: "young urban problem solver",
        identityKeywords: ["startup spirit", "precision"],
        visualSilhouette: "compact body with a crisp forward stance",
        hairstyle: "short neat hair",
        outfitRules: ["city commuter jacket"],
        iconicProps: ["smartphone"]
      },
      variableDefaults: {
        action: "holding a smartphone",
        expression: "focused",
        prop: "smartphone",
        view: "front full body",
        pose: "slight forward lean",
        composition: "character sheet centered"
      },
      negativeRules: {
        anatomy: ["realistic long legs"],
        style: ["photoreal lighting"],
        props: ["weapon"],
        composition: ["busy street background"]
      }
    });

    const created = await createJob({
      characterId: character.id,
      mode: "explore",
      inputConfig: {
        taskPrompt: {
          action: "checking a fast-moving dashboard",
          expression: "calm but intense"
        },
        variantStrategies: ["ratio_boost", "pose_clarity"],
        imagesPerVariant: 3,
        size: "1024x1536",
        quality: "high"
      },
      createdBy: "codex"
    });

    expect(created.mode).toBe("explore");
    expect(created.status).toBe("queued");
    expect(created.batchSize).toBe(6);
    expect(created.character.code).toBe("SZ-V1");
    expect(created.inputConfig.variantStrategies).toEqual([
      "ratio_boost",
      "pose_clarity"
    ]);
    expect(created.promptVariants).toHaveLength(2);
    expect(created.generatedImages).toEqual([]);
    expect(created.promptVariants[0]?.jobId).toBe(created.id);
    expect(created.promptVariants[0]?.scope).toBe("job");
    expect(created.promptVariants[0]?.debugPayload.resolvedTaskPrompt.action).toBe(
      "checking a fast-moving dashboard"
    );

    await insertGeneratedImageRows([
      {
        jobId: created.id,
        promptVersionId: created.promptVariants[0]!.id,
        sourceApi: "openai",
        modelName: "gpt-image-1",
        imageUrl: "https://example.com/generated/sz-1.png",
        thumbUrl: "https://example.com/generated/sz-1-thumb.png",
        revisedPrompt: "revised prompt snapshot",
        generationMetaJson: {
          seed: 42
        },
        status: "created"
      }
    ]);

    const loaded = await getJobDetail(created.id);

    expect(loaded.id).toBe(created.id);
    expect(loaded.promptVariants.map((variant) => variant.variantKey)).toEqual([
      "1-ratio_boost",
      "2-pose_clarity"
    ]);
    expect(loaded.generatedImages).toHaveLength(1);
    expect(loaded.generatedImages[0]?.promptVariant).toMatchObject({
      variantKey: "1-ratio_boost",
      strategy: "ratio_boost"
    });
  });
});
