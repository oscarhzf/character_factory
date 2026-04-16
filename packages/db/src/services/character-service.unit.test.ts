import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  deleteCharacterRow: vi.fn(),
  findCharacterRowById: vi.fn(),
  insertCharacterRow: vi.fn(),
  listCharacterRows: vi.fn(),
  updateCharacterRow: vi.fn()
}));

const universeRepositoryMocks = vi.hoisted(() => ({
  findUniverseRowById: vi.fn()
}));

vi.mock("../repositories/character-repository", () => repositoryMocks);
vi.mock("../repositories/universe-repository", () => universeRepositoryMocks);

import { deleteCharacter, getCharacter, updateCharacter } from "./character-service";

describe("character service id validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects malformed ids before reading a character", async () => {
    await expect(getCharacter("not-a-uuid")).rejects.toMatchObject({
      name: "ServiceError",
      code: "VALIDATION_ERROR",
      statusCode: 400
    });

    expect(repositoryMocks.findCharacterRowById).not.toHaveBeenCalled();
  });

  it("rejects malformed ids before updating a character", async () => {
    await expect(
      updateCharacter("not-a-uuid", { name: "Updated Name" })
    ).rejects.toMatchObject({
      name: "ServiceError",
      code: "VALIDATION_ERROR",
      statusCode: 400
    });

    expect(repositoryMocks.updateCharacterRow).not.toHaveBeenCalled();
    expect(universeRepositoryMocks.findUniverseRowById).not.toHaveBeenCalled();
  });

  it("rejects malformed ids before deleting a character", async () => {
    await expect(deleteCharacter("not-a-uuid")).rejects.toMatchObject({
      name: "ServiceError",
      code: "VALIDATION_ERROR",
      statusCode: 400
    });

    expect(repositoryMocks.deleteCharacterRow).not.toHaveBeenCalled();
  });
});
