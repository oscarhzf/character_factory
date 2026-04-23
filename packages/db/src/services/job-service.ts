import type {
  GenerationJobCreateInput,
  GenerationJobDetail,
  GenerationJobRecord
} from "@character-factory/core";

import { createGenerationJob, getGenerationJob } from "./generation-job-service";

export type JobCreateInput = GenerationJobCreateInput;
export type JobDetailRecord = GenerationJobDetail;
export type JobRecord = GenerationJobRecord;

export async function createJob(
  input: JobCreateInput
): Promise<JobDetailRecord> {
  const created = await createGenerationJob(input);
  return getGenerationJob(created.id);
}

export async function getJobDetail(id: string): Promise<JobDetailRecord> {
  return getGenerationJob(id);
}
