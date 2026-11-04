import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CircleDot,
  Gauge,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MetricCard } from "../components/MetricCard";
import { TaskTable } from "../components/TaskTable";
import {
  formatCount,
  formatPercent,
  formatScore,
  modelLabel,
  pad2,
} from "../data/format";
import type { BenchmarkSummary, TaskView } from "../types";

const tooltipStyle = {
  background: "#171b25",
  border: "1px solid #303646",
  borderRadius: 10,
  color: "#f4f5fb",
};

export function OverviewPage({
  summary,
  summaryError,
  tasks,
  onOpenTasks,
  onOpenReview,
}: {
  summary: BenchmarkSummary | null;
  summaryError: string | null;
  tasks: TaskView[];
  onOpenTasks: () => void;
  onOpenReview: (id: string) => void;
}) {
  const completed = summary?.completedTaskCount ?? tasks.filter((task) => task.result).length;
  const total = summary?.taskCount ?? tasks.length;
  const defectTasks = summary?.defectTasks ?? tasks.filter((task) => !task.isCleanControl).length;
  const cleanTasks = summary?.cleanTasks ?? tasks.filter((task) => task.isCleanControl).length;
  const models = summary?.model ?? [];
  const uniqueModels = [...new Set(tasks.map((task) => task.model).filter(Boolean))] as string[];

  const distribution = [
    { name: "Defect tasks", value: defectTasks, fill: "#9586ff" },
    { name: "Clean control", value: cleanTasks, fill: "#6d7488" },
  ];

  const findingChart = tasks.map((task) => ({
    name: task.definition.id,
    findings: task.result?.review.findings.length ?? task.summaryRow?.findings ?? 0,
    tp: task.result?.grade.truePositives ?? task.summaryRow?.truePositives ?? 0,
    fp: task.result?.grade.falsePositives ?? task.summaryRow?.falsePositives ?? 0,
    fn: task.result?.grade.falseNegatives ?? task.summaryRow?.falseNegatives ?? 0,
  }));

  const maxFindings = Math.max(1, ...findingChart.map((row) => row.findings));
  const fix = summary?.fixValidation;

  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            <Sparkles size={14} />
            AI CODE REVIEW BENCHMARK
          </div>
          <h1>Evaluation overview</h1>
          <p className="page-description">
            Recorded metrics from one saved benchmark run. These figures are not
            proof of general model accuracy.
          </p>
        </div>
        <div className="model-pill">
          <span className="model-dot" />
          <div>
            <span className="model-label">EVALUATED MODEL</span>
            <strong>{modelLabel(models.length ? models : uniqueModels)}</strong>
          </div>
        </div>
      </section>

      <section className="run-banner">
        <div className="run-banner-icon">
          <Activity size={19} />
        </div>
        <div className="run-banner-copy">
          <strong>Results from one recorded run</strong>
          <span>
            {total} tasks evaluated · {defectTasks} defect cases · {cleanTasks}{" "}
            clean control
          </span>
        </div>
        <span className="run-badge">
          <CheckCircle2 size={14} />
          {completed}/{total} completed
        </span>
      </section>

      {summaryError && (
        <div className="inline-error">
          Summary file could not be loaded: {summaryError}. Task-level files are
          still shown below when available.
        </div>
      )}

      {summary && (
        <section className="metric-grid">
          <MetricCard
            label="Precision"
            value={formatPercent(summary.metrics.precision)}
            detail={`${formatCount(summary.totals.tp)} true positives · ${formatCount(summary.totals.fp)} false positives`}
            icon={Target}
            trend="Calculated from the recorded defect-task grades"
            tone="purple"
          />
          <MetricCard
            label="Recall"
            value={formatPercent(summary.metrics.recall)}
            detail={`${formatCount(summary.totals.tp)} true positives · ${formatCount(summary.totals.fn)} false negatives`}
            icon={Gauge}
            trend="Calculated from the recorded defect-task grades"
            tone="blue"
          />
          <MetricCard
            label="F1 score"
            value={formatScore(summary.metrics.f1)}
            detail="Harmonic mean of recorded precision and recall"
            icon={BarChart3}
            trend="Observed score for this recorded run"
            tone="green"
          />
          <MetricCard
            label="Fix validation"
            value={`${fix?.passed ?? 0} passed`}
            detail={`${fix?.passed ?? 0} passed · ${fix?.failed ?? 0} failed · ${fix?.timedOut ?? 0} timed out · ${fix?.notRun ?? 0} not run`}
            icon={ShieldCheck}
            trend="Statuses come from saved candidate-test results"
            tone="orange"
          />
        </section>
      )}

      <div className="section-heading">
        <div>
          <h2>Benchmark performance</h2>
          <p>Task-level values from the recorded run — not a historical trend</p>
        </div>
        <span className="subtle-chip">
          <CircleDot size={13} />
          Single recorded run
        </span>
      </div>

      <section className="analytics-grid">
        <div className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h3>Task distribution</h3>
              <p>Defect cases versus clean control</p>
            </div>
          </div>

          <div className="distribution-summary">
            <div className="distribution-total">
              <strong>{pad2(total)}</strong>
              <span>Total tasks</span>
            </div>
            <div className="distribution-legend">
              <div>
                <span className="legend-dot purple-dot" />
                <span>Defect cases</span>
                <strong>{pad2(defectTasks)}</strong>
              </div>
              <div>
                <span className="legend-dot gray-dot" />
                <span>Clean control</span>
                <strong>{pad2(cleanTasks)}</strong>
              </div>
            </div>
          </div>

          <div className="chart-container distribution-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} barSize={42}>
                <CartesianGrid stroke="#242936" strokeDasharray="3 5" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#777f91"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <YAxis
                  stroke="#777f91"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  fontSize={11}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {distribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h3>Findings by task</h3>
              <p>Recorded finding counts from the saved results</p>
            </div>
            <span className="tiny-badge">{defectTasks} defect tasks</span>
          </div>

          <div className="chart-container findings-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={findingChart} barSize={18}>
                <CartesianGrid stroke="#242936" strokeDasharray="3 5" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#777f91"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <YAxis
                  stroke="#777f91"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  domain={[0, maxFindings]}
                  fontSize={11}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="findings" name="Findings" fill="#48c9a2" radius={[6, 6, 0, 0]} />
                <Bar dataKey="tp" name="True positives" fill="#9586ff" radius={[6, 6, 0, 0]} />
                <Bar dataKey="fp" name="False positives" fill="#d48b6e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="fn" name="False negatives" fill="#7d8496" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-note">
            <CheckCircle2 size={15} />
            Charts use this single recorded run. No extra historical points were
            synthesized.
          </div>
        </div>
      </section>

      <section className="panel tasks-panel">
        <div className="panel-header tasks-header">
          <div>
            <h3>Benchmark tasks</h3>
            <p>Explore the individual evaluation cases</p>
          </div>
          <button className="text-button" onClick={onOpenTasks}>
            View all tasks <ArrowUpRight size={15} />
          </button>
        </div>

        <TaskTable tasks={tasks} onSelect={onOpenReview} />

        <div className="table-footer">
          <span>
            Showing {tasks.length} of {total} benchmark tasks
          </span>
          <span>
            <CheckCircle2 size={14} /> {completed} evaluations completed
          </span>
        </div>
      </section>

      <div className="disclaimer">
        <CircleDot size={15} />
        <span>
          These results represent one recorded run against this five-task
          benchmark, not a guarantee of general model accuracy. Scores use the
          project's configured grading criteria.
        </span>
      </div>
    </>
  );
}
