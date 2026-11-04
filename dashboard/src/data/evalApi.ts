import type {
  BenchmarkSummary,
  BenchmarkTask,
  DashboardBundle,
  ExpectedDefect,
  Finding,
  GradeResult,
  LoadedResult,
  ProposedFix,
  TaskResult,
} from "../types";

export class EvalDataError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "EvalDataError";
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asNullableNumber(value: unknown): number | null {
  if (value === null) {
    return null;
  }
  return asFiniteNumber(value);
}

function parseExpectedDefect(value: unknown): ExpectedDefect | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }

  return {
    id: value.id,
    category: typeof value.category === "string" ? value.category : "unknown",
    severity: typeof value.severity === "string" ? value.severity : "medium",
    expectedBehavior:
      typeof value.expectedBehavior === "string" ? value.expectedBehavior : "",
    evidenceGroups: Array.isArray(value.evidenceGroups)
      ? value.evidenceGroups.filter(
          (group): group is string[] =>
            Array.isArray(group) && group.every((item) => typeof item === "string"),
        )
      : undefined,
  };
}

function parseTask(value: unknown): BenchmarkTask | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }

  return {
    id: value.id,
    title: typeof value.title === "string" ? value.title : value.id,
    category: typeof value.category === "string" ? value.category : "uncategorized",
    sourceFile: typeof value.sourceFile === "string" ? value.sourceFile : "",
    prompt: typeof value.prompt === "string" ? value.prompt : "",
    expectedDefects: Array.isArray(value.expectedDefects)
      ? value.expectedDefects
          .map(parseExpectedDefect)
          .filter((defect): defect is ExpectedDefect => defect !== null)
      : [],
  };
}

function parseFinding(value: unknown): Finding | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    defectId: typeof value.defectId === "string" ? value.defectId : undefined,
    category: typeof value.category === "string" ? value.category : "unspecified",
    severity: typeof value.severity === "string" ? value.severity : "unspecified",
    explanation:
      typeof value.explanation === "string" ? value.explanation : "",
    recommendation:
      typeof value.recommendation === "string" ? value.recommendation : "",
  };
}

function parseGrade(value: unknown): GradeResult | null {
  if (!isRecord(value)) {
    return null;
  }

  const truePositives = asFiniteNumber(value.truePositives);
  const falsePositives = asFiniteNumber(value.falsePositives);
  const falseNegatives = asFiniteNumber(value.falseNegatives);

  if (
    truePositives === null ||
    falsePositives === null ||
    falseNegatives === null
  ) {
    return null;
  }

  return {
    truePositives,
    falsePositives,
    falseNegatives,
    precision: asNullableNumber(value.precision),
    recall: asNullableNumber(value.recall),
    f1: asNullableNumber(value.f1),
  };
}

function parseProposedFix(value: unknown): ProposedFix | null {
  if (value === null) {
    return null;
  }
  if (!isRecord(value)) {
    return null;
  }

  return {
    explanation:
      typeof value.explanation === "string" ? value.explanation : undefined,
    candidateFile:
      typeof value.candidateFile === "string" ? value.candidateFile : undefined,
    status: typeof value.status === "string" ? value.status : undefined,
    sourceCode:
      typeof value.sourceCode === "string" ? value.sourceCode : undefined,
  };
}

function parseTaskResult(value: unknown): TaskResult | null {
  if (!isRecord(value) || typeof value.taskId !== "string") {
    return null;
  }

  const review = isRecord(value.review) ? value.review : null;
  const grade = parseGrade(value.grade);

  if (!review || !grade || typeof value.model !== "string") {
    return null;
  }

  const findings = Array.isArray(review.findings)
    ? review.findings
        .map(parseFinding)
        .filter((finding): finding is Finding => finding !== null)
    : [];

  const fixValidation = isRecord(value.fixValidation)
    ? {
        status:
          typeof value.fixValidation.status === "string"
            ? value.fixValidation.status
            : "unknown",
        command:
          typeof value.fixValidation.command === "string"
            ? value.fixValidation.command
            : undefined,
        exitCode:
          value.fixValidation.exitCode === null
            ? null
            : asFiniteNumber(value.fixValidation.exitCode) ?? undefined,
        output:
          typeof value.fixValidation.output === "string"
            ? value.fixValidation.output
            : undefined,
        message:
          typeof value.fixValidation.message === "string"
            ? value.fixValidation.message
            : undefined,
      }
    : undefined;

  return {
    taskId: value.taskId,
    model: value.model,
    review: {
      summary: typeof review.summary === "string" ? review.summary : "",
      findings,
    },
    grade,
    proposedFix: parseProposedFix(value.proposedFix),
    fixValidation,
    evaluatedAt:
      typeof value.evaluatedAt === "string" ? value.evaluatedAt : undefined,
  };
}

function parseSummary(value: unknown): BenchmarkSummary | null {
  if (!isRecord(value) || !isRecord(value.totals) || !isRecord(value.metrics)) {
    return null;
  }

  const tp = asFiniteNumber(value.totals.tp);
  const fp = asFiniteNumber(value.totals.fp);
  const fn = asFiniteNumber(value.totals.fn);
  const fix = isRecord(value.fixValidation) ? value.fixValidation : null;
  const passed = fix ? asFiniteNumber(fix.passed) : null;
  const failed = fix ? asFiniteNumber(fix.failed) : null;
  const timedOut = fix ? asFiniteNumber(fix.timedOut) : null;
  const notRun = fix ? asFiniteNumber(fix.notRun) : null;

  if (
    tp === null ||
    fp === null ||
    fn === null ||
    passed === null ||
    failed === null ||
    timedOut === null ||
    notRun === null
  ) {
    return null;
  }

  return {
    model: Array.isArray(value.model)
      ? value.model.filter((item): item is string => typeof item === "string")
      : [],
    taskCount: asFiniteNumber(value.taskCount) ?? 0,
    completedTaskCount: asFiniteNumber(value.completedTaskCount) ?? 0,
    failedEvaluationCount: asFiniteNumber(value.failedEvaluationCount) ?? 0,
    missingTaskIds: Array.isArray(value.missingTaskIds)
      ? value.missingTaskIds.filter((item): item is string => typeof item === "string")
      : [],
    invalidResultFiles: Array.isArray(value.invalidResultFiles)
      ? value.invalidResultFiles.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
    defectTasks: asFiniteNumber(value.defectTasks) ?? 0,
    cleanTasks: asFiniteNumber(value.cleanTasks) ?? 0,
    totals: { tp, fp, fn },
    metrics: {
      precision: asNullableNumber(value.metrics.precision),
      recall: asNullableNumber(value.metrics.recall),
      f1: asNullableNumber(value.metrics.f1),
    },
    fixValidation: { passed, failed, timedOut, notRun },
    failures: Array.isArray(value.failures)
      ? value.failures.flatMap((item) => {
          if (!isRecord(item) || typeof item.taskId !== "string") {
            return [];
          }
          return [
            {
              taskId: item.taskId,
              model: typeof item.model === "string" ? item.model : undefined,
              status: typeof item.status === "string" ? item.status : undefined,
              stage: typeof item.stage === "string" ? item.stage : undefined,
              error: typeof item.error === "string" ? item.error : undefined,
            },
          ];
        })
      : [],
    tasks: Array.isArray(value.tasks)
      ? value.tasks.flatMap((item) => {
          if (!isRecord(item) || typeof item.taskId !== "string") {
            return [];
          }
          const truePositives = asFiniteNumber(item.truePositives) ?? 0;
          const falsePositives = asFiniteNumber(item.falsePositives) ?? 0;
          const falseNegatives = asFiniteNumber(item.falseNegatives) ?? 0;
          return [
            {
              taskId: item.taskId,
              findings: asFiniteNumber(item.findings) ?? 0,
              truePositives,
              falsePositives,
              falseNegatives,
              precision: asNullableNumber(item.precision),
              recall: asNullableNumber(item.recall),
              f1: asNullableNumber(item.f1),
              fixStatus:
                typeof item.fixStatus === "string" ? item.fixStatus : "unknown",
            },
          ];
        })
      : [],
  };
}

function parseLoadedResult(value: unknown): LoadedResult {
  if (!isRecord(value)) {
    return { ok: false, error: "Malformed result payload" };
  }

  if (value.ok === true) {
    const parsed = parseTaskResult(value.data);
    if (!parsed) {
      return { ok: false, error: "Saved result JSON is missing required fields" };
    }
    return { ok: true, data: parsed };
  }

  return {
    ok: false,
    error: typeof value.error === "string" ? value.error : "Result file could not be loaded",
  };
}

function parseBundle(value: unknown): DashboardBundle {
  if (!isRecord(value)) {
    throw new EvalDataError("Eval data bundle is not a JSON object");
  }

  if (!Array.isArray(value.tasks)) {
    throw new EvalDataError("Eval data bundle is missing the task list");
  }

  const tasks = value.tasks
    .map(parseTask)
    .filter((task): task is BenchmarkTask => task !== null);

  if (tasks.length === 0) {
    throw new EvalDataError("No valid tasks were found in dataset/tasks.json");
  }

  const results: DashboardBundle["results"] = {};
  if (isRecord(value.results)) {
    for (const [taskId, result] of Object.entries(value.results)) {
      results[taskId] = parseLoadedResult(result);
    }
  }

  const candidates: Record<string, string | null> = {};
  if (isRecord(value.candidates)) {
    for (const [taskId, source] of Object.entries(value.candidates)) {
      candidates[taskId] = typeof source === "string" ? source : null;
    }
  }

  return {
    summary: parseSummary(value.summary),
    summaryError:
      typeof value.summaryError === "string" ? value.summaryError : null,
    tasks,
    results,
    candidates,
    readme: typeof value.readme === "string" ? value.readme : "",
  };
}

export async function loadDashboardBundle(
  signal?: AbortSignal,
): Promise<DashboardBundle> {
  let response: Response;

  try {
    response = await fetch("/eval-data/bundle.json", { signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new EvalDataError(
      "Could not reach the local evaluation data server. Start the dashboard with npm run dev from the dashboard directory.",
    );
  }

  if (!response.ok) {
    let detail = "";
    try {
      const body: unknown = await response.json();
      if (isRecord(body) && typeof body.error === "string") {
        detail = body.error;
      }
    } catch {
      detail = "";
    }

    throw new EvalDataError(
      detail || `Evaluation data request failed (${response.status})`,
      response.status,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new EvalDataError("The evaluation data server returned invalid JSON");
  }

  return parseBundle(payload);
}
