import { count, desc, eq } from "drizzle-orm";

import { getDb } from "../client";
import { characters, universes } from "../schema";

export type UniverseRow = typeof universes.$inferSelect;

export async function listUniverseRows(): Promise<UniverseRow[]> {
  return getDb().select().from(universes).orderBy(desc(universes.updatedAt));
}

export async function findUniverseRowById(
  id: string
): Promise<UniverseRow | undefined> {
  const [row] = await getDb()
    .select()
    .from(universes)
    .where(eq(universes.id, id))
    .limit(1);

  return row;
}

export async function findUniverseRowByCode(
  code: string
): Promise<UniverseRow | undefined> {
  const [row] = await getDb()
    .select()
    .from(universes)
    .where(eq(universes.code, code))
    .limit(1);

  return row;
}

export async function insertUniverseRow(
  values: typeof universes.$inferInsert
): Promise<UniverseRow> {
  const [row] = await getDb().insert(universes).values(values).returning();
  return row;
}

export async function updateUniverseRow(
  id: string,
  values: Partial<typeof universes.$inferInsert>
): Promise<UniverseRow | undefined> {
  const [row] = await getDb()
    .update(universes)
    .set(values)
    .where(eq(universes.id, id))
    .returning();

  return row;
}

export async function deleteUniverseRow(id: string): Promise<boolean> {
  const deletedRows = await getDb()
    .delete(universes)
    .where(eq(universes.id, id))
    .returning({ id: universes.id });

  return deletedRows.length > 0;
}

export async function countCharactersForUniverse(id: string): Promise<number> {
  const [result] = await getDb()
    .select({ value: count() })
    .from(characters)
    .where(eq(characters.universeId, id));

  return Number(result?.value ?? 0);
}

