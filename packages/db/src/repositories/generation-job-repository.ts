import { and, desc, eq } from "drizzle-orm";

import { getDb } from "../client";
import { characters, generationJobs, promptVersions, universes } from "../schema";

export type GenerationJobRow = typeof generationJobs.$inferSelect;

export interface GenerationJobRowWithCharacter {
  job: GenerationJobRow;
  character: Pick<typeof characters.$inferSelect, "id" | "code" | "name" | "status">;
  universe: Pick<typeof universes.$inferSelect, "id" | "code" | "name">;
}

export async function listGenerationJobRows(filters?: {
  characterId?: string;
  mode?: typeof generationJobs.$inferSelect.mode;
  status?: typeof generationJobs.$inferSelect.status;
  limit?: number;
}): Promise<GenerationJobRowWithCharacter[]> {
  const predicates = [];

  if (filters?.characterId) {
    predicates.push(eq(generationJobs.characterId, filters.characterId));
  }

  if (filters?.mode) {
    predicates.push(eq(generationJobs.mode, filters.mode));
  }

  if (filters?.status) {
    predicates.push(eq(generationJobs.status, filters.status));
  }

  const query = getDb()
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
    .orderBy(desc(generationJobs.createdAt))
    .limit(filters?.limit ?? 12);

  if (predicates.length === 0) {
    return query;
  }

  return query.where(and(...predicates));
}

export async function findGenerationJobRowById(
  id: string
): Promise<GenerationJobRowWithCharacter | undefined> {
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

export async function insertGenerationJobRow(
  values: typeof generationJobs.$inferInsert
): Promise<GenerationJobRow> {
  const [row] = await getDb().insert(generationJobs).values(values).returning();
  return row;
}

export async function insertGenerationJobWithPromptVersionRows(
  jobValues: typeof generationJobs.$inferInsert,
  createPromptVersionValues: (
    job: GenerationJobRow
  ) => Array<typeof promptVersions.$inferInsert>
): Promise<GenerationJobRow> {
  return getDb().transaction(async (tx) => {
    const [job] = await tx.insert(generationJobs).values(jobValues).returning();
    const promptVersionValues = createPromptVersionValues(job);

    await tx.insert(promptVersions).values(promptVersionValues).returning();

    return job;
  });
}

export async function updateGenerationJobStatus(
  id: string,
  status: typeof generationJobs.$inferSelect.status
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
