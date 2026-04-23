import {
  resolveTaskPrompt,
  serializeGenerationJobCreateInput,
  serializeGenerationJobInputConfig,
  type GenerationJobCreateInput,
  type GenerationJobDetail,
  type GenerationJobListItem,
  type GenerationJobRecord,
  type JobMode,
  type JobStatus
} from "@character-factory/core";
import { buildVariantPrompts } from "@character-factory/prompt-compiler";

import {
  findGenerationJobRowById,
  insertGenerationJobWithPromptVersionRows,
  listGenerationJobRows,
  type GenerationJobRow,
  type GenerationJobRowWithCharacter
} from "../repositories/generation-job-repository";
import { parseEntityId } from "../service-input";
import { createNotFoundError, mapDatabaseError } from "../service-error";
import { getCharacter } from "./character-service";
import { listGeneratedImagesByJob } from "./generated-image-service";
import { listPromptVersionsByJob } from "./prompt-version-service";
import { getUniverse } from "./universe-service";

function toGenerationJobRecord(row: GenerationJobRow): GenerationJobRecord {
  return {
    id: row.id,
    characterId: row.characterId,
    mode: row.mode,
    status: row.status,
    sourceImageId: row.sourceImageId ?? null,
    inputConfig: serializeGenerationJobInputConfig(row.inputConfigJson, row.mode),
    batchSize: row.batchSize,
    createdBy: row.createdBy ?? "",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function toGenerationJobListItem(
  row: GenerationJobRowWithCharacter
): GenerationJobListItem {
  return {
    ...toGenerationJobRecord(row.job),
    character: {
      id: row.character.id,
      code: row.character.code,
      name: row.character.name,
      status: row.character.status,
      universe: {
        id: row.universe.id,
        code: row.universe.code,
        name: row.universe.name
      }
    }
  };
}

export async function listGenerationJobs(filters?: {
  characterId?: string;
  mode?: JobMode;
  status?: JobStatus;
  limit?: number;
}): Promise<GenerationJobListItem[]> {
  const characterId = filters?.characterId
    ? parseEntityId(filters.characterId)
    : undefined;

  try {
    const rows = await listGenerationJobRows({
      characterId,
      mode: filters?.mode,
      status: filters?.status,
      limit: filters?.limit
    });

    return rows.map((row) => toGenerationJobListItem(row));
  } catch (error) {
    throw mapDatabaseError(error);
  }
}

export async function getGenerationJob(id: string): Promise<GenerationJobDetail> {
  const jobId = parseEntityId(id);

  try {
    const row = await findGenerationJobRowById(jobId);

    if (!row) {
      throw createNotFoundError("Generation job");
    }

    const [promptVariants, generatedImages] = await Promise.all([
      listPromptVersionsByJob(jobId),
      listGeneratedImagesByJob(jobId)
    ]);

    return {
      ...toGenerationJobListItem(row),
      promptVariants,
      generatedImages
    };
  } catch (error) {
    if (error instanceof Error && error.name === "ServiceError") {
      throw error;
    }

    throw mapDatabaseError(error);
  }
}

export async function createGenerationJob(
  input: GenerationJobCreateInput
): Promise<GenerationJobRecord> {
  const values = serializeGenerationJobCreateInput(input);
  const character = await getCharacter(values.characterId);
  const universe = await getUniverse(character.universe.id);
  const resolvedTaskPrompt = resolveTaskPrompt(
    character.variableDefaults,
    values.inputConfig.taskPrompt
  );

  try {
    const row = await insertGenerationJobWithPromptVersionRows(
      {
        characterId: values.characterId,
        mode: values.mode,
        status: "queued",
        sourceImageId: values.sourceImageId,
        inputConfigJson: values.inputConfig,
        batchSize: values.batchSize,
        createdBy: values.createdBy || null
      },
      (job) =>
        buildVariantPrompts({
          universe,
          character,
          taskPrompt: resolvedTaskPrompt,
          strategies: values.inputConfig.variantStrategies
        }).map((variant) => ({
          characterId: values.characterId,
          jobId: job.id,
          parentPromptVersionId: null,
          scope: "job",
          variantKey: variant.variantKey,
          strategy: variant.strategy,
          compiledPrompt: variant.compiledPrompt,
          compiledNegativePrompt: variant.compiledNegativePrompt,
          patchJson: variant.patch,
          debugPayloadJson: variant.debugPayload
        }))
    );

    return toGenerationJobRecord(row);
  } catch (error) {
    throw mapDatabaseError(error);
  }
}
