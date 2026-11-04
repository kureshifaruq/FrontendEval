# FrontendEval — AI Frontend Code Review Evaluation

## 1. Project Overview

FrontendEval is a TypeScript-based evaluation benchmark designed to assess how effectively AI models identify frontend defects, explain their findings, and propose code fixes that pass automated tests.

AI-generated code reviews can sound convincing while missing real defects, reporting issues that do not exist, or proposing fixes that introduce regressions. FrontendEval addresses this problem by evaluating model findings against expected defects and validating proposed fixes through executable tests.

**Domain:** AI evaluation, frontend engineering, automated code review, and software quality.

**Primary goal:** Measure whether AI-generated frontend code reviews are accurate, evidence-based, and supported by working fixes.

## 2. What It Evaluates

The benchmark currently contains five tasks:

| Task | Evaluation target |
|---|---|
| FE-001 | Asynchronous search race conditions and stale results |
| FE-002 | Clean search filtering and false-positive control |
| FE-003 | Loading-state recovery after a failed request |
| FE-004 | Numeric input validation |
| FE-005 | Accessible names for icon-only buttons |

The tasks cover realistic frontend engineering problems involving correctness, asynchronous behavior, validation, and accessibility.

## 3. Evaluation Methodology

FrontendEval evaluates an AI model's ability to identify actionable frontend defects, avoid false positives, and propose corrections that pass task-specific automated tests.

### Benchmark Tasks

The benchmark contains five tasks:

- **FE-001 — Stale search results:** Detects asynchronous race conditions where an older search response can overwrite newer results.
- **FE-002 — Clean search filtering:** Acts as a negative control to test whether the model reports defects in code without a predefined defect.
- **FE-003 — Loading state stuck after failure:** Tests asynchronous loading and error-state handling.
- **FE-004 — Partial numeric input accepted:** Tests whether malformed numeric input is rejected rather than partially parsed.
- **FE-005 — Icon-only button lacks accessible name:** Tests detection of an accessibility issue involving an icon-only button.

### Scoring

The evaluator compares model-generated findings against predefined expected defects. Matching considers defect categories, defect IDs when provided, and required evidence phrases configured in the dataset.

It calculates true positives (TP), false positives (FP), and false negatives (FN), then derives precision, recall, and F1 where applicable.

This is a deterministic, rule-based grading approach. It is reproducible and inspectable, but it does not provide a complete semantic assessment of every finding.

### Proposed-Fix Validation

When the model provides a proposed fix, the evaluation runner saves the corrected source and runs the configured Vitest test file for that task. Candidate-test execution has a 60-second timeout.

The recorded validation status indicates whether the configured tests passed, failed, or timed out. Passing these tests does not independently establish that a fix is correct in every production scenario.

### Results

The recorded benchmark run used `gemini-3.8-flash` and completed all five tasks without evaluation failures.

Across the four tasks with predefined defects, the results were:

- True positives: 4
- False positives: 0
- False negatives: 0
- Precision: 100%
- Recall: 100%
- F1 score: 100%

All four proposed fixes passed their configured validation tests. The clean-code control produced no findings, and fix validation was not run for that task.

These results describe one recorded run on a small, purpose-built dataset. They should not be interpreted as proof of equivalent performance on larger or more diverse frontend codebases.

### Limitations and Future Work

The benchmark currently contains only five tasks, so its results may not generalize to other defect categories, frameworks, or real-world repositories.

The grader relies on category matching and configured evidence phrases. It may reject a valid finding expressed in different words or accept a finding that contains the required phrases without fully demonstrating the expected reasoning.

Future improvements could include a larger and more diverse dataset, additional adversarial negative controls, stricter response-schema validation, more extensive fix validation, and an independent assessment of grading reliability.

## 4. Current Results

The latest recorded benchmark summary reports:

| Metric | Result |
|---|---:|
| Tasks completed | 5/5 |
| Evaluation failures | 0 |
| True positives | 4 |
| False positives | 0 |
| False negatives | 0 |
| Precision | 100% |
| Recall | 100% |
| F1 score | 100% |
| Proposed fixes passing validation | 4 |
| Proposed fixes failing validation | 0 |
| Fix validations not run | 1 |

These classification metrics are calculated across the four defect tasks. The clean-code control is reported separately because its precision, recall, and F1 metrics are not applicable in the same way.

**Important limitation:** These are preliminary results from a small five-task benchmark, not evidence that AI code reviews achieve 100% accuracy on real-world frontend code. A larger and more diverse dataset is needed to establish broader reliability.

## 5. Technology Stack

- TypeScript
- Node.js
- Vitest
- Google Gemini API integration
- Automated candidate-fix validation

The evaluation engine runs locally. The saved results can be inspected without rerunning model evaluations.

## 6. Prerequisites

Install:

- Node.js and npm
- A Gemini API key if you intend to run new AI evaluations

The project was previously verified with:

- Node.js: `v22.22.0`
- npm: `10.9.4`
- Model ID recorded in the results: `gemini-3.8-flash`

Use the model ID and configuration recorded in the actual result files when reproducing an evaluation.

## 7. Installation and Configuration

Clone the repository and open its directory.

Install dependencies:

```bash
npm install
```

Create your local environment file using `.env.example` as a reference. Set your own API key in `.env`:

```dotenv
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-3.8-flash
```

Never commit your real API key or include it in the submission ZIP.

## 8. Running the Project

Run the automated tests:

```bash
npm test
```

Run the TypeScript check:

```bash
npm run check
```

Generate the benchmark summary from saved evaluation results:

```bash
npm run summarize
```

Run an individual evaluation:

```bash
npm run evaluate -- FE-001
```

Running a new evaluation requires a valid API key and may incur API usage charges. Generating a summary from existing results does not require a new model evaluation.

## 9. Recorded Results and Reproducibility

The benchmark stores task-level results and an aggregate summary as JSON files.

These records help reviewers inspect the findings, scoring outcomes, fix-validation results, model configuration, and evaluation timestamps.

For reproducibility, the submission should include the task definitions, expected findings or grading criteria, grading logic, automated tests, relevant saved results, dependency manifests, and `.env.example`.

The exact evaluation date and configuration should be read from the included result files rather than inferred from the submission date.

## 10. Limitations and Future Improvements

Current limitations include:

- Only five benchmark tasks are available.
- The task set does not represent the full range of frontend defects.
- Rule-based evidence matching can reject valid findings expressed with different wording.
- A matching phrase does not necessarily prove that a finding is semantically correct.
- Results from a small benchmark may not generalize to other models, repositories, or production applications.

Future improvements include expanding the dataset, adding more difficult edge cases, evaluating multiple models and repeated runs, improving semantic grading, and measuring grader agreement against human-reviewed findings.

## 11. AI Assistance and Prior Work Disclosure

AI assistance was used during project development for planning, implementation guidance, debugging, testing, and documentation.

The benchmark was implemented and tested locally, and its results were examined using the project's automated evaluation and validation process.

The reported results are limited to the included tasks and recorded runs. No claim is made that the benchmark establishes universal AI code-review accuracy.

Any additional third-party code, datasets, libraries, or other sources used in the final project should be identified and attributed as appropriate.

## 12. Video Walkthrough

**Video walkthrough:** [Watch FrontendEval Demo](https://drive.google.com/file/d/1-VTXVdf5PygHHripNVzsVpsmk4LGlyZe/view?usp=sharing)

The walkthrough should explain:

1. The problem FrontendEval addresses.
2. The five benchmark tasks and why they matter.
3. How findings are graded and proposed fixes are tested.
4. What the current results demonstrate.
5. The limitations of the benchmark and its grader.

The final video should be no longer than five minutes and accessible to reviewers without requiring special access.

## 13. Dashboard

The React dashboard in `dashboard/` displays saved evaluation results, benchmark metrics, task-level findings, and fix-validation outcomes. It reads files from `results/` and `dataset/tasks.json` through a local Vite development middleware. Opening the dashboard does not call Gemini or rerun evaluations.

From the `dashboard/` directory:

```bash
npm install
npm run dev
```

Then open the printed local URL. The data server is read-only and restricted to the allowlisted project files. Do not point the browser at `../../results/...` paths.

## 14. Responsible Interpretation

FrontendEval is an experimental evaluation benchmark. Its results should be interpreted in the context of its small dataset and rule-based grading methodology.

AI-generated findings and fixes still require engineering judgment and appropriate testing before use in production software.