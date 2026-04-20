import type { CharacterListItem, ImageQuality, JobMode, VariantStrategy } from "@character-factory/core";
import { variantStrategyValues } from "@character-factory/core";

export interface JobFormState {
  characterId: string;
  mode: JobMode;
  sourceImageId: string;
  createdBy: string;
  action: string;
  expression: string;
  prop: string;
  view: string;
  pose: string;
  composition: string;
  imagesPerVariant: string;
  size: string;
  quality: ImageQuality;
  strategies: VariantStrategy[];
}

export type JobTaskPromptFields = Pick<
  JobFormState,
  "action" | "expression" | "prop" | "view" | "pose" | "composition"
>;

export function getCharacterTaskPromptFields(
  character: Pick<CharacterListItem, "variableDefaults"> | null
): JobTaskPromptFields {
  return {
    action: character?.variableDefaults.action ?? "",
    expression: character?.variableDefaults.expression ?? "",
    prop: character?.variableDefaults.prop ?? "",
    view: character?.variableDefaults.view ?? "",
    pose: character?.variableDefaults.pose ?? "",
    composition: character?.variableDefaults.composition ?? ""
  };
}

export function createInitialJobFormState(
  characters: CharacterListItem[],
  initialCharacterId?: string
): JobFormState {
  const selectedCharacter =
    characters.find((character) => character.id === initialCharacterId) ??
    characters[0] ??
    null;
  const taskPromptFields = getCharacterTaskPromptFields(selectedCharacter);

  return {
    characterId: selectedCharacter?.id ?? "",
    mode: "explore",
    sourceImageId: "",
    createdBy: "",
    ...taskPromptFields,
    imagesPerVariant: "4",
    size: "1024x1536",
    quality: "high",
    strategies: [...variantStrategyValues]
  };
}
