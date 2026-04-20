import { describe, expect, it } from "vitest";

import "../test/setup";

import {
  compilePromptVersions,
  getPromptVersion,
  listPromptVersions
} from "./prompt-version-service";
import { createCharacter } from "./character-service";
import { createUniverse } from "./universe-service";

describe("prompt version services integration", () => {
  it("compiles, persists, and reloads prompt variants for a character", async () => {
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
      code: "GZ-V1",
      name: "广州",
      status: "active",
      description: "warm seasoned city elder sibling with lively food-culture energy",
      fixedTraits: {
        rolePersona: "warm and worldly cantonese city guide",
        identityKeywords: ["food capital", "lingnan vitality"],
        visualSilhouette: "compact confident body with welcoming arm gestures",
        hairstyle: "short tidy hair with subtle swept-back volume",
        outfitRules: ["modern lingnan jacket"],
        iconicProps: ["tea cup", "canton tower badge"]
      },
      variableDefaults: {
        action: "holding a tea cup",
        expression: "friendly grin",
        prop: "dim sum basket",
        view: "front full body",
        pose: "welcoming wave",
        composition: "character sheet centered"
      },
      palette: {
        primary: ["crimson", "warm beige"],
        secondary: ["charcoal"],
        accent: ["gold"],
        forbidden: ["cold neon purple"]
      },
      negativeRules: {
        anatomy: ["realistic long legs"],
        style: ["photoreal lighting"],
        props: ["futuristic weapon"],
        composition: ["busy street background"]
      }
    });

    const result = await compilePromptVersions({
      characterId: character.id,
      scope: "debug",
      taskPrompt: {
        expression: "focused but friendly",
        view: "three-quarter full body"
      },
      basePatch: {
        strengthen: ["exact_4_head_ratio"],
        suppress: ["fashion_model_feel"]
      }
    });

    expect(result.variants).toHaveLength(3);
    expect(result.resolvedTaskPrompt.action).toBe("holding a tea cup");
    expect(result.resolvedTaskPrompt.expression).toBe("focused but friendly");
    expect(result.variants[0]?.compiledPrompt).toContain("[UNIVERSE]");
    expect(result.variants[0]?.patch?.strengthen).toContain("exact_4_head_ratio");

    const stored = await getPromptVersion(result.variants[0]!.id);
    expect(stored.debugPayload.strategy).toBe(stored.strategy);
    expect(stored.compiledNegativePrompt).toContain("fashion_model_feel");

    const history = await listPromptVersions(character.id, 12);
    expect(history).toHaveLength(3);
    expect(history.map((item) => item.variantKey)).toEqual(
      expect.arrayContaining([
        "1-ratio_boost",
        "2-style_lock",
        "3-pose_clarity"
      ])
    );
  });
});
