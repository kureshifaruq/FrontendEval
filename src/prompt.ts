
import type { BenchmarkTask } from "./types.js";

export function buildReviewPrompt(
  task: BenchmarkTask,
  source: string
): string {
  return `
You are an expert senior frontend engineer reviewing code for production defects.

Task: ${task.title}
Category: ${task.category}

Requirements:
${task.prompt}

Review the following source code:
\`\`\`typescript
${source}
\`\`\`

Return one valid JSON object using this structure:
{
  "summary": "Brief review summary",
  "findings": [
    {
      "category": "defect category",
      "severity": "critical | high | medium | low",
      "explanation": "Why the code fails, with evidence from the source",
      "recommendation": "A specific correction"
    }
  ],
  "proposedFix": {
    "explanation": "What the proposed fix changes and why",
    "sourceCode": "The complete corrected source file as a string"
  }
}

Rules:
- Report only actionable, evidence-based defects.
- Do not invent problems or report stylistic preferences as defects.
- Return an empty findings array if no defect is present.
- If a real defect exists, provide a complete corrected version of the source file in proposedFix.sourceCode.
- Preserve existing behavior, interfaces, and types unless a change is necessary to fix the defect.
- Do not include unrelated refactoring or dependencies.
- If the source is already correct, set proposedFix to null.
- Do not claim that tests passed unless you actually ran them.
- Escape newlines, quotation marks, and backslashes correctly inside JSON strings.
- Return valid JSON only, without Markdown fences or additional commentary.
`.trim();
}
