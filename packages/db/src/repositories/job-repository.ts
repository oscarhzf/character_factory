import { eq } from "drizzle-orm";

import { getDb } from "../client";
import { characters, generationJobs, universes } from "../schema";

export type GenerationJobRow = typeof generationJobs.$inferSelect;

export interface GenerationJobDetailRow {
  job: GenerationJobRow;
  character: Pick<
    typeof characters.$inferSelect,
    "id" | "code" | "name" | "status"
  >;
  universe: Pick<typeof universes.$inferSelect, "id" | "code" | "name">;
}

export async function insertGenerationJobRow(
  values: typeof generationJobs.$inferInsert
): Promise<GenerationJobRow> {
  const [row] = await getDb().insert(generationJobs).values(values).returning();
  return row;
}

export async function deleteGenerationJobRow(id: string): Promise<boolean> {
  const deletedRows = await getDb()
    .delete(generationJobs)
    .where(eq(generationJobs.id, id))
    .returning({ id: generationJobs.id });

  return deletedRows.length > 0;
}

export async function findGenerationJobDetailRowById(
  id: string
): Promise<GenerationJobDetailRow | undefined> {
  const [row] = await getDb()
    .select({
      job: generationJobs,
      character: {
        id: characters.id,
        code: characters.code,
        name: characters.name,
        status: characters.status
      },
      universe: {
        id: universes.id,
        code: universes.code,
        name: universes.name
      }
    })
    .from(generationJobs)
    .innerJoin(characters, eq(generationJobs.characterId, characters.id))
    .innerJoin(universes, eq(characters.universeId, universes.id))
    .where(eq(generationJobs.id, id))
    .limit(1);

  return row;
}

export async function updateGenerationJobStatus(
  id: string,
  status: typeof generationJobs.$inferInsert.status
): Promise<GenerationJobRow | undefined> {
  const [row] = await getDb()
    .update(generationJobs)
    .set({
      status
    })
    .where(eq(generationJobs.id, id))
    .returning();

  return row;
}
