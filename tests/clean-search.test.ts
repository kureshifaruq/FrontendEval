import { describe, expect, it } from "vitest";
import { filterSearchResults } from "../src/fixtures/clean-search.js";

describe("FrontendEval: clean-code control", () => {
  it("filters results correctly without introducing unrelated behavior", () => {
    const results = ["Apple", "Orange", "Pineapple"];

    expect(filterSearchResults(results, "  APPLE ")).toEqual([
      "Apple",
      "Pineapple"
    ]);
  });

  it("returns no matches for an absent query", () => {
    expect(filterSearchResults(["Apple", "Orange"], "banana")).toEqual([]);
  });

  it("returns all results for an empty query", () => {
    expect(filterSearchResults(["Apple", "Orange"], "")).toEqual([
      "Apple",
      "Orange"
    ]);
  });
});