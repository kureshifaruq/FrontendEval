import { readFile } from "node:fs/promises";
import type { BenchmarkTask } from "./types.js";

export async function loadTasks(): Promise<BenchmarkTask[]> {
  const raw = await readFile("dataset/tasks.json", "utf8");
  const data: unknown = JSON.parse(raw);

  if (!Array.isArray(data)) {
    throw new Error("Dataset must be a JSON array.");
  }

  for (const task of data) {
    if (
      typeof task !== "object" ||
      task === null ||
      typeof task.id !== "string" ||
      typeof task.title !== "string" ||
      typeof task.category !== "string" ||
      typeof task.sourceFile !== "string" ||
      typeof task.prompt !== "string" ||
      !Array.isArray(task.expectedDefects)
    ) {
      throw new Error("Invalid benchmark task.");
    }

    for (const defect of task.expectedDefects) {
      if (
        typeof defect !== "object" ||
        defect === null ||
        typeof defect.id !== "string" ||
        typeof defect.category !== "string" ||
        typeof defect.severity !== "string" ||
        typeof defect.expectedBehavior !== "string"
      ) {
        throw new Error(`Invalid expected defect in task ${task.id}.`);
      }

      const validSeverities = ["critical", "high", "medium", "low"];

      if (!validSeverities.includes(defect.severity)) {
        throw new Error(
          `Invalid severity for defect ${defect.id} in task ${task.id}.`,
        );
      }

      if (defect.evidenceGroups !== undefined) {
        if (
          !Array.isArray(defect.evidenceGroups) ||
          !defect.evidenceGroups.every(
            (group: unknown) =>
              Array.isArray(group) &&
              group.length > 0 &&
              group.every(
                (phrase: unknown) =>
                  typeof phrase === "string" && phrase.trim().length > 0,
              ),
          )
        ) {
          throw new Error(
            `Invalid evidenceGroups for defect ${defect.id} in task ${task.id}.`,
          );
        }
      }
    }
  }

  return data as BenchmarkTask[];
}
