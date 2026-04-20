import path from "node:path";
import { fileURLToPath } from "node:url";

import { createCharacter, updateCharacter } from "./services/character-service";
import { createUniverse, updateUniverse } from "./services/universe-service";
import { findCharacterRowByCode } from "./repositories/character-repository";
import { findUniverseRowByCode } from "./repositories/universe-repository";
import { closePool } from "./client";

const demoUniversePayload = {
  code: "GBA-URBAN",
  name: "广东城市拟人",
  globalPromptTemplate:
    "4-head anime character sheet, new guochao urban style, clean lineart, cel shading, light gray background",
  globalNegativeTemplate:
    "photorealistic, realistic proportions, long legs, painterly background",
  styleConstitution: {
    proportionRules: ["exact 4-head proportion", "compact torso", "short structured legs"],
    styleKeywords: ["new guochao urban", "light hot-blooded comedy", "sheet consistency"],
    renderingRules: ["clean lineart", "clean cel shading", "controlled highlights"],
    backgroundRules: ["light gray plain background"],
    sheetRules: ["full body readable", "clear silhouette", "sheet layout consistency"]
  }
} as const;

const demoCharacterPayload = {
  code: "GZ-V1",
  name: "广州",
  status: "active" as const,
  description: "warm seasoned city elder sibling with lively food-culture energy",
  fixedTraits: {
    rolePersona: "warm and worldly cantonese city guide",
    identityKeywords: ["food capital", "lingnan vitality", "open and grounded"],
    visualSilhouette: "compact confident body with welcoming arm gestures",
    hairstyle: "short tidy hair with subtle swept-back volume",
    outfitRules: ["modern lingnan jacket", "comfortable urban sneakers"],
    iconicProps: ["tea cup", "canton tower badge"]
  },
  semiFixedTraits: {
    optionalProps: ["dim sum basket", "rain umbrella"],
    expressionRange: ["friendly grin", "calm confident smile"],
    poseRange: ["welcoming wave", "one hand offering snacks"],
    outfitVariants: ["city casual", "festival accent version"],
    compositionHints: ["full body front", "sheet pose variation"]
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
    secondary: ["charcoal", "jade green"],
    accent: ["gold"],
    forbidden: ["cold neon purple"]
  },
  negativeRules: {
    anatomy: ["realistic long legs", "small head proportions"],
    style: ["western fashion illustration", "photoreal lighting"],
    props: ["futuristic weapon"],
    composition: ["busy street background", "cropped full body"]
  }
};

async function main() {
  const existingUniverse = await findUniverseRowByCode(demoUniversePayload.code);
  let universeId = existingUniverse?.id;

  if (existingUniverse) {
    await updateUniverse(existingUniverse.id, demoUniversePayload);
  } else {
    const createdUniverse = await createUniverse(demoUniversePayload);
    universeId = createdUniverse.id;
  }

  if (!universeId) {
    throw new Error("Failed to resolve demo universe.");
  }

  const existingCharacter = await findCharacterRowByCode(demoCharacterPayload.code);

  if (existingCharacter) {
    await updateCharacter(existingCharacter.id, {
      ...demoCharacterPayload,
      universeId
    });
  } else {
    await createCharacter({
      ...demoCharacterPayload,
      universeId
    });
  }

  console.log("Demo seed completed.");
  await closePool();
}

function isDirectExecution(): boolean {
  const entryPoint = process.argv[1];

  if (!entryPoint) {
    return false;
  }

  return path.resolve(entryPoint) === fileURLToPath(import.meta.url);
}

if (isDirectExecution()) {
  main().catch(async (error) => {
    console.error(error);
    await closePool();
    process.exitCode = 1;
  });
}
