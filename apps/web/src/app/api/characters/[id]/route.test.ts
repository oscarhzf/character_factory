import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  deleteCharacter: vi.fn(),
  getCharacter: vi.fn(),
  updateCharacter: vi.fn()
}));

vi.mock("@character-factory/db", () => dbMocks);

import { PATCH } from "./route";

describe("PATCH /api/characters/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the refreshed character detail shape after updating", async () => {
    const characterId = "11111111-1111-4111-8111-111111111111";

    dbMocks.updateCharacter.mockResolvedValue({
      id: characterId,
      universeId: "22222222-2222-4222-8222-222222222222",
      code: "GZ-V1",
      name: "Guangzhou",
      status: "active",
      description: "updated",
      fixedTraits: {
        rolePersona: "",
        identityKeywords: [],
        visualSilhouette: "",
        hairstyle: "",
        outfitRules: [],
        iconicProps: []
      },
      semiFixedTraits: {
        optionalProps: [],
        expressionRange: [],
        poseRange: [],
        outfitVariants: [],
        compositionHints: []
      },
      variableDefaults: {
        action: "",
        expression: "",
        prop: "",
        view: "",
        pose: "",
        composition: ""
      },
      palette: {
        primary: [],
        secondary: [],
        accent: [],
        forbidden: []
      },
      negativeRules: {
        anatomy: [],
        style: [],
        props: [],
        composition: []
      },
      createdAt: "2026-04-16T00:00:00.000Z",
      updatedAt: "2026-04-16T00:00:00.000Z"
    });

    dbMocks.getCharacter.mockResolvedValue({
      id: characterId,
      universeId: "22222222-2222-4222-8222-222222222222",
      code: "GZ-V1",
      name: "Guangzhou",
      status: "active",
      description: "updated",
      fixedTraits: {
        rolePersona: "",
        identityKeywords: [],
        visualSilhouette: "",
        hairstyle: "",
        outfitRules: [],
        iconicProps: []
      },
      semiFixedTraits: {
        optionalProps: [],
        expressionRange: [],
        poseRange: [],
        outfitVariants: [],
        compositionHints: []
      },
      variableDefaults: {
        action: "",
        expression: "",
        prop: "",
        view: "",
        pose: "",
        composition: ""
      },
      palette: {
        primary: [],
        secondary: [],
        accent: [],
        forbidden: []
      },
      negativeRules: {
        anatomy: [],
        style: [],
        props: [],
        composition: []
      },
      createdAt: "2026-04-16T00:00:00.000Z",
      updatedAt: "2026-04-16T00:00:00.000Z",
      universe: {
        id: "22222222-2222-4222-8222-222222222222",
        code: "GBA-URBAN",
        name: "GBA Urban"
      }
    });

    const request = new Request(`http://localhost/api/characters/${characterId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "Guangzhou"
      })
    });

    const response = await PATCH(request as NextRequest, {
      params: Promise.resolve({ id: characterId })
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(dbMocks.updateCharacter).toHaveBeenCalledWith(characterId, {
      name: "Guangzhou"
    });
    expect(dbMocks.getCharacter).toHaveBeenCalledWith(characterId);
    expect(payload.data.universe).toMatchObject({
      code: "GBA-URBAN",
      name: "GBA Urban"
    });
  });
});
