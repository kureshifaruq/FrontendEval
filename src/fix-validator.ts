
import { SearchController } from "./search-controller.js";

interface ValidationCheck {
  name: string;
  passed: boolean;
  expected: string[];
  actual: string[];
}

export interface FixValidationResult {
  taskId: string;
  fixValidation: {
    passed: boolean;
    acceptanceTestsPassed: number;
    acceptanceTestsTotal: number;
    regressionsDetected: number;
    checks: ValidationCheck[];
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;

  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

export async function validateSearchFix(): Promise<FixValidationResult> {
  const checks: ValidationCheck[] = [];

  // Check 1: Older request finishes before the latest request.
  {
    const controller = new SearchController();
    const apple = deferred<string[]>();
    const orange = deferred<string[]>();

    const appleSearch = controller.search("apple", () => apple.promise);
    const orangeSearch = controller.search("orange", () => orange.promise);

    apple.resolve(["apple result"]);
    await appleSearch;

    orange.resolve(["orange result"]);
    await orangeSearch;

    const expected = ["orange result"];
    const actual = controller.results;

    checks.push({
      name: "latest-response-wins-when-it-arrives-last",
      passed: JSON.stringify(actual) === JSON.stringify(expected),
      expected,
      actual
    });
  }

  // Check 2: Older request finishes after the latest request.
  {
    const controller = new SearchController();
    const apple = deferred<string[]>();
    const orange = deferred<string[]>();

    const appleSearch = controller.search("apple", () => apple.promise);
    const orangeSearch = controller.search("orange", () => orange.promise);

    orange.resolve(["orange result"]);
    await orangeSearch;

    apple.resolve(["apple result"]);
    await appleSearch;

    const expected = ["orange result"];
    const actual = controller.results;

    checks.push({
      name: "stale-response-cannot-overwrite-latest-results",
      passed: JSON.stringify(actual) === JSON.stringify(expected),
      expected,
      actual
    });
  }

  const acceptanceTestsPassed = checks.filter(
    (check) => check.passed
  ).length;

  const acceptanceTestsTotal = checks.length;

  return {
    taskId: "FE-001",
    fixValidation: {
      passed: acceptanceTestsPassed === acceptanceTestsTotal,
      acceptanceTestsPassed,
      acceptanceTestsTotal,
      regressionsDetected: checks.filter(
        (check) => !check.passed
      ).length,
      checks
    }
  };
}
