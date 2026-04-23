import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  createGenerationJob: vi.fn(),
  getGenerationJob: vi.fn(),
  generateExploreCandidates: vi.fn()
}));

vi.mock("@character-factory/db", () => dbMocks);

import { POST } from "./route";

describe("POST /api/jobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a job and returns prompt variants in the response", async () => {
    const characterId = "11111111-1111-4111-8111-111111111111";
    const jobId = "22222222-2222-4222-8222-222222222222";

    dbMocks.createGenerationJob.mockResolvedValue({
      id: jobId,
      characterId,
      mode: "explore",
      status: "queued",
      sourceImageId: null,
      inputConfig: {
        taskPrompt: {
          action: "holding a smartphone",
          expression: "focused",
          prop: "smartphone",
          view: "front full body",
          pose: "slight forward lean",
          composition: "character sheet centered"
        },
        variantStrategies: ["ratio_boost", "style_lock"],
        imagesPerVariant: 4,
        size: "1024x1536",
        quality: "high"
      },
      batchSize: 8,
      createdBy: "codex",
      createdAt: "2026-04-22T00:00:00.000Z",
      updatedAt: "2026-04-22T00:00:00.000Z",
      character: {
        id: characterId,
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
          characterId,
          jobId,
          parentPromptVersionId: null,
          scope: "job",
          variantKey: "1-ratio_boost",
          strategy: "ratio_boost",
          compiledPrompt: "[UNIVERSE]",
          compiledNegativePrompt: "photorealistic",
          patch: null,
          debugPayload: {
            variantKey: "1-ratio_boost",
            strategy: "ratio_boost",
            templateConfig: {
              globalPromptTemplate: "4-head anime character sheet",
              globalNegativeTemplate: "photorealistic"
            },
            resolvedTaskPrompt: {
              action: "holding a smartphone",
              expression: "focused",
              prop: "smartphone",
              view: "front full body",
              pose: "slight forward lean",
              composition: "character sheet centered"
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
    });
    dbMocks.generateExploreCandidates.mockResolvedValue({
      id: jobId,
      characterId,
      mode: "explore",
      status: "completed",
      sourceImageId: null,
      inputConfig: {
        taskPrompt: {
          action: "holding a smartphone",
          expression: "focused",
          prop: "smartphone",
          view: "front full body",
          pose: "slight forward lean",
          composition: "character sheet centered"
        },
        variantStrategies: ["ratio_boost", "style_lock"],
        imagesPerVariant: 4,
        size: "1024x1536",
        quality: "high"
      },
      batchSize: 8,
      createdBy: "codex",
      createdAt: "2026-04-22T00:00:00.000Z",
      updatedAt: "2026-04-22T00:00:00.000Z",
      character: {
        id: characterId,
        code: "SZ-V1",
        name: "Shenzhen",
        status: "active",
        universe: {
          id: "33333333-3333-4333-8333-333333333333",
          code: "GBA-URBAN",
          name: "GBA Urban"
        }
      },
      generatedImages: [
        {
          id: "55555555-5555-4555-8555-555555555555",
          jobId,
          promptVersionId: "44444444-4444-4444-8444-444444444444",
          sourceApi: "placeholder",
          modelName: "explore-placeholder-v1",
          imageUrl: "data:image/svg+xml;base64,abc",
          thumbUrl: "data:image/svg+xml;base64,def",
          revisedPrompt: "[UNIVERSE]",
          generationMeta: {
            placeholder: true
          },
          status: "created",
          createdAt: "2026-04-22T00:00:00.000Z",
          promptVariant: {
            id: "44444444-4444-4444-8444-444444444444",
            variantKey: "1-ratio_boost",
            strategy: "ratio_boost"
          }
        }
      ],
      promptVariants: [
        {
          id: "44444444-4444-4444-8444-444444444444",
          characterId,
          jobId,
          parentPromptVersionId: null,
          scope: "job",
          variantKey: "1-ratio_boost",
          strategy: "ratio_boost",
          compiledPrompt: "[UNIVERSE]",
          compiledNegativePrompt: "photorealistic",
          patch: null,
          debugPayload: {
            variantKey: "1-ratio_boost",
            strategy: "ratio_boost",
            templateConfig: {
              globalPromptTemplate: "4-head anime character sheet",
              globalNegativeTemplate: "photorealistic"
            },
            resolvedTaskPrompt: {
              action: "holding a smartphone",
              expression: "focused",
              prop: "smartphone",
              view: "front full body",
              pose: "slight forward lean",
              composition: "character sheet centered"
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
    });

    const request = new Request("http://localhost/api/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        characterId,
        mode: "explore",
        inputConfig: {
          taskPrompt: {
            action: "holding a smartphone"
          },
          variantStrategies: ["ratio_boost", "style_lock"],
          imagesPerVariant: 4,
          size: "1024x1536",
          quality: "high"
        }
      })
    });

    const response = await POST(request as NextRequest);
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(dbMocks.createGenerationJob).toHaveBeenCalledWith({
      characterId,
      mode: "explore",
      inputConfig: {
        taskPrompt: {
          action: "holding a smartphone"
        },
        variantStrategies: ["ratio_boost", "style_lock"],
        imagesPerVariant: 4,
        size: "1024x1536",
        quality: "high"
      }
    });
    expect(dbMocks.generateExploreCandidates).toHaveBeenCalledWith(jobId);
    expect(payload.data.id).toBe(jobId);
    expect(payload.data.promptVariants).toHaveLength(1);
    expect(payload.data.generatedImages).toHaveLength(1);
    expect(payload.data.status).toBe("completed");
  });
});
