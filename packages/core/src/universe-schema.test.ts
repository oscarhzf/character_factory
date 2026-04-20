import { describe, expect, it } from "vitest";

import {
  defaultStyleConstitution,
  serializeStyleConstitution
} from "./universe-schema";

describe("universe schema serialization", () => {
  it("returns explicit default style constitution when omitted", () => {
    expect(serializeStyleConstitution(undefined)).toEqual(
      defaultStyleConstitution
    );
  });

  it("normalizes style constitution arrays and removes duplicates", () => {
    const result = serializeStyleConstitution({
      proportionRules: [" exact 4-head ", "exact 4-head", ""],
      styleKeywords: [" guochao ", "guochao", "urban"],
      renderingRules: [" clean lineart "],
      backgroundRules: [" gray background ", "gray background"],
      sheetRules: [" full body ", "full body"]
    });

    expect(result).toEqual({
      proportionRules: ["exact 4-head"],
      styleKeywords: ["guochao", "urban"],
      renderingRules: ["clean lineart"],
      backgroundRules: ["gray background"],
      sheetRules: ["full body"]
    });
  });
});
