import { and, desc, eq, ilike } from "drizzle-orm";

import { getDb } from "../client";
import { characters, universes } from "../schema";

export type CharacterRow = typeof characters.$inferSelect;

export interface CharacterRowWithUniverse {
  character: CharacterRow;
  universe: Pick<typeof universes.$inferSelect, "id" | "code" | "name">;
}

export async function listCharacterRows(filters?: {
  status?: typeof characters.$inferSelect.status;
  query?: string;
}): Promise<CharacterRowWithUniverse[]> {
  const predicates = [];

  if (filters?.status) {
    predicates.push(eq(characters.status, filters.status));
  }

  if (filters?.query) {
    const keyword = `%${filters.query}%`;
    predicates.push(
      ilike(
        characters.name,
        keyword
      )
    );
  }

  const query = getDb()
    .select({
      character: characters,
      universe: {
        id: universes.id,
        code: universes.code,
        name: universes.name
      }
    })
    .from(characters)
    .innerJoin(universes, eq(characters.universeId, universes.id))
    .orderBy(desc(characters.updatedAt));

  if (predicates.length === 0) {
    return query;
  }

  return query.where(and(...predicates));
}

export async function findCharacterRowById(
  id: string
): Promise<CharacterRowWithUniverse | undefined> {
  const [row] = await getDb()
    .select({
      character: characters,
      universe: {
        id: universes.id,
        code: universes.code,
        name: universes.name
      }
    })
    .from(characters)
    .innerJoin(universes, eq(characters.universeId, universes.id))
    .where(eq(characters.id, id))
    .limit(1);

  return row;
}

export async function findCharacterRowByCode(
  code: string
): Promise<CharacterRow | undefined> {
  const [row] = await getDb()
    .select()
    .from(characters)
    .where(eq(characters.code, code))
    .limit(1);

  return row;
}

export async function insertCharacterRow(
  values: typeof characters.$inferInsert
): Promise<CharacterRow> {
  const [row] = await getDb().insert(characters).values(values).returning();
  return row;
}

export async function updateCharacterRow(
  id: string,
  values: Partial<typeof characters.$inferInsert>
): Promise<CharacterRow | undefined> {
  const [row] = await getDb()
    .update(characters)
    .set(values)
    .where(eq(characters.id, id))
    .returning();

  return row;
}

export async function deleteCharacterRow(id: string): Promise<boolean> {
  const deletedRows = await getDb()
    .delete(characters)
    .where(eq(characters.id, id))
    .returning({ id: characters.id });

  return deletedRows.length > 0;
}
