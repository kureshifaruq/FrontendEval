
import { describe, expect, it } from "vitest";
import { BuggySearchController } from "../results/FE-001-candidate.js";

function deferred<T>() {
  let resolve!: (value: T) => void;

  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

describe("AI-generated fix: FE-001", () => {
  it("keeps the latest results when the older request finishes last", async () => {
    const controller = new BuggySearchController();
    const apple = deferred<string[]>();
    const orange = deferred<string[]>();

    const appleSearch = controller.search("apple", () => apple.promise);
    const orangeSearch = controller.search("orange", () => orange.promise);

    orange.resolve(["orange result"]);
    await orangeSearch;

    apple.resolve(["apple result"]);
    await appleSearch;

    expect(controller.results).toEqual(["orange result"]);
  });

  it("accepts the latest results when they arrive last", async () => {
    const controller = new BuggySearchController();
    const apple = deferred<string[]>();
    const orange = deferred<string[]>();

    const appleSearch = controller.search("apple", () => apple.promise);
    const orangeSearch = controller.search("orange", () => orange.promise);

    apple.resolve(["apple result"]);
    await appleSearch;

    orange.resolve(["orange result"]);
    await orangeSearch;

    expect(controller.results).toEqual(["orange result"]);
  });
});
