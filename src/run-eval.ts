
import "dotenv/config";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { loadTasks } from "./dataset.js";
import { buildReviewPrompt } from "./prompt.js";
import { reviewWithGemini } from "./gemini-adapter.js";
import { gradeReview } from "./grader.js";
import type { Finding, ModelReview } from "./types.js";

interface ProposedFix {
  explanation: string;
  sourceCode: string;
}

interface ParsedModelResponse {
  review: ModelReview;
  proposedFix: ProposedFix | null;
}

interface CandidateTestResult {
  status: "passed" | "failed" | "timed-out";
  command: string;
  exitCode: number | null;
  output: string;
}

function parseReview(output: string): ParsedModelResponse {
  const parsed: unknown = JSON.parse(output);

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("findings" in parsed) ||
    !Array.isArray(parsed.findings)
  ) {
    throw new Error(
      "Invalid model response: expected a findings array."
    );
  }

  const data = parsed as Record<string, unknown>;
  const findingsInput = parsed.findings;
  const findings: Finding[] = [];

  for (const item of findingsInput) {
    if (
      typeof item !== "object" ||
      item === null ||
      !("category" in item) ||
      !("severity" in item) ||
      !("explanation" in item) ||
      !("recommendation" in item)
    ) {
      throw new Error("Invalid finding structure.");
    }

    const finding = item as Record<string, unknown>;

    if (
      typeof finding.category !== "string" ||
      finding.category.trim().length === 0 ||
      typeof finding.severity !== "string" ||
      !["critical", "high", "medium", "low"].includes(
        finding.severity
      ) ||
      typeof finding.explanation !== "string" ||
      finding.explanation.trim().length === 0 ||
      typeof finding.recommendation !== "string" ||
      finding.recommendation.trim().length === 0
    ) {
      throw new Error("Invalid finding fields or severity.");
    }

    if (
      finding.defectId !== undefined &&
      typeof finding.defectId !== "string"
    ) {
      throw new Error("Invalid finding defectId.");
    }

    if (
      typeof finding.defectId === "string" &&
      finding.defectId.trim().length === 0
    ) {
      throw new Error("Finding defectId cannot be empty.");
    }

    findings.push({
      ...(typeof finding.defectId === "string"
        ? { defectId: finding.defectId }
        : {}),
      category: finding.category,
      severity: finding.severity as Finding["severity"],
      explanation: finding.explanation,
      recommendation: finding.recommendation
    });
  }

  let proposedFix: ProposedFix | null = null;

  if (data.proposedFix !== undefined && data.proposedFix !== null) {
    if (
      typeof data.proposedFix !== "object" ||
      !("explanation" in data.proposedFix) ||
      !("sourceCode" in data.proposedFix)
    ) {
      throw new Error("Invalid proposedFix structure.");
    }

    const fix = data.proposedFix as Record<string, unknown>;

    if (
      typeof fix.explanation !== "string" ||
      typeof fix.sourceCode !== "string" ||
      fix.sourceCode.trim().length === 0
    ) {
      throw new Error("Invalid proposedFix fields.");
    }

    proposedFix = {
      explanation: fix.explanation,
      sourceCode: fix.sourceCode
    };
  }

  return {
    review: {
      summary:
        typeof data.summary === "string" ? data.summary : "",
      findings
    },
    proposedFix
  };
}

function runCandidateTests(
  testFile: string
): Promise<CandidateTestResult> {
  const command = `node node_modules/vitest/vitest.mjs run ${testFile}`;

  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [
        "node_modules/vitest/vitest.mjs",
        "run",
        testFile
      ],
      {
        cwd: process.cwd(),
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"]
      }
    );

    let output = "";
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, 60_000);

    child.stdout.on("data", (chunk: Buffer) => {
      output += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer) => {
      output += chunk.toString();
    });

    child.on("error", (error: Error) => {
      clearTimeout(timeout);

      resolve({
        status: "failed",
        command,
        exitCode: null,
        output: `${output}\n${error.message}`
      });
    });

    child.on("close", (code) => {
      clearTimeout(timeout);

      resolve({
        status: timedOut
          ? "timed-out"
          : code === 0
            ? "passed"
            : "failed",
        command,
        exitCode: code,
        output: output.trim()
      });
    });
  });
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is missing. Check your .env file."
    );
  }

  const tasks = await loadTasks();
  const taskId = process.argv[2] ?? "FE-001";
  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  const source = await readFile(task.sourceFile, "utf8");
  const prompt = buildReviewPrompt(task, source);

  let review: ModelReview;
  let proposedFix: ProposedFix | null;

  try {
    const output = await reviewWithGemini(prompt);
    const parsedResponse = parseReview(output);

    review = parsedResponse.review;
    proposedFix = parsedResponse.proposedFix;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    const failureResult = {
      taskId,
      model: process.env.GEMINI_MODEL ?? "gemini-3.8-flash",
      status: "failed",
      stage: "model-review-or-response-parsing",
      error: errorMessage,
      evaluatedAt: new Date().toISOString()
    };

    await mkdir("results", { recursive: true });

    await writeFile(
      `results/${taskId}-error.json`,
      JSON.stringify(failureResult, null, 2),
      "utf8"
    );

    throw error;
  }

  const grade = gradeReview(
    task.expectedDefects,
    review.findings
  );

  await mkdir("results", { recursive: true });

  let candidateFile: string | null = null;
  let fixValidation:
    | CandidateTestResult
    | { status: "not-run"; message: string } = {
    status: "not-run",
    message: "Gemini did not provide a proposed fix."
  };

  if (proposedFix) {
    candidateFile = `results/${taskId}-candidate.ts`;

    await writeFile(
      candidateFile,
      proposedFix.sourceCode,
      "utf8"
    );

    const candidateTestFiles: Record<string, string> = {
      "FE-001": "tests/candidate-fix.test.ts",
      "FE-003": "tests/candidate-loading.test.ts",
      "FE-004": "tests/candidate-quantity.test.ts",
      "FE-005": "tests/candidate-accessibility.test.ts"
    };

    const testFile = candidateTestFiles[taskId];

    if (testFile) {
      fixValidation = await runCandidateTests(testFile);
    } else {
      fixValidation = {
        status: "not-run",
        message: `Automated candidate tests are not configured for ${taskId}.`
      };
    }
  }

  const result = {
    taskId,
    model: process.env.GEMINI_MODEL ?? "gemini-3.8-flash",
    review,
    grade,
    proposedFix: proposedFix
      ? {
        explanation: proposedFix.explanation,
        candidateFile,
        status: "saved"
      }
      : null,
    fixValidation,
    evaluatedAt: new Date().toISOString()
  };

  await writeFile(
    `results/${taskId}.json`,
    JSON.stringify(result, null, 2),
    "utf8"
  );

  console.log(JSON.stringify(result, null, 2));

  if (
    proposedFix &&
    "status" in fixValidation &&
    fixValidation.status !== "passed"
  ) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(
    "Evaluation failed:",
    error instanceof Error ? error.message : "Unknown error"
  );
  process.exitCode = 1;
});
