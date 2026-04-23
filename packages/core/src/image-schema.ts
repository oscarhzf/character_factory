import { z } from "zod";

import type { VariantStrategy } from "./prompt-schema";

export const imageStatusValues = [
  "created",
  "reviewed",
  "selected",
  "rejected",
  "candidate_master",
  "master"
] as const;

export const imageStatusSchema = z.enum(imageStatusValues);

export type ImageStatus = z.infer<typeof imageStatusSchema>;

export interface GeneratedImageRecord {
  id: string;
  jobId: string;
  promptVersionId: string | null;
  sourceApi: string;
  modelName: string;
  imageUrl: string;
  thumbUrl: string | null;
  revisedPrompt: string | null;
  generationMeta: Record<string, unknown>;
  status: ImageStatus;
  createdAt: string;
  promptVariant:
    | {
        id: string;
        variantKey: string;
        strategy: VariantStrategy;
      }
    | null;
}
