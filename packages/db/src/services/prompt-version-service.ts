import {
  defaultPromptPatch,
  defaultPromptTemplateConfig,
  defaultTaskPrompt,
  promptDebugPayloadSchema,
  resolveTaskPrompt,
  serializePromptCompileInput,
  serializePromptPatch,
  serializePromptTemplateConfig,
  type PromptCompileInput,
  type PromptCompileResult,
  type PromptDebugPayload,
  type PromptVersionRecord,
  type VariantStrategy,
  variantStrategySchema
} from "@character-factory/core";
import { buildVariantPrompts } from "@character-factory/prompt-compiler";

import {
  findPromptVersionRowById,
  insertPromptVersionRows,
  listPromptVersionRowsByCharacter,
  listPromptVersionRowsByJob,
  type PromptVersionRow
} from "../repositories/prompt-version-repository";
import { parseEntityId } from "../service-input";
import { createNotFoundError, mapDatabaseError } from "../service-error";
import { getCharacter } from "./character-service";
import { getUniverse } from "./universe-service";

function createFallbackDebugPayload(
  strategy: VariantStrategy,
  variantKey: string
): PromptDebugPayload {
  return {
    variantKey,
    strategy,
    templateConfig: defaultPromptTemplateConfig,
    resolvedTaskPrompt: defaultTaskPrompt,
    normalizedPatch: defaultPromptPatch,
    sections: {
      universe: [],
      character: [],
      task: [],
      variant: [],
      patch: [],
      output: [],
      negative: []
    }
  };
}

export function mapPromptVersionRowToRecord(
  row: PromptVersionRow
): PromptVersionRecord {
  const strategy = variantStrategySchema.parse(row.strategy);
  const variantKey = row.variantKey ?? strategy;
  const patch = row.patchJson ? serializePromptPatch(row.patchJson) : null;
  const debugPayload = row.debugPayloadJson
    ? promptDebugPayloadSchema.parse(row.debugPayloadJson)
    : createFallbackDebugPayload(strategy, variantKey);

  return {
    id: row.id,
    characterId: row.characterId,
    jobId: row.jobId ?? null,
    parentPromptVersionId: row.parentPromptVersionId ?? null,
    scope: row.scope,
    variantKey,
    strategy,
    compiledPrompt: row.compiledPrompt,
    compiledNegativePrompt: row.compiledNegativePrompt ?? "",
    patch,
    debugPayload,
    createdAt: row.createdAt.toISOString()
  };
}

export async function listPromptVersions(
  characterId: string,
  limit = 9
): Promise<PromptVersionRecord[]> {
  await getCharacter(characterId);

  try {
    const rows = await listPromptVersionRowsByCharacter(characterId, limit);
    return rows.map((row) => mapPromptVersionRowToRecord(row));
  } catch (error) {
    throw mapDatabaseError(error);
  }
}

export async function listPromptVersionsByJob(
  jobId: string
): Promise<PromptVersionRecord[]> {
  const generationJobId = parseEntityId(jobId);

  try {
    const rows = await listPromptVersionRowsByJob(generationJobId);
    return rows.map((row) => mapPromptVersionRowToRecord(row));
  } catch (error) {
    throw mapDatabaseError(error);
  }
}

export async function getPromptVersion(id: string): Promise<PromptVersionRecord> {
  const promptVersionId = parseEntityId(id);
  const row = await findPromptVersionRowById(promptVersionId);

  if (!row) {
    throw createNotFoundError("Prompt version");
  }

  return mapPromptVersionRowToRecord(row);
}

export async function compilePromptVersions(
  input: PromptCompileInput
): Promise<PromptCompileResult> {
  const values = serializePromptCompileInput(input);
  const character = await getCharacter(values.characterId);
  const universe = await getUniverse(character.universe.id);
  const resolvedTemplateConfig =
    values.templateConfig ??
    serializePromptTemplateConfig({
      globalPromptTemplate: universe.globalPromptTemplate,
      globalNegativeTemplate: universe.globalNegativeTemplate
    });
  const resolvedTaskPrompt = resolveTaskPrompt(
    character.variableDefaults,
    values.taskPrompt
  );
  const compiledVariants = buildVariantPrompts({
    universe: {
      ...universe,
      globalPromptTemplate: resolvedTemplateConfig.globalPromptTemplate,
      globalNegativeTemplate: resolvedTemplateConfig.globalNegativeTemplate
    },
    character,
    taskPrompt: resolvedTaskPrompt,
    strategies: values.variantStrategies,
    patch: values.basePatch
  });

  try {
    const rows = await insertPromptVersionRows(
      compiledVariants.map((variant) => ({
        characterId: character.id,
        jobId: values.jobId,
        parentPromptVersionId: values.parentPromptVersionId,
        scope: values.scope,
        variantKey: variant.variantKey,
        strategy: variant.strategy,
        compiledPrompt: variant.compiledPrompt,
        compiledNegativePrompt: variant.compiledNegativePrompt,
        patchJson: variant.patch,
        debugPayloadJson: variant.debugPayload
      }))
    );

    return {
      character: {
        id: character.id,
        code: character.code,
        name: character.name
      },
      universe: {
        id: universe.id,
        code: universe.code,
        name: universe.name
      },
      templateConfig: resolvedTemplateConfig,
      resolvedTaskPrompt,
      variants: rows.map((row) => mapPromptVersionRowToRecord(row))
    };
  } catch (error) {
    throw mapDatabaseError(error);
  }
}
