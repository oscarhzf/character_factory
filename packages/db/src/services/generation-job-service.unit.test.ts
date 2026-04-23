import { beforeEach, describe, expect, it, vi } from "vitest";

const generationJobRepositoryMocks = vi.hoisted(() => ({
  findGenerationJobRowById: vi.fn(),
  insertGenerationJobWithPromptVersionRows: vi.fn(),
  listGenerationJobRows: vi.fn()
}));

const characterServiceMocks = vi.hoisted(() => ({
  getCharacter: vi.fn()
}));

const promptVersionServiceMocks = vi.hoisted(() => ({
  listPromptVersionsByJob: vi.fn()
}));

const generatedImageServiceMocks = vi.hoisted(() => ({
  listGeneratedImagesByJob: vi.fn()
}));

const universeServiceMocks = vi.hoisted(() => ({
  getUniverse: vi.fn()
}));

vi.mock("../repositories/generation-job-repository", () => generationJobRepositoryMocks);
vi.mock("./character-service", () => characterServiceMocks);
vi.mock("./prompt-version-service", () => promptVersionServiceMocks);
vi.mock("./generated-image-service", () => generatedImageServiceMocks);
vi.mock("./universe-service", () => universeServiceMocks);

import {
  createGenerationJob,
  getGenerationJob,
  listGenerationJobs
} from "./generation-job-service";

describe("generation job service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects malformed ids before reading a job", async () => {
    await expect(getGenerationJob("not-a-uuid")).rejects.toMatchObject({
      name: "ServiceError",
      code: "VALIDATION_ERROR",
      statusCode: 400
    });

    expect(generationJobRepositoryMocks.findGenerationJobRowById).not.toHaveBeenCalled();
  });

  it("rejects malformed character filters before listing jobs", async () => {
    await expect(
      listGenerationJobs({
        characterId: "not-a-uuid"
      })
    ).rejects.toMatchObject({
      name: "ServiceError",
      code: "VALIDATION_ERROR",
      statusCode: 400
    });

    expect(generationJobRepositoryMocks.listGenerationJobRows).not.toHaveBeenCalled();
  });

  it("blocks job creation when the character does not exist", async () => {
    characterServiceMocks.getCharacter.mockRejectedValue({
      name: "ServiceError",
      code: "NOT_FOUND",
      statusCode: 404
    });

    await expect(
      createGenerationJob({
        characterId: "9ac4a514-f0dd-466a-8f73-2e5b9e5f2f90",
        mode: "explore"
      })
    ).rejects.toMatchObject({
      name: "ServiceError",
      code: "NOT_FOUND",
      statusCode: 404
    });

    expect(
      generationJobRepositoryMocks.insertGenerationJobWithPromptVersionRows
    ).not.toHaveBeenCalled();
  });

  it("normalizes and atomically persists queued jobs with prompt variants", async () => {
    characterServiceMocks.getCharacter.mockResolvedValue({
      id: "9ac4a514-f0dd-466a-8f73-2e5b9e5f2f90",
      universeId: "33333333-3333-4333-8333-333333333333",
      code: "SZ-V1",
      name: "Shenzhen",
      status: "active",
      description: "sharp city achiever",
      fixedTraits: {
        rolePersona: "",
        identityKeywords: [],
        visualSilhouette: "",
        hairstyle: "",
        outfitRules: [],
        iconicProps: []
      },
      semiFixedTraits: {
        optionalProps: [],
        expressionRange: [],
        poseRange: [],
        outfitVariants: [],
        compositionHints: []
      },
      variableDefaults: {
        action: "",
        expression: "focused",
        prop: "",
        view: "",
        pose: "",
        composition: ""
      },
      palette: {
        primary: [],
        secondary: [],
        accent: []
      },
      negativeRules: {
        anatomy: [],
        style: [],
        props: [],
        composition: []
      },
      createdAt: "2026-04-20T00:00:00.000Z",
      updatedAt: "2026-04-20T00:00:00.000Z",
      universe: {
        id: "33333333-3333-4333-8333-333333333333",
        code: "GBA-URBAN",
        name: "GBA Urban"
      }
    });
    universeServiceMocks.getUniverse.mockResolvedValue({
      id: "33333333-3333-4333-8333-333333333333",
      code: "GBA-URBAN",
      name: "GBA Urban",
      styleConstitution: {
        proportionRules: [],
        styleKeywords: [],
        renderingRules: [],
        backgroundRules: [],
        sheetRules: []
      },
      globalPromptTemplate: "4-head anime sheet",
      globalNegativeTemplate: "photorealistic",
      createdAt: "2026-04-20T00:00:00.000Z",
      updatedAt: "2026-04-20T00:00:00.000Z"
    });
    generationJobRepositoryMocks.insertGenerationJobWithPromptVersionRows.mockImplementation(
      async (jobValues, createPromptVersionValues) => {
        const job = {
          id: "2e26eb2e-9154-4f13-a904-d53448974b0d",
          characterId: "9ac4a514-f0dd-466a-8f73-2e5b9e5f2f90",
          mode: "explore",
          status: "queued",
          sourceImageId: null,
          inputConfigJson: jobValues.inputConfigJson,
          batchSize: 6,
          createdBy: "artist-1",
          createdAt: new Date("2026-04-20T00:00:00.000Z"),
          updatedAt: new Date("2026-04-20T00:00:00.000Z")
        };
        const promptVersionValues = createPromptVersionValues(job);

        expect(promptVersionValues).toHaveLength(2);
        expect(promptVersionValues[0]).toMatchObject({
          characterId: "9ac4a514-f0dd-466a-8f73-2e5b9e5f2f90",
          jobId: "2e26eb2e-9154-4f13-a904-d53448974b0d",
          scope: "job",
          variantKey: "1-ratio_boost",
          strategy: "ratio_boost"
        });

        return job;
      }
    );

    const created = await createGenerationJob({
      characterId: "9ac4a514-f0dd-466a-8f73-2e5b9e5f2f90",
      mode: "explore",
      createdBy: "  artist-1  ",
      inputConfig: {
        taskPrompt: {
          action: " holding a smartphone "
        },
        variantStrategies: ["ratio_boost", "style_lock"],
        imagesPerVariant: 3,
        size: "1024x1536",
        quality: "high"
      }
    });

    expect(
      generationJobRepositoryMocks.insertGenerationJobWithPromptVersionRows
    ).toHaveBeenCalledWith(
      {
        characterId: "9ac4a514-f0dd-466a-8f73-2e5b9e5f2f90",
        mode: "explore",
        status: "queued",
        sourceImageId: null,
        inputConfigJson: {
          taskPrompt: {
            action: "holding a smartphone",
            expression: "",
            prop: "",
            view: "",
            pose: "",
            composition: ""
          },
          variantStrategies: ["ratio_boost", "style_lock"],
          imagesPerVariant: 3,
          size: "1024x1536",
          quality: "high"
        },
        batchSize: 6,
        createdBy: "artist-1"
      },
      expect.any(Function)
    );

    expect(created).toMatchObject({
      id: "2e26eb2e-9154-4f13-a904-d53448974b0d",
      mode: "explore",
      status: "queued",
      batchSize: 6,
      createdBy: "artist-1"
    });
  });
});
