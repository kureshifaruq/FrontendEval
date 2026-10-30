import type {
  ExpectedDefect,
  Finding,
  GradeResult,
} from "./types.js";

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function containsRequiredEvidence(
  defect: ExpectedDefect,
  finding: Finding,
): boolean {
  const groups = defect.evidenceGroups;

  // Evidence requirements must be configured in the dataset.
  // Until then, retain compatibility with existing tasks.
  if (!groups || groups.length === 0) {
    return true;
  }

  const evidence = normalizeText(
    `${finding.explanation} ${finding.recommendation}`,
  );

  return groups.every((group) =>
    group.some((phrase) => {
      const normalizedPhrase = normalizeText(phrase);
      return (
        normalizedPhrase.length > 0 &&
        evidence.includes(normalizedPhrase)
      );
    }),
  );
}

export function gradeReview(
  expected: ExpectedDefect[],
  findings: Finding[],
): GradeResult {
  const matchedExpected = new Set<number>();
  const matchedFindings = new Set<number>();

  for (let i = 0; i < findings.length; i++) {
    const finding = findings[i];

    for (let j = 0; j < expected.length; j++) {
      if (matchedExpected.has(j)) continue;

      const defect = expected[j];

      const categoryMatches =
        finding.category === defect.category;

      const identityMatches =
        finding.defectId !== undefined
          ? finding.defectId === defect.id && categoryMatches
          : categoryMatches;

      if (
        identityMatches &&
        containsRequiredEvidence(defect, finding)
      ) {
        matchedExpected.add(j);
        matchedFindings.add(i);
        break;
      }
    }
  }

  const truePositives = matchedExpected.size;
  const falsePositives = findings.length - matchedFindings.size;
  const falseNegatives = expected.length - matchedExpected.size;

  const precision =
    truePositives + falsePositives === 0
      ? null
      : truePositives / (truePositives + falsePositives);

  const recall =
    truePositives + falseNegatives === 0
      ? null
      : truePositives / (truePositives + falseNegatives);

  const f1 =
    precision === null || recall === null
      ? null
      : precision + recall === 0
        ? 0
        : (2 * precision * recall) / (precision + recall);

  return {
    truePositives,
    falsePositives,
    falseNegatives,
    precision,
    recall,
    f1,
  };
}