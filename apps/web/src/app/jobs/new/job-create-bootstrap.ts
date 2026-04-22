import type {
  CharacterListItem,
  GenerationJobListItem
} from "@character-factory/core";

export async function loadJobCreateBootstrapData(
  loadCharacters: () => Promise<CharacterListItem[]>,
  loadRecentJobs: () => Promise<GenerationJobListItem[]>
): Promise<{
  characters: CharacterListItem[];
  recentJobs: GenerationJobListItem[];
  warningMessage: string | null;
}> {
  const characters = await loadCharacters();

  try {
    const recentJobs = await loadRecentJobs();

    return {
      characters,
      recentJobs,
      warningMessage: null
    };
  } catch (error) {
    return {
      characters,
      recentJobs: [],
      warningMessage:
        error instanceof Error
          ? `Recent jobs are temporarily unavailable: ${error.message}`
          : "Recent jobs are temporarily unavailable."
    };
  }
}
