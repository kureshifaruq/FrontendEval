import { randomUUID } from "node:crypto";
import {
  mkdir,
  readFile,
  readdir,
  rename,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

export type RunStatus =
  | "running"
  | "completed"
  | "completed-with-errors"
  | "failed";

export interface RunMetadata {
  runId: string;
  startedAt: string;
  completedAt: string | null;
  status: RunStatus;
  provider: string;
  model: string;
  requestedTaskIds: string[];
  completedTaskIds: string[];
  failedTaskIds: string[];
}

const RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

export function validateRunId(runId: string): void {
  if (!RUN_ID_PATTERN.test(runId)) {
    throw new Error(`Invalid run ID: ${runId}`);
  }
}

export function createRunId(date = new Date()): string {
  const timestamp = date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  return `${timestamp}-${randomUUID().slice(0, 8)}`;
}

function getRunDirectory(runId: string, resultsRoot: string): string {
  validateRunId(runId);

  return path.resolve(resultsRoot, "runs", runId);
}

async function atomicWriteJson(
  filePath: string,
  value: unknown,
): Promise<void> {
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;

  try {
    await writeFile(
      temporaryPath,
      JSON.stringify(value, null, 2),
      "utf8",
    );

    await rename(temporaryPath, filePath);
  } catch (error) {
    const { unlink } = await import("node:fs/promises");
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}

export async function createRun(options: {
  resultsRoot?: string;
  runId?: string;
  provider: string;
  model: string;
  taskIds: string[];
}): Promise<RunMetadata> {
  const resultsRoot = path.resolve(options.resultsRoot ?? "results");
  const runId = options.runId ?? createRunId();

  validateRunId(runId);

  const runDirectory = getRunDirectory(runId, resultsRoot);

  await mkdir(path.dirname(runDirectory), { recursive: true });

  await mkdir(runDirectory);

  const metadata: RunMetadata = {
    runId,
    startedAt: new Date().toISOString(),
    completedAt: null,
    status: "running",
    provider: options.provider,
    model: options.model,
    requestedTaskIds: [...options.taskIds],
    completedTaskIds: [],
    failedTaskIds: [],
  };

  await atomicWriteJson(
    path.join(runDirectory, "run.json"),
    metadata,
  );

  return metadata;
}

export async function readRun(
  runId: string,
  resultsRoot = "results",
): Promise<RunMetadata> {
  const runDirectory = getRunDirectory(runId, resultsRoot);
  const content = await readFile(
    path.join(runDirectory, "run.json"),
    "utf8",
  );

  const metadata: unknown = JSON.parse(content);

  if (
    typeof metadata !== "object" ||
    metadata === null ||
    !("runId" in metadata) ||
    metadata.runId !== runId
  ) {
    throw new Error(`Invalid metadata for run: ${runId}`);
  }

  return metadata as RunMetadata;
}

export async function updateRun(
  runId: string,
  update: Partial<
    Pick<
      RunMetadata,
      | "completedAt"
      | "status"
      | "completedTaskIds"
      | "failedTaskIds"
    >
  >,
  resultsRoot = "results",
): Promise<RunMetadata> {
  const runDirectory = getRunDirectory(runId, resultsRoot);
  const metadata = await readRun(runId, resultsRoot);

  const updated: RunMetadata = {
    ...metadata,
    ...update,
  };

  await atomicWriteJson(
    path.join(runDirectory, "run.json"),
    updated,
  );

  return updated;
}

export async function getLatestRunId(
  resultsRoot = "results",
): Promise<string | null> {
  const runsDirectory = path.resolve(resultsRoot, "runs");

  let entries: string[];

  try {
    entries = await readdir(runsDirectory);
  } catch {
    return null;
  }

  const runs = await Promise.all(
    entries.map(async (runId) => {
      if (!RUN_ID_PATTERN.test(runId)) {
        return null;
      }

      try {
        const metadata = await readRun(runId, resultsRoot);

        return {
          runId,
          startedAt: metadata.startedAt,
        };
      } catch {
        return null;
      }
    }),
  );

  const validRuns = runs.filter(
    (run): run is { runId: string; startedAt: string } =>
      run !== null,
  );

  validRuns.sort((a, b) =>
    b.startedAt.localeCompare(a.startedAt),
  );

  return validRuns[0]?.runId ?? null;
}
