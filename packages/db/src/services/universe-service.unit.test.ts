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

import { deleteUniverse, getUniverse, updateUniverse } from "./universe-service";

describe("deleteUniverse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects deletion when the universe still has characters", async () => {
    repositoryMocks.countCharactersForUniverse.mockResolvedValue(1);

    await expect(
      deleteUniverse("11111111-1111-1111-1111-111111111111")
    ).rejects.toMatchObject({
      name: "ServiceError",
      code: "DEPENDENCY_CONFLICT",
      statusCode: 409
    });

    expect(repositoryMocks.deleteUniverseRow).not.toHaveBeenCalled();
  });

  it("rejects malformed ids before reading a universe", async () => {
    await expect(getUniverse("not-a-uuid")).rejects.toMatchObject({
      name: "ServiceError",
      code: "VALIDATION_ERROR",
      statusCode: 400
    });

    expect(repositoryMocks.findUniverseRowById).not.toHaveBeenCalled();
  });

  it("rejects malformed ids before updating a universe", async () => {
    await expect(
      updateUniverse("not-a-uuid", { name: "Updated Universe" })
    ).rejects.toMatchObject({
      name: "ServiceError",
      code: "VALIDATION_ERROR",
      statusCode: 400
    });

    expect(repositoryMocks.updateUniverseRow).not.toHaveBeenCalled();
  });

  it("rejects malformed ids before deleting a universe", async () => {
    await expect(deleteUniverse("not-a-uuid")).rejects.toMatchObject({
      name: "ServiceError",
      code: "VALIDATION_ERROR",
      statusCode: 400
    });

    expect(repositoryMocks.countCharactersForUniverse).not.toHaveBeenCalled();
    expect(repositoryMocks.deleteUniverseRow).not.toHaveBeenCalled();
  });
});
