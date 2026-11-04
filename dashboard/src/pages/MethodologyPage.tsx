import {
  CheckCircle2,
  ClipboardCheck,
  Code2,
  ShieldCheck,
  Target,
  type LucideIcon,
} from "lucide-react";
import {
  extractReadmeSections,
  paragraphList,
  sectionByTitle,
} from "../data/methodology";
import { formatCount, formatPercent, modelLabel } from "../data/format";
import type { BenchmarkSummary } from "../types";

function MethodCard({
  icon: Icon,
  number,
  title,
  description,
}: {
  icon: LucideIcon;
  number: string;
  title: string;
  description: string;
}) {
  return (
    <article className="panel method-card">
      <div className="method-card-top">
        <span className="metric-icon purple">
          <Icon size={20} />
        </span>
        <span className="method-number">{number}</span>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

function MethodStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="method-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function firstParagraph(body: string, fallback: string): string {
  return paragraphList(body, 1)[0] ?? fallback;
}

export function MethodologyPage({
  readme,
  summary,
}: {
  readme: string;
  summary: BenchmarkSummary | null;
}) {
  const sections = extractReadmeSections(readme);
  const methodology = sectionByTitle(sections, /Evaluation Methodology/i);
  const limitations = sectionByTitle(sections, /Limitations/i);
  const interpretation = sectionByTitle(sections, /Responsible Interpretation/i);
  const scoring = methodology?.body.split("### Scoring")[1]?.split("###")[0] ?? "";
  const validation =
    methodology?.body.split("### Proposed-Fix Validation")[1]?.split("###")[0] ?? "";
  const tasks = methodology?.body.split("### Benchmark Tasks")[1]?.split("###")[0] ?? "";

  const limitationItems = (limitations?.body ?? "")
    .split("\n")
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter((line) => line.length > 20 && !line.startsWith("#") && !line.startsWith("Future"));

  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            <ShieldCheck size={14} />
            TRANSPARENT EVALUATION
          </div>
          <h1>Methodology</h1>
          <p className="page-description">
            {firstParagraph(
              methodology?.body ?? "",
              "How FrontendEval tests and scores AI-generated frontend code reviews.",
            )}
          </p>
        </div>
      </section>

      <section className="method-grid">
        <MethodCard
          icon={Target}
          number="01"
          title="Task design"
          description={firstParagraph(
            tasks,
            "The benchmark uses focused frontend tasks defined in dataset/tasks.json, including a clean control with no expected defect.",
          )}
        />
        <MethodCard
          icon={Code2}
          number="02"
          title="AI code review"
          description="The evaluation prompt asks the model for actionable, evidence-based defects and proposed corrections while discouraging style-only findings. The dashboard displays saved reviews and does not call Gemini."
        />
        <MethodCard
          icon={ClipboardCheck}
          number="03"
          title="Deterministic grading"
          description={firstParagraph(
            scoring,
            "The grader compares model findings against configured defect categories, identifiers when present, and evidence phrase requirements.",
          )}
        />
        <MethodCard
          icon={CheckCircle2}
          number="04"
          title="Fix validation"
          description={firstParagraph(
            validation,
            "Candidate fixes are checked against configured task-specific tests. Passing these tests does not prove universal production correctness.",
          )}
        />
      </section>

      {summary && (
        <section className="panel methodology-panel">
          <div className="panel-header">
            <div>
              <h3>Recorded run summary</h3>
              <p>Values from results/benchmark-summary.json</p>
            </div>
            <span className="tiny-badge">{summary.taskCount} tasks</span>
          </div>
          <div className="method-stats">
            <MethodStat label="Model" value={modelLabel(summary.model)} />
            <MethodStat
              label="Completed tasks"
              value={`${summary.completedTaskCount} / ${summary.taskCount}`}
            />
            <MethodStat
              label="True positives"
              value={formatCount(summary.totals.tp)}
            />
            <MethodStat
              label="False positives"
              value={formatCount(summary.totals.fp)}
            />
            <MethodStat
              label="False negatives"
              value={formatCount(summary.totals.fn)}
            />
            <MethodStat
              label="Precision"
              value={formatPercent(summary.metrics.precision)}
            />
            <MethodStat
              label="Fix tests passed"
              value={formatCount(summary.fixValidation.passed)}
            />
            <MethodStat
              label="Fix validations not run"
              value={formatCount(summary.fixValidation.notRun)}
            />
          </div>
        </section>
      )}

      <section className="panel limitations-panel">
        <div className="detail-title">
          <ShieldCheck size={18} />
          <h4>Limitations and interpretation</h4>
        </div>
        <ul>
          {limitationItems.length > 0
            ? limitationItems.map((item) => <li key={item}>{item}</li>)
            : (
              <>
                <li>
                  The grader uses configured matching criteria, including evidence
                  phrases. It is not a fully semantic judge.
                </li>
                <li>
                  Passing candidate tests validates the configured test cases, not
                  every possible production scenario.
                </li>
              </>
            )}
          {interpretation && (
            <li>{firstParagraph(interpretation.body, interpretation.body)}</li>
          )}
        </ul>
      </section>
    </>
  );
}
