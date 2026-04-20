import { desc, eq } from "drizzle-orm";

import { getDb } from "../client";
import { promptVersions } from "../schema";

export type PromptVersionRow = typeof promptVersions.$inferSelect;

export async function insertPromptVersionRows(
  values: Array<typeof promptVersions.$inferInsert>
): Promise<PromptVersionRow[]> {
  return getDb().insert(promptVersions).values(values).returning();
}

export async function findPromptVersionRowById(
  id: string
): Promise<PromptVersionRow | undefined> {
  const [row] = await getDb()
    .select()
    .from(promptVersions)
    .where(eq(promptVersions.id, id))
    .limit(1);

  return row;
}

export async function listPromptVersionRowsByCharacter(
  characterId: string,
  limit: number
): Promise<PromptVersionRow[]> {
  return getDb()
    .select()
    .from(promptVersions)
    .where(eq(promptVersions.characterId, characterId))
    .orderBy(desc(promptVersions.createdAt))
    .limit(limit);
}
