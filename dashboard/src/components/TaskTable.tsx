import {
  ArrowDownRight,
  CheckCircle2,
  CircleDot,
  FileCode2,
  Timer,
  XCircle,
} from "lucide-react";
import {
  formatCount,
  formatFixStatus,
  formatTimestamp,
} from "../data/format";
import type { TaskView } from "../types";

function StatusIcon({ status }: { status: string }) {
  if (status === "Completed") {
    return <CheckCircle2 size={14} />;
  }
  if (status === "Failed" || status === "Invalid result") {
    return <XCircle size={14} />;
  }
  return <CircleDot size={14} />;
}

export function TaskTable({
  tasks,
  onSelect,
}: {
  tasks: TaskView[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="table-scroll">
      <table className="task-table">
        <thead>
          <tr>
            <th>TASK</th>
            <th>CATEGORY</th>
            <th>TYPE</th>
            <th>MODEL</th>
            <th>STATUS</th>
            <th>FINDINGS</th>
            <th>TP / FP / FN</th>
            <th>FIX VALIDATION</th>
            <th>EVALUATED</th>
            <th aria-label="Open task" />
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const grade = task.result?.grade ?? task.summaryRow;
            const findings =
              task.result?.review.findings.length ??
              task.summaryRow?.findings ??
              null;
            const fixStatus =
              task.result?.fixValidation?.status ??
              task.summaryRow?.fixStatus ??
              null;

            return (
              <tr key={task.definition.id}>
                <td>
                  <div className="task-cell">
                    <div className="task-file-icon">
                      <FileCode2 size={17} />
                    </div>
                    <div>
                      <strong>{task.definition.title}</strong>
                      <span>{task.definition.id}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="category-text">{task.definition.category}</span>
                </td>
                <td>
                  <span
                    className={`type-badge ${task.isCleanControl ? "clean" : ""}`}
                  >
                    {task.isCleanControl ? "Clean" : "Defect"}
                  </span>
                </td>
                <td>
                  <span className="category-text">{task.model ?? "—"}</span>
                </td>
                <td>
                  <span className="table-status">
                    <StatusIcon status={task.evaluationStatus} />
                    {task.evaluationStatus}
                  </span>
                </td>
                <td>{formatCount(findings)}</td>
                <td>
                  {task.isCleanControl &&
                  grade &&
                  grade.truePositives === 0 &&
                  grade.falsePositives === 0 &&
                  grade.falseNegatives === 0
                    ? "N/A (control)"
                    : grade
                      ? `${formatCount(grade.truePositives)} / ${formatCount(grade.falsePositives)} / ${formatCount(grade.falseNegatives)}`
                      : "—"}
                </td>
                <td>
                  <span className={`fix-chip ${fixStatus ?? "unknown"}`}>
                    {fixStatus === "passed" ? (
                      <CheckCircle2 size={13} />
                    ) : fixStatus === "not-run" ? (
                      <Timer size={13} />
                    ) : (
                      <CircleDot size={13} />
                    )}
                    {formatFixStatus(fixStatus)}
                  </span>
                </td>
                <td>{formatTimestamp(task.result?.evaluatedAt)}</td>
                <td>
                  <button
                    className="row-open"
                    aria-label={`Inspect ${task.definition.id}`}
                    onClick={() => onSelect(task.definition.id)}
                  >
                    <ArrowDownRight size={17} />
                  </button>
                </td>
              </tr>
            );
          })}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={10} className="empty-state">
                No benchmark tasks match your search.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
