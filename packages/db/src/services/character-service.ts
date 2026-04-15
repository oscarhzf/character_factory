import {
  serializeCharacterInput,
  serializeFixedTraits,
  serializeNegativeRules,
  serializePalette,
  serializeSemiFixedTraits,
  serializeVariableDefaults,
  type CharacterCreateInput,
  type CharacterListItem,
  type CharacterRecord,
  type CharacterUpdateInput
} from "@character-factory/core";

import {
  deleteCharacterRow,
  findCharacterRowById,
  insertCharacterRow,
  listCharacterRows,
  updateCharacterRow
} from "../repositories/character-repository";
import { findUniverseRowById } from "../repositories/universe-repository";
import { createNotFoundError, mapDatabaseError } from "../service-error";

function toCharacterRecord(
  row: Awaited<ReturnType<typeof findCharacterRowById>> extends infer TResult
    ? TResult extends { character: infer TCharacter }
      ? TCharacter
      : never
    : never
): CharacterRecord {
  return {
    id: row.id,
    universeId: row.universeId,
    code: row.code,
    name: row.name,
    status: row.status,
    description: row.description ?? "",
    fixedTraits: serializeFixedTraits(row.fixedTraitsJson),
    semiFixedTraits: serializeSemiFixedTraits(row.semiFixedTraitsJson),
    variableDefaults: serializeVariableDefaults(row.variableDefaultsJson),
    palette: serializePalette(row.paletteJson),
    negativeRules: serializeNegativeRules(row.negativeRulesJson),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function toCharacterListItem(
  row: Awaited<ReturnType<typeof findCharacterRowById>> extends infer TResult
    ? Exclude<TResult, undefined>
    : never
): CharacterListItem {
  return {
    ...toCharacterRecord(row.character),
    universe: {
      id: row.universe.id,
      code: row.universe.code,
      name: row.universe.name
    }
  };
}

async function ensureUniverseExists(universeId: string): Promise<void> {
  const row = await findUniverseRowById(universeId);

  if (!row) {
    throw createNotFoundError("Universe");
  }
}

export async function listCharacters(filters?: {
  status?: CharacterListItem["status"];
  query?: string;
}): Promise<CharacterListItem[]> {
  const rows = await listCharacterRows(filters);
  return rows.map((row) => toCharacterListItem(row));
}

export async function getCharacter(id: string): Promise<CharacterListItem> {
  const row = await findCharacterRowById(id);

  if (!row) {
    throw createNotFoundError("Character");
  }

  return toCharacterListItem(row);
}

export async function createCharacter(
  input: CharacterCreateInput
): Promise<CharacterRecord> {
  const values = serializeCharacterInput(input);
  await ensureUniverseExists(values.universeId);

  try {
    const row = await insertCharacterRow({
      universeId: values.universeId,
      code: values.code,
      name: values.name,
      status: values.status,
      description: values.description,
      fixedTraitsJson: values.fixedTraits,
      semiFixedTraitsJson: values.semiFixedTraits,
      variableDefaultsJson: values.variableDefaults,
      paletteJson: values.palette,
      negativeRulesJson: values.negativeRules
    });

    return toCharacterRecord(row);
  } catch (error) {
    throw mapDatabaseError(error);
  }
}

export async function updateCharacter(
  id: string,
  input: CharacterUpdateInput
): Promise<CharacterRecord> {
  if (input.universeId) {
    await ensureUniverseExists(input.universeId);
  }

  try {
    const row = await updateCharacterRow(id, {
      universeId: input.universeId,
      code: input.code?.trim(),
      name: input.name?.trim(),
      status: input.status,
      description:
        input.description !== undefined ? input.description.trim() : undefined,
      fixedTraitsJson:
        input.fixedTraits !== undefined
          ? serializeFixedTraits(input.fixedTraits)
          : undefined,
      semiFixedTraitsJson:
        input.semiFixedTraits !== undefined
          ? serializeSemiFixedTraits(input.semiFixedTraits)
          : undefined,
      variableDefaultsJson:
        input.variableDefaults !== undefined
          ? serializeVariableDefaults(input.variableDefaults)
          : undefined,
      paletteJson:
        input.palette !== undefined ? serializePalette(input.palette) : undefined,
      negativeRulesJson:
        input.negativeRules !== undefined
          ? serializeNegativeRules(input.negativeRules)
          : undefined
    });

    if (!row) {
      throw createNotFoundError("Character");
    }

    return toCharacterRecord(row);
  } catch (error) {
    if (error instanceof Error && error.name === "ServiceError") {
      throw error;
    }

    throw mapDatabaseError(error);
  }
}

export async function deleteCharacter(id: string): Promise<void> {
  try {
    const deleted = await deleteCharacterRow(id);

    if (!deleted) {
      throw createNotFoundError("Character");
    }
  } catch (error) {
    if (error instanceof Error && error.name === "ServiceError") {
      throw error;
    }

    throw mapDatabaseError(error);
  }
}
