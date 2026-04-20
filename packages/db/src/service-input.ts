import { entityIdParamsSchema } from "@character-factory/core";

import { createValidationError } from "./service-error";

export function parseEntityId(id: string): string {
  const result = entityIdParamsSchema.safeParse({ id });

  if (!result.success) {
    throw createValidationError("Request validation failed.", {
      issues: result.error.issues
    });
  }

  return result.data.id;
}
