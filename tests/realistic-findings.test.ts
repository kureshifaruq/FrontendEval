import { describe, expect, it } from "vitest";
import { loadTasks } from "../src/dataset.js";
import { gradeReview } from "../src/grader.js";
import type { Finding } from "../src/types.js";

describe("Grader with realistic AI findings", () => {
  it("accepts a valid finding for FE-003: loading state stuck after failure", async () => {
    const tasks = await loadTasks();
    const task = tasks.find((item) => item.id === "FE-003");

    expect(task).toBeDefined();

    const findings: Finding[] = [
      {
        defectId: "D1",
        category: "loading-state",
        severity: "medium",
        explanation:
          "The loading flag remains true when the request rejects, leaving the loading indicator stuck after failure.",
        recommendation:
          "Reset loading in a finally block so it returns to false after success or failure.",
      },
    ];

    expect(gradeReview(task!.expectedDefects, findings)).toMatchObject({
      truePositives: 1,
      falsePositives: 0,
      falseNegatives: 0,
      precision: 1,
      recall: 1,
      f1: 1,
    });
  });

  it("accepts a valid finding for FE-004: partial numeric input", async () => {
    const tasks = await loadTasks();
    const task = tasks.find((item) => item.id === "FE-004");

    expect(task).toBeDefined();

    const findings: Finding[] = [
      {
        defectId: "D1",
        category: "input-validation",
        severity: "medium",
        explanation:
          "parseInt accepts a numeric prefix, so input such as '2abc' is incorrectly accepted instead of being rejected.",
        recommendation:
          "Validate the entire input and reject malformed values before accepting a quantity.",
      },
    ];

    expect(gradeReview(task!.expectedDefects, findings)).toMatchObject({
      truePositives: 1,
      falsePositives: 0,
      falseNegatives: 0,
      precision: 1,
      recall: 1,
      f1: 1,
    });
  });

  it("accepts a valid finding for FE-005: inaccessible icon-only button", async () => {
    const tasks = await loadTasks();
    const task = tasks.find((item) => item.id === "FE-005");

    expect(task).toBeDefined();

    const findings: Finding[] = [
      {
        defectId: "D1",
        category: "accessibility",
        severity: "high",
        explanation:
          "The icon-only button has no accessible name, so a screen reader may not communicate its purpose.",
        recommendation:
          "Add an aria-label that describes the button's action for users of assistive technology.",
      },
    ];

    expect(gradeReview(task!.expectedDefects, findings)).toMatchObject({
      truePositives: 1,
      falsePositives: 0,
      falseNegatives: 0,
      precision: 1,
      recall: 1,
      f1: 1,
    });
  });

  it("rejects an incomplete finding for FE-003", async () => {
    const tasks = await loadTasks();
    const task = tasks.find((item) => item.id === "FE-003");

    expect(task).toBeDefined();

    const findings: Finding[] = [
      {
        defectId: "D1",
        category: "loading-state",
        severity: "medium",
        explanation: "The loading indicator is stuck.",
        recommendation: "Improve the loading indicator.",
      },
    ];

    expect(gradeReview(task!.expectedDefects, findings)).toMatchObject({
      truePositives: 0,
      falsePositives: 1,
      falseNegatives: 1,
      precision: 0,
      recall: 0,
      f1: 0,
    });
  });

});