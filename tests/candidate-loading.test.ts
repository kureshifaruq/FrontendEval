
import { describe, expect, it } from "vitest";
import { BuggyLoadingController } from "../results/FE-003-candidate.js";

describe("AI-generated fix: FE-003", () => {
  it("resets loading after a successful request", async () => {
    const controller = new BuggyLoadingController();

    const result = await controller.load(async () => ["data"]);

    expect(result).toEqual(["data"]);
    expect(controller.loading).toBe(false);
  });

  it("resets loading when a request fails", async () => {
    const controller = new BuggyLoadingController();

    await expect(
      controller.load(async () => {
        throw new Error("Network failure");
      })
    ).rejects.toThrow("Network failure");

    expect(controller.loading).toBe(false);
    expect(controller.error).toBe("Network failure");
  });
});
