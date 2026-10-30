# FrontendEval — AI Frontend Code Review Evaluation

## Overview

FrontendEval is a TypeScript-based benchmark project for evaluating AI-generated frontend code reviews and proposed fixes.

It evaluates whether an AI reviewer can identify known frontend defects, avoid reporting defects in clean code, provide useful findings, and generate fixes that pass targeted validation tests.

The project uses deterministic grading and automated tests to make evaluation results reproducible and easier to inspect.

## Key Features

- **Frontend defect detection:** Evaluate AI findings against known defects.
- **Clean-code control:** Test whether the evaluator avoids reporting defects in code without a known issue.
- **Structured findings:** Validate AI responses and required finding fields.
- **Deterministic grading:** Calculate true positives, false positives, false negatives, precision, recall, and F1 score.
- **Candidate-fix validation:** Run targeted tests against proposed fixes.
- **Evaluation summaries:** Aggregate task results, failures, and fix-validation statuses.
- **Automated tests:** Use Vitest to test benchmark behavior and grading logic.

## Technology Stack

- TypeScript
- Node.js
- Vitest
- Gemini API integration
- Zod and TypeScript-based validation, where configured in the project

## Benchmark Tasks

| Task | Focus |
|---|---|
| FE-001 | Stale search results caused by an asynchronous race condition |
| FE-002 | Clean search filtering and false-positive prevention |
| FE-003 | Loading state not being reset after a failed request |
| FE-004 | Invalid partial numeric input being accepted |
| FE-005 | Icon-only button accessibility and accessible naming |

The benchmark currently contains five tasks. This is an initial evaluation dataset, not a comprehensive representation of all frontend code-review scenarios.

## Prerequisites

- Node.js compatible with the project's package configuration
- npm
- A valid Gemini API key for running model-based evaluations

## Setup

Install dependencies:

```bash
npm install
```

Configure your Gemini API key in a local `.env` file using the environment variable expected by the project.

**Security:** Never commit `.env` files, API keys, or other secrets.

## Run the Tests

Run the automated test suite:

```bash
npm test
```

Run the TypeScript check:

```bash
npm run check
```

Generate the benchmark summary from available evaluation results:

```bash
npm run summarize
```

## Run an Evaluation

Evaluate an individual benchmark task:

```bash
npm run evaluate -- FE-001
```

Replace `FE-001` with another supported task ID to evaluate a different task.

Model-based evaluation requires valid API credentials and may incur API usage costs.

## Evaluation Methodology

The evaluator compares AI-generated findings against expected benchmark defects.

The grading process considers:

- Whether the reported defect matches the expected defect and category.
- Whether the finding contains the required evidence.
- Whether a clean control incorrectly receives defect findings.
- The resulting true-positive, false-positive, and false-negative counts.
- Precision, recall, and F1 score where the relevant denominators are nonzero.
- Whether candidate fixes pass their targeted validation tests.

A proposed fix being saved is not equivalent to that fix passing validation. The summary distinguishes these outcomes.

## Initial Results

The initial five-task run reported:

| Metric | Result |
|---|---:|
| Tasks completed | 5 / 5 |
| Evaluation failures | 0 |
| True positives | 4 |
| False positives | 0 |
| False negatives | 0 |
| Precision | 100% |
| Recall | 100% |
| F1 score | 100% |
| Candidate-fix validations passed | 4 |
| Clean-control tasks | 1 |

These are preliminary results from a small benchmark. They demonstrate successful execution on the current tasks but do not establish general-purpose AI code-review accuracy.

The clean control has no known defect to detect, so precision, recall, and F1 are not applicable to that task in the current summary.

## Project Structure

- `src/` — Evaluation runner, grading logic, fixtures, and summary generation.
- `tests/` — Automated tests for benchmark behavior, grading, and candidate fixes.
- `dataset/` — Benchmark task definitions and supporting data.
- `results/` — Generated evaluation outputs, summaries, and candidate fixes.
- `package.json` — Project scripts and dependencies.

## Limitations and Future Work

The current benchmark contains only five tasks. Further development should expand coverage across realistic frontend defects, edge cases, framework-specific behavior, accessibility, asynchronous flows, and clean-code controls.

Evaluation quality should also be assessed across multiple model runs and a larger, independently reviewed dataset before making broad accuracy claims.

## Responsible Use

FrontendEval is an evaluation and experimentation project. Its scores should not be interpreted as proof that AI-generated code reviews or fixes are always correct, secure, or production-ready. Human review and appropriate testing remain necessary.