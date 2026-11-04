import type { DashboardBundle, TaskView } from "../types";

export function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }
  return `${Math.round(value * 100)}%`;
}

export function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }
  return value.toFixed(2);
}

export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }
  return String(value);
}

export function formatFixStatus(status: string | null | undefined): string {
  switch (status) {
    case "passed":
      return "Passed";
    case "failed":
      return "Failed";
    case "timed-out":
      return "Timed out";
    case "not-run":
      return "Not run";
    case undefined:
    case null:
    case "":
      return "Unknown";
    default:
      return status;
  }
}

export function formatTimestamp(value: string | null | undefined): string {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function stripAnsi(text: string): string {
  // ANSI terminal escape sequences contain control characters by design.
  // eslint-disable-next-line no-control-regex
  return text.replace(/\u001B\[[0-9;]*[A-Za-z]/g, "");
}

export function modelLabel(models: string[] | undefined, fallback?: string | null): string {
  if (fallback) {
    return fallback;
  }
  if (!models || models.length === 0) {
    return "Not recorded";
  }
  return models.join(", ");
}

export function isCleanControl(expectedCount: number, category: string): boolean {
  return expectedCount === 0 || category.toLowerCase().includes("clean");
}

function loadedResultError(
  loaded: DashboardBundle["results"][string] | undefined,
): string | null {
  if (loaded === undefined) {
    return "Result file not found";
  }
  if (loaded.ok === false) {
    return loaded.error;
  }
  return null;
}

export function buildTaskViews(bundle: DashboardBundle): TaskView[] {
  return bundle.tasks.map((definition) => {
    const loaded = bundle.results[definition.id];
    const result = loaded?.ok === true ? loaded.data : null;
    const resultError = loadedResultError(loaded);
    const summaryRow =
      bundle.summary?.tasks.find((row) => row.taskId === definition.id) ?? null;
    const failed = bundle.summary?.failures.some(
      (failure) => failure.taskId === definition.id,
    );
    const missing = bundle.summary?.missingTaskIds.includes(definition.id);
    const invalid = bundle.summary?.invalidResultFiles.some((file) =>
      file.startsWith(definition.id),
    );

    let evaluationStatus = "Completed";
    if (failed) {
      evaluationStatus = "Failed";
    } else if (invalid) {
      evaluationStatus = "Invalid result";
    } else if (missing || !result) {
      evaluationStatus = "Missing result";
    }

    return {
      definition,
      result,
      resultError: result ? null : resultError,
      candidateSource: bundle.candidates[definition.id] ?? null,
      summaryRow,
      isCleanControl: isCleanControl(
        definition.expectedDefects.length,
        definition.category,
      ),
      evaluationStatus,
      model: result?.model ?? bundle.summary?.model[0] ?? null,
    };
  });
}
