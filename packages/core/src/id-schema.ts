import { z } from "zod";

export const entityIdSchema = z.uuid();

export const entityIdParamsSchema = z.object({
  id: entityIdSchema
});

export type EntityIdParams = z.infer<typeof entityIdParamsSchema>;
