import { beforeEach, describe, expect, it, vi } from "vitest";

const generationJobRepositoryMocks = vi.hoisted(() => ({
  findGenerationJobRowById: vi.fn(),
  insertGenerationJobRow: vi.fn(),
  listGenerationJobRows: vi.fn()
}));

const characterRepositoryMocks = vi.hoisted(() => ({
  findCharacterRowById: vi.fn()
}));

vi.mock("../repositories/generation-job-repository", () => generationJobRepositoryMocks);
vi.mock("../repositories/character-repository", () => characterRepositoryMocks);

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
    characterRepositoryMocks.findCharacterRowById.mockResolvedValue(undefined);

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

    expect(generationJobRepositoryMocks.insertGenerationJobRow).not.toHaveBeenCalled();
  });

  it("normalizes and persists queued jobs", async () => {
    characterRepositoryMocks.findCharacterRowById.mockResolvedValue({
      id: "9ac4a514-f0dd-466a-8f73-2e5b9e5f2f90"
    });
    generationJobRepositoryMocks.insertGenerationJobRow.mockResolvedValue({
      id: "2e26eb2e-9154-4f13-a904-d53448974b0d",
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
      createdBy: "artist-1",
      createdAt: new Date("2026-04-20T00:00:00.000Z"),
      updatedAt: new Date("2026-04-20T00:00:00.000Z")
    });

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

    expect(generationJobRepositoryMocks.insertGenerationJobRow).toHaveBeenCalledWith({
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
    });

    expect(created).toMatchObject({
      id: "2e26eb2e-9154-4f13-a904-d53448974b0d",
      mode: "explore",
      status: "queued",
      batchSize: 6,
      createdBy: "artist-1"
    });
  });
});
