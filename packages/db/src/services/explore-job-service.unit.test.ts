import { beforeEach, describe, expect, it, vi } from "vitest";

const generatedImageRepositoryMocks = vi.hoisted(() => ({
  insertGeneratedImageRows: vi.fn()
}));

const generationJobRepositoryMocks = vi.hoisted(() => ({
  updateGenerationJobStatus: vi.fn()
}));

const generationJobServiceMocks = vi.hoisted(() => ({
  getGenerationJob: vi.fn()
}));

vi.mock("../repositories/generated-image-repository", () => generatedImageRepositoryMocks);
vi.mock("../repositories/generation-job-repository", () => generationJobRepositoryMocks);
vi.mock("./generation-job-service", () => generationJobServiceMocks);

import { generateExploreCandidates } from "./explore-job-service";

function decodeSvgDataUri(value: string): string {
  return decodeURIComponent(value.replace("data:image/svg+xml;charset=UTF-8,", ""));
}

describe("explore job service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the selected render size when creating placeholder images", async () => {
    const jobId = "2e26eb2e-9154-4f13-a904-d53448974b0d";

    generationJobServiceMocks.getGenerationJob
      .mockResolvedValueOnce({
        id: jobId,
        characterId: "9ac4a514-f0dd-466a-8f73-2e5b9e5f2f90",
        mode: "explore",
        status: "queued",
        sourceImageId: null,
        inputConfig: {
          taskPrompt: {
            action: "",
            expression: "",
            prop: "",
            view: "",
            pose: "",
            composition: ""
          },
          variantStrategies: ["pose_clarity"],
          imagesPerVariant: 1,
          size: "1536x1024",
          quality: "high"
        },
        batchSize: 1,
        createdBy: "codex",
        createdAt: "2026-04-22T00:00:00.000Z",
        updatedAt: "2026-04-22T00:00:00.000Z",
        character: {
          id: "9ac4a514-f0dd-466a-8f73-2e5b9e5f2f90",
          code: "SZ-V1",
          name: "Shenzhen",
          status: "active",
          universe: {
            id: "33333333-3333-4333-8333-333333333333",
            code: "GBA-URBAN",
            name: "GBA Urban"
          }
        },
        generatedImages: [],
        promptVariants: [
          {
            id: "44444444-4444-4444-8444-444444444444",
            characterId: "9ac4a514-f0dd-466a-8f73-2e5b9e5f2f90",
            jobId,
            parentPromptVersionId: null,
            scope: "job",
            variantKey: "1-pose_clarity",
            strategy: "pose_clarity",
            compiledPrompt: "[PROMPT]",
            compiledNegativePrompt: "",
            patch: null,
            debugPayload: {
              variantKey: "1-pose_clarity",
              strategy: "pose_clarity",
              templateConfig: {
                globalPromptTemplate: "",
                globalNegativeTemplate: ""
              },
              resolvedTaskPrompt: {
                action: "",
                expression: "",
                prop: "",
                view: "",
                pose: "",
                composition: ""
              },
              normalizedPatch: {
                preserve: [],
                strengthen: [],
                suppress: [],
                append: [],
                remove: []
              },
              sections: {
                universe: [],
                character: [],
                task: [],
                variant: [],
                patch: [],
                output: [],
                negative: []
              }
            },
            createdAt: "2026-04-22T00:00:00.000Z"
          }
        ]
      })
      .mockResolvedValueOnce({
        id: jobId,
        generatedImages: []
      });

    await generateExploreCandidates(jobId);

    const rows = generatedImageRepositoryMocks.insertGeneratedImageRows.mock.calls[0]?.[0];

    expect(rows).toHaveLength(1);
    expect(decodeSvgDataUri(rows[0].imageUrl)).toContain(
      'width="1536" height="1024"'
    );
    expect(decodeSvgDataUri(rows[0].thumbUrl)).toContain(
      'width="768" height="512"'
    );
    expect(rows[0].generationMetaJson).toMatchObject({
      size: "1536x1024"
    });
  });
});
