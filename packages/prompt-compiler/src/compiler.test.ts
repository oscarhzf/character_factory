import type { CharacterRecord, UniverseRecord } from "@character-factory/core";
import { describe, expect, it } from "vitest";

import { buildVariantPrompts, compilePrompt } from "./compiler";

const universe: UniverseRecord = {
  id: "u-1",
  code: "GBA-URBAN",
  name: "广东城市拟人",
  styleConstitution: {
    proportionRules: ["exact 4-head proportion", "compact torso"],
    styleKeywords: ["new guochao urban", "sheet consistency"],
    renderingRules: ["clean lineart", "clean cel shading"],
    backgroundRules: ["light gray plain background"],
    sheetRules: ["full body readable", "clear silhouette"]
  },
  globalPromptTemplate:
    "4-head anime character sheet, new guochao urban style, clean lineart",
  globalNegativeTemplate:
    "photorealistic, realistic proportions, long legs, painterly background",
  createdAt: "2026-04-15T00:00:00.000Z",
  updatedAt: "2026-04-15T00:00:00.000Z"
};

const character: CharacterRecord = {
  id: "c-1",
  universeId: "u-1",
  code: "GZ-V1",
  name: "广州",
  status: "active" as const,
  description: "warm seasoned city elder sibling with lively food-culture energy",
  fixedTraits: {
    rolePersona: "warm and worldly cantonese city guide",
    identityKeywords: ["food capital", "lingnan vitality"],
    visualSilhouette: "compact confident body with welcoming arm gestures",
    hairstyle: "short tidy hair with subtle swept-back volume",
    outfitRules: ["modern lingnan jacket"],
    iconicProps: ["tea cup", "canton tower badge"]
  },
  semiFixedTraits: {
    optionalProps: ["dim sum basket"],
    expressionRange: ["friendly grin"],
    poseRange: ["welcoming wave"],
    outfitVariants: ["city casual"],
    compositionHints: ["full body front"]
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
  },
  createdAt: "2026-04-15T00:00:00.000Z",
  updatedAt: "2026-04-15T00:00:00.000Z"
};

describe("compilePrompt", () => {
  it("builds a structured prompt and negative prompt", () => {
    const result = compilePrompt({
      universe,
      character,
      taskPrompt: {
        action: "holding a tea cup",
        expression: "friendly grin",
        prop: "dim sum basket",
        view: "front full body",
        pose: "welcoming wave",
        composition: "character sheet centered"
      },
      strategy: "ratio_boost",
      variantKey: "1-ratio_boost",
      patch: {
        preserve: ["palette"],
        strengthen: ["exact_4_head_ratio"],
        suppress: ["fashion_model_feel"],
        append: [],
        remove: []
      }
    });

    expect(result.compiledPrompt).toContain("[UNIVERSE]");
    expect(result.compiledPrompt).toContain("[CHARACTER]");
    expect(result.compiledPrompt).toContain("[TASK]");
    expect(result.compiledPrompt).toContain("[VARIANT]");
    expect(result.compiledPrompt).toContain("[PATCH]");
    expect(result.compiledNegativePrompt).toContain("photorealistic");
    expect(result.compiledNegativePrompt).toContain("fashion_model_feel");
    expect(result.debugPayload.templateConfig.globalPromptTemplate).toBe(
      universe.globalPromptTemplate
    );
    expect(result.debugPayload.sections.variant).toContain(
      "strengthen the exact 4-head proportion read"
    );
  });
});

describe("buildVariantPrompts", () => {
  it("creates three visibly different variant prompts", () => {
    const variants = buildVariantPrompts({
      universe,
      character,
      taskPrompt: character.variableDefaults,
      strategies: ["ratio_boost", "style_lock", "pose_clarity"]
    });

    expect(variants).toHaveLength(3);
    expect(new Set(variants.map((item) => item.strategy)).size).toBe(3);
    expect(variants[0]?.compiledPrompt).not.toEqual(variants[1]?.compiledPrompt);
    expect(variants[1]?.compiledPrompt).not.toEqual(variants[2]?.compiledPrompt);
  });
});
