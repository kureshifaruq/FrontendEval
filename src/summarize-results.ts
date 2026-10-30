import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const taskIds = ["FE-001", "FE-002", "FE-003", "FE-004", "FE-005"];

type EvaluationResult = {
  taskId: string;
  model: string;
  grade: {
    truePositives: number;
    falsePositives: number;
    falseNegatives: number;
    precision: number | null;
    recall: number | null;
    f1: number | null;
  };
  review: {
    findings: unknown[];
  };
  fixValidation?: {
    status: string;
  };
};

type EvaluationFailure = {
  taskId: string;
  model?: string;
  status?: string;
  stage?: string;
  error?: string;
};

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function isEvaluationResult(value: unknown): value is EvaluationResult {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const result = value as Record<string, unknown>;
  const grade = result.grade;
  const review = result.review;

  if (
    typeof result.taskId !== "string" ||
    typeof result.model !== "string" ||
    typeof grade !== "object" ||
    grade === null ||
    typeof review !== "object" ||
    review === null
  ) {
    return false;
  }

  const gradeData = grade as Record<string, unknown>;
  const reviewData = review as Record<string, unknown>;

  const numericFields = [
    "truePositives",
    "falsePositives",
    "falseNegatives",
  ];

  if (
    !numericFields.every(
      (field) =>
        typeof gradeData[field] === "number" &&
        Number.isFinite(gradeData[field]) &&
        (gradeData[field] as number) >= 0,
    )
  ) {
    return false;
  }

  return Array.isArray(reviewData.findings);
}

function isEvaluationFailure(value: unknown): value is EvaluationFailure {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.taskId === "string" &&
    (record.status === undefined || typeof record.status === "string") &&
    (record.error === undefined || typeof record.error === "string")
  );
}

const results: EvaluationResult[] = [];
const failures: EvaluationFailure[] = [];
const invalidResultFiles: string[] = [];

for (const taskId of taskIds) {
  const resultPath = resolve("results", `${taskId}.json`);
  const errorPath = resolve("results", `${taskId}-error.json`);

  if (existsSync(resultPath)) {
    try {
      const parsed = readJson(resultPath);

      if (isEvaluationResult(parsed) && parsed.taskId === taskId) {
        results.push(parsed);
      } else {
        invalidResultFiles.push(`${taskId}.json`);
      }
    } catch {
      invalidResultFiles.push(`${taskId}.json`);
    }
  }

  if (existsSync(errorPath)) {
    try {
      const parsed = readJson(errorPath);

      if (isEvaluationFailure(parsed) && parsed.taskId === taskId) {
        failures.push(parsed);
      } else {
        invalidResultFiles.push(`${taskId}-error.json`);
      }
    } catch {
      invalidResultFiles.push(`${taskId}-error.json`);
    }
  }
}

const completedTaskIds = new Set(results.map((result) => result.taskId));
const failedTaskIds = new Set(failures.map((failure) => failure.taskId));

const missingTasks = taskIds.filter(
  (taskId) =>
    !completedTaskIds.has(taskId) &&
    !failedTaskIds.has(taskId) &&
    !invalidResultFiles.some((file) => file.startsWith(`${taskId}.json`)),
);

const totals = results.reduce(
  (sum, result) => ({
    tp: sum.tp + result.grade.truePositives,
    fp: sum.fp + result.grade.falsePositives,
    fn: sum.fn + result.grade.falseNegatives,
  }),
  { tp: 0, fp: 0, fn: 0 },
);

const precisionDenominator = totals.tp + totals.fp;
const recallDenominator = totals.tp + totals.fn;

const precision =
  precisionDenominator > 0
    ? totals.tp / precisionDenominator
    : null;

const recall =
  recallDenominator > 0
    ? totals.tp / recallDenominator
    : null;

const f1 =
  precision !== null &&
  recall !== null
    ? precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : 0
    : null;

const fixValidation = {
  passed: results.filter(
    (result) => result.fixValidation?.status === "passed",
  ).length,

  failed: results.filter(
    (result) => result.fixValidation?.status === "failed",
  ).length,

  timedOut: results.filter(
    (result) => result.fixValidation?.status === "timed-out",
  ).length,

  notRun: results.filter(
    (result) =>
      !result.fixValidation ||
      result.fixValidation.status === "not-run",
  ).length,
};

const report = {
  model: [...new Set(results.map((result) => result.model))],

  taskCount: taskIds.length,
  completedTaskCount: results.length,
  failedEvaluationCount: failures.length,
  missingTaskIds: missingTasks,
  invalidResultFiles,

  defectTasks: results.filter(
    (result) =>
      result.grade.truePositives + result.grade.falseNegatives > 0,
  ).length,

  cleanTasks: results.filter(
    (result) =>
      result.grade.truePositives === 0 &&
      result.grade.falseNegatives === 0 &&
      result.review.findings.length === 0,
  ).length,

  totals,
  metrics: { precision, recall, f1 },
  fixValidation,

  failures,

  tasks: results.map((result) => ({
    taskId: result.taskId,
    findings: result.review.findings.length,
    ...result.grade,
    fixStatus: result.fixValidation?.status ?? "not-run",
  })),
};

const outputPath = resolve("results", "benchmark-summary.json");

writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf8");

console.log(JSON.stringify(report, null, 2));
console.log(`\nReport saved to ${outputPath}`);