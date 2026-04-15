import { describe, expect, it } from "vitest";

import "../test/setup";

import { getPool } from "../client";
import { createCharacter, getCharacter } from "./character-service";
import { createUniverse, deleteUniverse } from "./universe-service";

describe("character and universe services integration", () => {
  it("persists normalized JSON fields for a created character", async () => {
    const universe = await createUniverse({
      code: "GBA-URBAN",
      name: "广东城市拟人",
      globalPromptTemplate: "4-head anime sheet",
      styleConstitution: {
        proportionRules: [" exact 4-head ", "exact 4-head"],
        styleKeywords: [" guochao ", "urban"],
        renderingRules: [" clean lineart "],
        backgroundRules: [" gray background "],
        sheetRules: [" full body readable "]
      }
    });

    const created = await createCharacter({
      universeId: universe.id,
      code: "GZ-V1",
      name: "广州",
      status: "active",
      description: "  lively city guide  ",
      fixedTraits: {
        rolePersona: "  warm guide  ",
        identityKeywords: [" food capital ", "food capital", ""],
        visualSilhouette: " compact body ",
        hairstyle: " swept back ",
        outfitRules: [" jacket ", "jacket"],
        iconicProps: [" tea cup ", "badge"]
      },
      semiFixedTraits: {
        optionalProps: [" dim sum basket ", "dim sum basket"],
        expressionRange: [" friendly grin "],
        poseRange: [" welcoming wave "],
        outfitVariants: [" city casual "],
        compositionHints: [" full body front "]
      },
      variableDefaults: {
        action: " holding tea ",
        expression: " smile ",
        prop: " tea cup ",
        view: " front ",
        pose: " wave ",
        composition: " centered "
      },
      palette: {
        primary: [" crimson ", "crimson"],
        secondary: [" jade "],
        accent: [" gold "],
        forbidden: [" neon purple "]
      },
      negativeRules: {
        anatomy: [" long legs "],
        style: [" photoreal lighting "],
        props: [" weapon "],
        composition: [" busy background "]
      }
    });

    const loaded = await getCharacter(created.id);

    expect(loaded).toMatchObject({
      code: "GZ-V1",
      name: "广州",
      description: "lively city guide",
      fixedTraits: {
        rolePersona: "warm guide",
        identityKeywords: ["food capital"],
        visualSilhouette: "compact body",
        hairstyle: "swept back",
        outfitRules: ["jacket"],
        iconicProps: ["tea cup", "badge"]
      },
      semiFixedTraits: {
        optionalProps: ["dim sum basket"],
        expressionRange: ["friendly grin"],
        poseRange: ["welcoming wave"],
        outfitVariants: ["city casual"],
        compositionHints: ["full body front"]
      },
      variableDefaults: {
        action: "holding tea",
        expression: "smile",
        prop: "tea cup",
        view: "front",
        pose: "wave",
        composition: "centered"
      },
      palette: {
        primary: ["crimson"],
        secondary: ["jade"],
        accent: ["gold"],
        forbidden: ["neon purple"]
      },
      negativeRules: {
        anatomy: ["long legs"],
        style: ["photoreal lighting"],
        props: ["weapon"],
        composition: ["busy background"]
      }
    });
  });

  it("blocks universe deletion in the service layer when characters depend on it", async () => {
    const universe = await createUniverse({
      code: "GBA-URBAN",
      name: "广东城市拟人",
      globalPromptTemplate: "4-head anime sheet"
    });

    await createCharacter({
      universeId: universe.id,
      code: "GZ-V1",
      name: "广州",
      status: "active"
    });

    await expect(deleteUniverse(universe.id)).rejects.toMatchObject({
      name: "ServiceError",
      code: "DEPENDENCY_CONFLICT",
      statusCode: 409
    });
  });

  it("keeps the database-level restrict protection for universe deletion", async () => {
    const universe = await createUniverse({
      code: "GBA-URBAN",
      name: "广东城市拟人",
      globalPromptTemplate: "4-head anime sheet"
    });

    await createCharacter({
      universeId: universe.id,
      code: "GZ-V1",
      name: "广州",
      status: "active"
    });

    await expect(
      getPool().query("delete from universes where id = $1", [universe.id])
    ).rejects.toMatchObject({
      code: "23503"
    });
  });
});
