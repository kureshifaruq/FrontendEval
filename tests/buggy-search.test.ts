import { describe, expect, it } from "vitest";
import { BuggySearchController } from "../src/fixtures/buggy-search.js";

function deferred<T>() {
  let resolve!: (value: T) => void;

  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

describe("FrontendEval: stale search results", () => {
  it("reproduces the bug when an older response arrives last", async () => {
    const controller = new BuggySearchController();

    const oldRequest = deferred<string[]>();
    const newRequest = deferred<string[]>();

    // The user searches for apple first.
    const oldSearch = controller.search(
      "apple",
      () => oldRequest.promise
    );

    // Then the user searches for orange.
    const newSearch = controller.search(
      "orange",
      () => newRequest.promise
    );

    // Orange responds first.
    newRequest.resolve(["orange result"]);
    await newSearch;

    expect(controller.results).toEqual(["orange result"]);

    // Apple responds later and incorrectly overwrites orange.
    oldRequest.resolve(["apple result"]);
    await oldSearch;

    // This assertion documents the existing bug.
    expect(controller.results).toEqual(["apple result"]);
  });
});