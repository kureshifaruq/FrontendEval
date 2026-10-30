import { describe, expect, it } from "vitest";
import { loadTasks } from "../src/dataset.js";

describe("Benchmark dataset", () => {
  it("loads all five benchmark tasks", async () => {
    const tasks = await loadTasks();

    expect(tasks).toHaveLength(5);
    expect(tasks.map((task) => task.id)).toEqual([
      "FE-001",
      "FE-002",
      "FE-003",
      "FE-004",
      "FE-005",
    ]);
  });

  it("loads evidence groups for tasks with expected defects", async () => {
    const tasks = await loadTasks();

    const tasksWithDefects = tasks.filter(
      (task) => task.expectedDefects.length > 0,
    );

    expect(tasksWithDefects).toHaveLength(4);

    for (const task of tasksWithDefects) {
      for (const defect of task.expectedDefects) {
        expect(defect.evidenceGroups).toBeDefined();
        expect(defect.evidenceGroups!.length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps the clean-code task free of expected defects", async () => {
    const tasks = await loadTasks();
    const cleanTask = tasks.find((task) => task.id === "FE-002");

    expect(cleanTask).toBeDefined();
    expect(cleanTask!.expectedDefects).toEqual([]);
  });
});