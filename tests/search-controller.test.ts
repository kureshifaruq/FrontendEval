import { describe, expect, it } from "vitest";
import { SearchController } from "../src/search-controller.js";

function deferred<T>() {
  let resolve!: (value: T) => void;

  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

describe("SearchController", () => {
  it("keeps the latest search results when responses arrive out of order", async () => {
    const controller = new SearchController();

    const apple = deferred<string[]>();
    const orange = deferred<string[]>();

    const oldSearch = controller.search("apple", () => apple.promise);
    const newSearch = controller.search("orange", () => orange.promise);

    orange.resolve(["orange result"]);
    await newSearch;

    apple.resolve(["apple result"]);
    await oldSearch;

    expect(controller.results).toEqual(["orange result"]);
  });
});