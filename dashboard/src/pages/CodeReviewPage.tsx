import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  ClipboardCheck,
  Code2,
  FileCode2,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import {
  formatCount,
  formatFixStatus,
  formatPercent,
  formatScore,
  formatTimestamp,
  stripAnsi,
} from "../data/format";
import type { TaskView } from "../types";

function severityClass(severity: string): string {
  const key = severity.toLowerCase();
  if (key === "critical" || key === "high" || key === "medium" || key === "low") {
    return key;
  }
  return "medium";
}

export function CodeReviewPage({
  tasks,
  selectedId,
  onSelect,
}: {
  tasks: TaskView[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const current = tasks.find((task) => task.definition.id === selectedId) ?? tasks[0];

  if (!current) {
    return (
      <div className="inline-error">No benchmark tasks were loaded.</div>
    );
  }

  const result = current.result;
  const findings = result?.review.findings ?? [];
  const grade = result?.grade;
  const validation = result?.fixValidation;
  const proposedFix = result?.proposedFix;
  const terminalOutput = validation?.output
    ? stripAnsi(validation.output)
    : null;

  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            <FileCode2 size={14} />
            MODEL OUTPUT INSPECTOR
          </div>
          <h1>Code review results</h1>
          <p className="page-description">
            Inspect the saved JSON for each task: findings, grading, proposed
            fix, and candidate-test output.
          </p>
        </div>
        <span className="model-pill">
          <span className="model-dot" />
          {current.model ?? "Model not recorded"}
        </span>
      </section>

      <div className="review-layout">
        <section className="panel task-selector">
          <div className="panel-header">
            <div>
              <h3>Evaluation cases</h3>
              <p>Select a task to inspect</p>
            </div>
          </div>
          {tasks.map((task) => (
            <button
              key={task.definition.id}
              className={`review-task ${
                current.definition.id === task.definition.id ? "selected" : ""
              }`}
              onClick={() => onSelect(task.definition.id)}
            >
              <div className="review-task-icon">
                <FileCode2 size={17} />
              </div>
              <div className="review-task-copy">
                <strong>{task.definition.id}</strong>
                <span>{task.definition.title}</span>
              </div>
              {task.evaluationStatus === "Completed" ? (
                <CheckCircle2 size={16} className="success-icon" />
              ) : (
                <CircleDot size={16} className="muted-icon" />
              )}
            </button>
          ))}
        </section>

        <section className="panel review-detail">
          <div className="panel-header">
            <div>
              <span className="task-id">{current.definition.id}</span>
              <h3>{current.definition.title}</h3>
              <p>{current.definition.prompt}</p>
            </div>
            <span
              className={`type-badge ${current.isCleanControl ? "clean" : ""}`}
            >
              {current.isCleanControl ? "Clean control" : "Defect case"}
            </span>
          </div>

          {current.resultError && (
            <div className="inline-error">
              Could not load this task result: {current.resultError}
            </div>
          )}

          {result && (
            <>
              <div className="review-status-card">
                <div className="review-status-icon">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <strong>{current.evaluationStatus}</strong>
                  <span>
                    Evaluated {formatTimestamp(result.evaluatedAt)} ·{" "}
                    {formatCount(findings.length)} recorded finding
                    {findings.length === 1 ? "" : "s"}
                  </span>
                </div>
                <span className="status-tag">
                  <Check size={13} />
                  {current.evaluationStatus}
                </span>
              </div>

              <div className="detail-section">
                <div className="detail-title">
                  <ClipboardCheck size={17} />
                  <h4>Review summary</h4>
                </div>
                <p>{result.review.summary || "No summary was recorded."}</p>
              </div>

              <div className="detail-section">
                <div className="detail-title">
                  <AlertTriangle size={17} />
                  <h4>Findings</h4>
                </div>
                {current.isCleanControl && (
                  <div className="validation-message neutral">
                    <CircleDot size={17} />
                    <div>
                      <strong>No finding is expected</strong>
                      <p>
                        This task is a clean control. The dataset defines no
                        expected defect, so the inspector does not invent a
                        finding or proposed fix.
                      </p>
                    </div>
                  </div>
                )}
                {findings.length === 0 ? (
                  <p className={current.isCleanControl ? "control-note" : undefined}>
                    The saved review contains no findings.
                  </p>
                ) : (
                  <div className="finding-list">
                    {findings.map((finding, index) => (
                      <article className="finding-card" key={`${finding.category}-${index}`}>
                        <div className="finding-card-top">
                          <strong>{finding.category}</strong>
                          <span className={`severity-badge ${severityClass(finding.severity)}`}>
                            {finding.severity}
                          </span>
                        </div>
                        {finding.defectId && (
                          <div className="finding-id">Defect ID: {finding.defectId}</div>
                        )}
                        <p>
                          <span>Explanation</span>
                          {finding.explanation}
                        </p>
                        <p>
                          <span>Recommendation</span>
                          {finding.recommendation}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div className="detail-section">
                <div className="detail-title">
                  <ShieldCheck size={17} />
                  <h4>Grading results</h4>
                </div>
                {grade ? (
                  <div className="grade-grid">
                    <div>
                      <span>True positives</span>
                      <strong>{formatCount(grade.truePositives)}</strong>
                    </div>
                    <div>
                      <span>False positives</span>
                      <strong>{formatCount(grade.falsePositives)}</strong>
                    </div>
                    <div>
                      <span>False negatives</span>
                      <strong>{formatCount(grade.falseNegatives)}</strong>
                    </div>
                    <div>
                      <span>Precision</span>
                      <strong>{formatPercent(grade.precision)}</strong>
                    </div>
                    <div>
                      <span>Recall</span>
                      <strong>{formatPercent(grade.recall)}</strong>
                    </div>
                    <div>
                      <span>F1</span>
                      <strong>{formatScore(grade.f1)}</strong>
                    </div>
                  </div>
                ) : (
                  <p>No grade object was present in the saved result.</p>
                )}
              </div>

              <div className="detail-section">
                <div className="detail-title">
                  <Code2 size={17} />
                  <h4>Proposed fix</h4>
                </div>
                {!proposedFix ? (
                  <div className="validation-message neutral">
                    <CircleDot size={17} />
                    <div>
                      <strong>No proposed fix recorded</strong>
                      <p>
                        {current.isCleanControl
                          ? "A corrective patch is not expected for the clean control."
                          : "The saved result does not include a proposed fix."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="validation-message">
                    <CheckCircle2 size={17} />
                    <div>
                      <strong>
                        {proposedFix.status
                          ? `Proposed fix ${proposedFix.status}`
                          : "Proposed fix"}
                      </strong>
                      <p>
                        {proposedFix.explanation ||
                          "No proposed-fix explanation was recorded."}
                      </p>
                      {proposedFix.candidateFile && (
                        <p>Candidate file: {proposedFix.candidateFile}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="detail-section">
                <div className="detail-title">
                  <ClipboardCheck size={17} />
                  <h4>Candidate-fix validation</h4>
                </div>
                <div
                  className={`validation-message ${
                    validation?.status === "passed"
                      ? ""
                      : "neutral"
                  }`}
                >
                  {validation?.status === "passed" ? (
                    <CheckCircle2 size={17} />
                  ) : (
                    <CircleDot size={17} />
                  )}
                  <div>
                    <strong>
                      Status: {formatFixStatus(validation?.status)}
                    </strong>
                    <p>
                      {validation?.message ||
                        (validation?.status === "not-run"
                          ? "Fix validation was not run for this task."
                          : "Recorded from the saved result file.")}
                    </p>
                    {validation?.command && (
                      <p>Command: {validation.command}</p>
                    )}
                    {validation?.exitCode !== undefined && (
                      <p>Exit code: {String(validation.exitCode)}</p>
                    )}
                  </div>
                </div>

                {terminalOutput && (
                  <details className="terminal-panel" open>
                    <summary>
                      <Terminal size={15} />
                      Validation output
                      <ChevronDown size={14} className="details-chevron" />
                    </summary>
                    <pre>{terminalOutput}</pre>
                  </details>
                )}
              </div>

              {current.candidateSource && (
                <div className="detail-section">
                  <div className="detail-title">
                    <FileCode2 size={17} />
                    <h4>Candidate source</h4>
                  </div>
                  <pre className="code-panel">{current.candidateSource}</pre>
                </div>
              )}
            </>
          )}

          <div className="detail-footer">
            <span>Category: {current.definition.category}</span>
            <span>Model: {current.model ?? "Not recorded"}</span>
          </div>
        </section>
      </div>
    </>
  );
}
