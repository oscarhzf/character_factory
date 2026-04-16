import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  findPromptVersionRowById: vi.fn(),
  insertPromptVersionRows: vi.fn(),
  listPromptVersionRowsByCharacter: vi.fn()
}));

vi.mock("../repositories/prompt-version-repository", () => repositoryMocks);

import { getPromptVersion } from "./prompt-version-service";

describe("prompt version service id validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects malformed ids before reading a prompt version", async () => {
    await expect(getPromptVersion("not-a-uuid")).rejects.toMatchObject({
      name: "ServiceError",
      code: "VALIDATION_ERROR",
      statusCode: 400
    });

    expect(repositoryMocks.findPromptVersionRowById).not.toHaveBeenCalled();
  });
});
