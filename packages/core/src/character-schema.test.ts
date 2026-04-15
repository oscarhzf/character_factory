import { describe, expect, it } from "vitest";

import {
  defaultFixedTraits,
  defaultNegativeRules,
  defaultPalette,
  defaultSemiFixedTraits,
  defaultVariableDefaults,
  serializeCharacterInput,
  serializeFixedTraits
} from "./character-schema";

describe("character schema serialization", () => {
  it("fills missing structured fields with explicit defaults", () => {
    const result = serializeCharacterInput({
      universeId: "11111111-1111-1111-1111-111111111111",
      code: "  GZ-V1  ",
      name: "  广州  ",
      status: "draft"
    });

    expect(result).toMatchObject({
      universeId: "11111111-1111-1111-1111-111111111111",
      code: "GZ-V1",
      name: "广州",
      description: "",
      fixedTraits: defaultFixedTraits,
      semiFixedTraits: defaultSemiFixedTraits,
      variableDefaults: defaultVariableDefaults,
      palette: defaultPalette,
      negativeRules: defaultNegativeRules
    });
  });

  it("normalizes string arrays, trims text, removes duplicates and drops unknown fields", () => {
    const result = serializeFixedTraits({
      rolePersona: "  warm guide  ",
      identityKeywords: ["  food capital ", "food capital", "", "  "],
      visualSilhouette: "  compact body  ",
      hairstyle: "  swept back  ",
      outfitRules: [" jacket ", "jacket", " "],
      iconicProps: [" tea cup ", "tea cup", "badge"],
      ignored: "should not survive"
    });

    expect(result).toEqual({
      rolePersona: "warm guide",
      identityKeywords: ["food capital"],
      visualSilhouette: "compact body",
      hairstyle: "swept back",
      outfitRules: ["jacket"],
      iconicProps: ["tea cup", "badge"]
    });
  });
});
