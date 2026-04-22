import {
  calculateJobBatchSize,
  serializeJobCreateInput,
  serializeJobInputConfig,
  type JobCreateInput,
  type JobDetailRecord,
  type JobRecord
} from "@character-factory/core";

import {
  deleteGenerationJobRow,
  findGenerationJobDetailRowById,
  insertGenerationJobRow,
  type GenerationJobRow
} from "../repositories/job-repository";
import { parseEntityId } from "../service-input";
import { createNotFoundError, mapDatabaseError } from "../service-error";
import { getCharacter } from "./character-service";
import { listGeneratedImagesByJob } from "./generated-image-service";
import { compilePromptVersions, listPromptVersionsByJob } from "./prompt-version-service";

function toJobRecord(row: GenerationJobRow): JobRecord {
  const inputConfig = serializeJobInputConfig(row.inputConfigJson);

  return {
    id: row.id,
    characterId: row.characterId,
    mode: row.mode,
    status: row.status,
    sourceImageId: row.sourceImageId ?? null,
    inputConfig,
    batchSize: row.batchSize,
    createdBy: row.createdBy ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export async function getJobDetail(id: string): Promise<JobDetailRecord> {
  const jobId = parseEntityId(id);
  const row = await findGenerationJobDetailRowById(jobId);

  if (!row) {
    throw createNotFoundError("Job");
  }

  const [promptVariants, generatedImages] = await Promise.all([
    listPromptVersionsByJob(jobId),
    listGeneratedImagesByJob(jobId)
  ]);

  return {
    ...toJobRecord(row.job),
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
    },
    promptVariants,
    generatedImages
  };
}

export async function createJob(input: JobCreateInput): Promise<JobDetailRecord> {
  const values = serializeJobCreateInput(input);

  await getCharacter(values.characterId);

  let jobId: string | null = null;

  try {
    const jobRow = await insertGenerationJobRow({
      characterId: values.characterId,
      mode: values.mode,
      status: "queued",
      sourceImageId: values.sourceImageId,
      inputConfigJson: values.inputConfig,
      batchSize: calculateJobBatchSize(values.inputConfig),
      createdBy: values.createdBy
    });
    jobId = jobRow.id;

    await compilePromptVersions({
      characterId: values.characterId,
      jobId,
      scope: "job",
      taskPrompt: values.inputConfig.taskPrompt,
      variantStrategies: values.inputConfig.variantStrategies
    });

    return await getJobDetail(jobId);
  } catch (error) {
    if (jobId) {
      try {
        await deleteGenerationJobRow(jobId);
      } catch {
        // Keep the original error if cleanup also fails.
      }
    }

    if (error instanceof Error && error.name === "ServiceError") {
      throw error;
    }

    throw mapDatabaseError(error);
  }
}
