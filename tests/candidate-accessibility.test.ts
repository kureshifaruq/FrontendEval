
import { describe, expect, it } from "vitest";
import { createSearchButtonMarkup } from "../results/FE-005-candidate.js";

describe("AI-generated fix: FE-005", () => {
  it("gives the icon-only button an accessible name", () => {
    const markup = createSearchButtonMarkup();

    expect(markup).toMatch(
      /<button\b[^>]*\baria-label\s*=\s*["']Search["']/i
    );
  });
});
  