import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  countCharactersForUniverse: vi.fn(),
  deleteUniverseRow: vi.fn(),
  findUniverseRowById: vi.fn(),
  insertUniverseRow: vi.fn(),
  listUniverseRows: vi.fn(),
  updateUniverseRow: vi.fn()
}));

vi.mock("../repositories/universe-repository", () => repositoryMocks);

import { deleteUniverse } from "./universe-service";

describe("deleteUniverse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects deletion when the universe still has characters", async () => {
    repositoryMocks.countCharactersForUniverse.mockResolvedValue(1);

    await expect(deleteUniverse("universe-id")).rejects.toMatchObject({
      name: "ServiceError",
      code: "DEPENDENCY_CONFLICT",
      statusCode: 409
    });

    expect(repositoryMocks.deleteUniverseRow).not.toHaveBeenCalled();
  });
});
