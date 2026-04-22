import {
  serializeGenerationJobCreateInput,
  serializeGenerationJobInputConfig,
  type GenerationJobCreateInput,
  type GenerationJobDetail,
  type GenerationJobListItem,
  type GenerationJobRecord,
  type JobMode,
  type JobStatus
} from "@character-factory/core";

import { findCharacterRowById } from "../repositories/character-repository";
import {
  findGenerationJobRowById,
  insertGenerationJobRow,
  listGenerationJobRows,
  type GenerationJobRow,
  type GenerationJobRowWithCharacter
} from "../repositories/generation-job-repository";
import { parseEntityId } from "../service-input";
import { createNotFoundError, mapDatabaseError } from "../service-error";
import { listGeneratedImagesByJob } from "./generated-image-service";
import { compilePromptVersions, listPromptVersionsByJob } from "./prompt-version-service";

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

async function ensureCharacterExists(characterId: string): Promise<void> {
  const row = await findCharacterRowById(characterId);

  if (!row) {
    throw createNotFoundError("Character");
  }
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
  await ensureCharacterExists(values.characterId);

  try {
    const row = await insertGenerationJobRow({
      characterId: values.characterId,
      mode: values.mode,
      status: "queued",
      sourceImageId: values.sourceImageId,
      inputConfigJson: values.inputConfig,
      batchSize: values.batchSize,
      createdBy: values.createdBy || null
    });

    await compilePromptVersions({
      characterId: values.characterId,
      jobId: row.id,
      scope: "job",
      taskPrompt: values.inputConfig.taskPrompt,
      variantStrategies: values.inputConfig.variantStrategies
    });

    return toGenerationJobRecord(row);
  } catch (error) {
    throw mapDatabaseError(error);
  }
}
