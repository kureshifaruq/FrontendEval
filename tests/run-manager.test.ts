import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createRun,
  createRunId,
  getLatestRunId,
  readRun,
  updateRun,
  validateRunId,
} from "../src/run-manager.js";

let temporaryDirectory: string;

async function setup() {
  temporaryDirectory = await mkdtemp(
    path.join(os.tmpdir(), "frontend-eval-"),
  );

  return temporaryDirectory;
}

afterEach(async () => {
  if (temporaryDirectory) {
    await rm(temporaryDirectory, {
      recursive: true,
      force: true,
    });
  }
});

describe("run manager", () => {
  it("generates unique run IDs", () => {
    const first = createRunId();
    const second = createRunId();

    expect(first).not.toBe(second);
    expect(() => validateRunId(first)).not.toThrow();
  });

  it("rejects unsafe run IDs", () => {
    expect(() => validateRunId("../outside")).toThrow();
    expect(() => validateRunId("run/../../outside")).toThrow();
    expect(() => validateRunId("")).toThrow();
  });

  it("creates a run with initial metadata", async () => {
    const root = await setup();

    const run = await createRun({
      resultsRoot: root,
      runId: "test-run-001",
      provider: "google",
      model: "gemini-test",
      taskIds: ["FE-001", "FE-002"],
    });

    expect(run.status).toBe("running");
    expect(run.completedAt).toBeNull();
    expect(run.requestedTaskIds).toEqual(["FE-001", "FE-002"]);

    const saved = await readRun("test-run-001", root);

    expect(saved).toEqual(run);
  });

  it("does not overwrite an existing run", async () => {
    const root = await setup();

    await createRun({
      resultsRoot: root,
      runId: "duplicate-run",
      provider: "google",
      model: "gemini-test",
      taskIds: ["FE-001"],
    });

    await expect(
      createRun({
        resultsRoot: root,
        runId: "duplicate-run",
        provider: "google",
        model: "another-model",
        taskIds: ["FE-002"],
      }),
    ).rejects.toThrow();
  });

  it("updates run status and task outcomes", async () => {
    const root = await setup();

    await createRun({
      resultsRoot: root,
      runId: "update-run",
      provider: "google",
      model: "gemini-test",
      taskIds: ["FE-001", "FE-002"],
    });

    const updated = await updateRun(
      "update-run",
      {
        status: "completed-with-errors",
        completedAt: new Date().toISOString(),
        completedTaskIds: ["FE-001"],
        failedTaskIds: ["FE-002"],
      },
      root,
    );

    expect(updated.status).toBe("completed-with-errors");
    expect(updated.completedTaskIds).toEqual(["FE-001"]);
    expect(updated.failedTaskIds).toEqual(["FE-002"]);
  });

  it("finds the latest valid run", async () => {
    const root = await setup();
  
    await createRun({
      resultsRoot: root,
      runId: "run-old",
      provider: "google",
      model: "gemini-test",
      taskIds: ["FE-001"],
    });
  
    await new Promise((resolve) => setTimeout(resolve, 20));
  
    await createRun({
      resultsRoot: root,
      runId: "run-new",
      provider: "google",
      model: "gemini-test",
      taskIds: ["FE-002"],
    });
  
    const latest = await getLatestRunId(root);
  
    expect(latest).toBe("run-new");
  });

  it("stores metadata as valid JSON", async () => {
    const root = await setup();

    await createRun({
      resultsRoot: root,
      runId: "json-run",
      provider: "google",
      model: "gemini-test",
      taskIds: ["FE-001"],
    });

    const content = await readFile(
      path.join(root, "runs", "json-run", "run.json"),
      "utf8",
    );

    expect(JSON.parse(content).runId).toBe("json-run");
  });
});
