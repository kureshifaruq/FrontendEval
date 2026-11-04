export type Severity = "critical" | "high" | "medium" | "low" | string;

export interface ExpectedDefect {
  id: string;
  category: string;
  severity: Severity;
  expectedBehavior: string;
  evidenceGroups?: string[][];
}

export interface BenchmarkTask {
  id: string;
  title: string;
  category: string;
  sourceFile: string;
  prompt: string;
  expectedDefects: ExpectedDefect[];
}

export interface Finding {
  defectId?: string;
  category: string;
  severity: Severity;
  explanation: string;
  recommendation: string;
}

export interface GradeResult {
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number | null;
  recall: number | null;
  f1: number | null;
}

export interface ProposedFix {
  explanation?: string;
  candidateFile?: string;
  status?: string;
  sourceCode?: string;
}

export interface FixValidation {
  status: string;
  command?: string;
  exitCode?: number | null;
  output?: string;
  message?: string;
}

export interface TaskResult {
  taskId: string;
  model: string;
  review: {
    summary: string;
    findings: Finding[];
  };
  grade: GradeResult;
  proposedFix: ProposedFix | null;
  fixValidation?: FixValidation;
  evaluatedAt?: string;
}

export interface SummaryTaskRow {
  taskId: string;
  findings: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number | null;
  recall: number | null;
  f1: number | null;
  fixStatus: string;
}

export interface EvaluationFailure {
  taskId: string;
  model?: string;
  status?: string;
  stage?: string;
  error?: string;
}

export interface BenchmarkSummary {
  model: string[];
  taskCount: number;
  completedTaskCount: number;
  failedEvaluationCount: number;
  missingTaskIds: string[];
  invalidResultFiles: string[];
  defectTasks: number;
  cleanTasks: number;
  totals: {
    tp: number;
    fp: number;
    fn: number;
  };
  metrics: {
    precision: number | null;
    recall: number | null;
    f1: number | null;
  };
  fixValidation: {
    passed: number;
    failed: number;
    timedOut: number;
    notRun: number;
  };
  failures: EvaluationFailure[];
  tasks: SummaryTaskRow[];
}

export type LoadedResult =
  | { ok: true; data: TaskResult }
  | { ok: false; error: string };

export interface DashboardBundle {
  summary: BenchmarkSummary | null;
  summaryError: string | null;
  tasks: BenchmarkTask[];
  results: Record<string, LoadedResult>;
  candidates: Record<string, string | null>;
  readme: string;
}

export interface TaskView {
  definition: BenchmarkTask;
  result: TaskResult | null;
  resultError: string | null;
  candidateSource: string | null;
  summaryRow: SummaryTaskRow | null;
  isCleanControl: boolean;
  evaluationStatus: string;
  model: string | null;
}
