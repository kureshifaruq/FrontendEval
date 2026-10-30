export type Severity = "critical" | "high" | "medium" | "low";

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

export interface ModelReview {
  findings: Finding[];
  summary: string;
}

export interface GradeResult {
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number | null;
  recall: number | null;
  f1: number | null;
}