import { describe, expect, it, vi } from "vitest";

import { loadJobCreateBootstrapData } from "./job-create-bootstrap";

describe("job create bootstrap data", () => {
  it("keeps the form usable when recent jobs fail to load", async () => {
    const characters = [
      {
        id: "9ac4a514-f0dd-466a-8f73-2e5b9e5f2f90",
        code: "SZ-V1",
        name: "Shenzhen"
      }
    ];

    const result = await loadJobCreateBootstrapData(
      vi.fn().mockResolvedValue(characters),
      vi.fn().mockRejectedValue(new Error("jobs endpoint unavailable"))
    );

    expect(result).toEqual({
      characters,
      recentJobs: [],
      warningMessage:
        "Recent jobs are temporarily unavailable: jobs endpoint unavailable"
    });
  });
});
