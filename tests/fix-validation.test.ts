
import { describe, expect, it } from "vitest";
import { SearchController } from "../src/search-controller.js";

function deferred<T>() {
  let resolve!: (value: T) => void;

  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

describe("FrontendEval: fix validation", () => {
  it("accepts a fix that preserves the latest search results", async () => {
    const controller = new SearchController();

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

  it("preserves results when the latest request completes first", async () => {
    const controller = new SearchController();

    const first = deferred<string[]>();
    const second = deferred<string[]>();

    const firstSearch = controller.search("first", () => first.promise);
    const secondSearch = controller.search("second", () => second.promise);

    second.resolve(["second result"]);
    await secondSearch;

    first.resolve(["first result"]);
    await firstSearch;

    expect(controller.results).toEqual(["second result"]);
  });
});
