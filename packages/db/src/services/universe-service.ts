import {
  createNotFoundError,
  mapDatabaseError,
  createDependencyError
} from "../service-error";
import {
  countCharactersForUniverse,
  deleteUniverseRow,
  findUniverseRowById,
  insertUniverseRow,
  listUniverseRows,
  updateUniverseRow
} from "../repositories/universe-repository";
import {
  serializeStyleConstitution,
  serializeUniverseInput,
  serializeUniversePatch,
  type UniverseCreateInput,
  type UniverseRecord,
  type UniverseUpdateInput
} from "@character-factory/core";

function toUniverseRecord(
  row: Awaited<ReturnType<typeof findUniverseRowById>> extends infer TResult
    ? Exclude<TResult, undefined>
    : never
): UniverseRecord {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    styleConstitution: serializeStyleConstitution(row.styleConstitutionJson),
    globalPromptTemplate: row.globalPromptTemplate,
    globalNegativeTemplate: row.globalNegativeTemplate ?? "",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export async function listUniverses(): Promise<UniverseRecord[]> {
  const rows = await listUniverseRows();
  return rows.map((row) => toUniverseRecord(row));
}

export async function getUniverse(id: string): Promise<UniverseRecord> {
  const row = await findUniverseRowById(id);

  if (!row) {
    throw createNotFoundError("Universe");
  }

  return toUniverseRecord(row);
}

export async function createUniverse(
  input: UniverseCreateInput
): Promise<UniverseRecord> {
  const values = serializeUniverseInput(input);

  try {
    const row = await insertUniverseRow({
      code: values.code,
      name: values.name,
      styleConstitutionJson: values.styleConstitution,
      globalPromptTemplate: values.globalPromptTemplate,
      globalNegativeTemplate: values.globalNegativeTemplate
    });

    return toUniverseRecord(row);
  } catch (error) {
    throw mapDatabaseError(error);
  }
}

export async function updateUniverse(
  id: string,
  input: UniverseUpdateInput
): Promise<UniverseRecord> {
  const patch = serializeUniversePatch(input);

  try {
    const row = await updateUniverseRow(id, {
      code: patch.code,
      name: patch.name,
      styleConstitutionJson: patch.styleConstitution,
      globalPromptTemplate: patch.globalPromptTemplate,
      globalNegativeTemplate: patch.globalNegativeTemplate
    });

    if (!row) {
      throw createNotFoundError("Universe");
    }

    return toUniverseRecord(row);
  } catch (error) {
    if (error instanceof Error && error.name === "ServiceError") {
      throw error;
    }

    throw mapDatabaseError(error);
  }
}

export async function deleteUniverse(id: string): Promise<void> {
  const dependencyCount = await countCharactersForUniverse(id);

  if (dependencyCount > 0) {
    throw createDependencyError(
      "Universe still has associated characters and cannot be deleted."
    );
  }

  try {
    const deleted = await deleteUniverseRow(id);

    if (!deleted) {
      throw createNotFoundError("Universe");
    }
  } catch (error) {
    if (error instanceof Error && error.name === "ServiceError") {
      throw error;
    }

    throw mapDatabaseError(error);
  }
}

