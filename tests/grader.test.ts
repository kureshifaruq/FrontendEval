
import { describe, expect, it } from "vitest";
import { gradeReview } from "../src/grader.js";
import type { ExpectedDefect, Finding } from "../src/types.js";

const expected: ExpectedDefect[] = [
  {
    id: "D1",
    category: "async-race-condition",
    severity: "high",
    expectedBehavior: "Only the latest request updates results.",
    evidenceGroups: [
      [
        "older response",
        "stale response",
        "outdated response",
        "earlier (stale) result",
        "stale result",
      ],
      [
        "overwrite newer results",
        "overwrite the latest results",
        "replace newer results",
        "overwrite the newer result",
        "overwrite the newer results",
      ],
    ],

  },
];

describe("FrontendEval grader", () => {
  it("scores a correct finding", () => {
    const findings: Finding[] = [
      {
        defectId: "D1",
        category: "async-race-condition",
        severity: "high",
        explanation: "An older response can overwrite newer results.",
        recommendation: "Ignore responses from outdated requests."
      }
    ];

    expect(gradeReview(expected, findings)).toEqual({
      truePositives: 1,
      falsePositives: 0,
      falseNegatives: 0,
      precision: 1,
      recall: 1,
      f1: 1
    });
  });

  it("penalizes a missed defect", () => {
    expect(gradeReview(expected, [])).toEqual({
      truePositives: 0,
      falsePositives: 0,
      falseNegatives: 1,
      precision: null,
      recall: 0,
      f1: null
    });
  });

  it("penalizes an unrelated finding", () => {
    const findings: Finding[] = [
      {
        category: "memory-leak",
        severity: "medium",
        explanation: "A listener might leak.",
        recommendation: "Remove the listener."
      }
    ];

    expect(gradeReview(expected, findings)).toEqual({
      truePositives: 0,
      falsePositives: 1,
      falseNegatives: 1,
      precision: 0,
      recall: 0,
      f1: 0
    });
  });

  it("rejects an incorrect category even when the defect ID matches", () => {
    const findings: Finding[] = [
      {
        defectId: "D1",
        category: "unrelated-problem",
        severity: "low",
        explanation: "There may be a formatting issue.",
        recommendation: "Rename the variable."
      }
    ];

    expect(gradeReview(expected, findings)).toEqual({
      truePositives: 0,
      falsePositives: 1,
      falseNegatives: 1,
      precision: 0,
      recall: 0,
      f1: 0
    });
  });

  it("handles a correct clean-code review", () => {
    expect(gradeReview([], [])).toEqual({
      truePositives: 0,
      falsePositives: 0,
      falseNegatives: 0,
      precision: null,
      recall: null,
      f1: null
    });
  });

  it("penalizes false positives on clean code", () => {
    const findings: Finding[] = [
      {
        category: "memory-leak",
        severity: "medium",
        explanation: "A listener might leak.",
        recommendation: "Remove the listener."
      }
    ];

    expect(gradeReview([], findings)).toEqual({
      truePositives: 0,
      falsePositives: 1,
      falseNegatives: 0,
      precision: 0,
      recall: null,
      f1: null
    });
  });

  it("rejects a matching category with unrelated evidence", () => {
    const findings: Finding[] = [
      {
        defectId: "D1",
        category: "async-race-condition",
        severity: "high",
        explanation: "The button color is inconsistent.",
        recommendation: "Change the CSS styling.",
      },
    ];

    expect(gradeReview(expected, findings)).toEqual({
      truePositives: 0,
      falsePositives: 1,
      falseNegatives: 1,
      precision: 0,
      recall: 0,
      f1: 0,
    });
  });

  it("accepts a realistic finding about stale search results", () => {
    const realisticFinding: Finding[] = [
      {
        defectId: "D1",
        category: "async-race-condition",
        severity: "high",
        explanation:
          "If consecutive searches are initiated, the earlier (stale) result will overwrite the newer result.",
        recommendation:
          "Only update the results if the resolving request matches the latest initiated request ID.",
      },
    ];

    expect(gradeReview(expected, realisticFinding)).toEqual({
      truePositives: 1,
      falsePositives: 0,
      falseNegatives: 0,
      precision: 1,
      recall: 1,
      f1: 1,
    });
  });

  it("does not match a finding with an incorrect defect ID", () => {
    const result = gradeReview(
      [
        {
          id: "D-001",
          category: "async-race-condition",
          severity: "high",
          expectedBehavior: "Ignore stale responses",
          evidenceGroups: [["stale response"]],
        },
      ],
      [
        {
          defectId: "WRONG-ID",
          category: "async-race-condition",
          severity: "high",
          explanation: "An older stale response can overwrite newer results.",
          recommendation: "Ignore the stale response.",
        },
      ],
    );
  
    expect(result.truePositives).toBe(0);
    expect(result.falsePositives).toBe(1);
    expect(result.falseNegatives).toBe(1);
  });
  
  it("does not match a finding with an empty defect ID", () => {
    const result = gradeReview(
      [
        {
          id: "D-001",
          category: "async-race-condition",
          severity: "high",
          expectedBehavior: "Ignore stale responses",
          evidenceGroups: [["stale response"]],
        },
      ],
      [
        {
          defectId: "",
          category: "async-race-condition",
          severity: "high",
          explanation: "An older stale response can overwrite newer results.",
          recommendation: "Ignore the stale response.",
        },
      ],
    );
  
    expect(result.truePositives).toBe(0);
    expect(result.falsePositives).toBe(1);
    expect(result.falseNegatives).toBe(1);
  });

});
