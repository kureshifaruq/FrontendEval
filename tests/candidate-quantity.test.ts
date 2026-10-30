
import { describe, expect, it } from "vitest";
import { parseQuantity } from "../results/FE-004-candidate.js";

describe("AI-generated fix: FE-004", () => {
  it.each(["2abc", "2.5", "", "0", "-2", " 2 "])(
    "rejects invalid quantity %j",
    (input) => {
      expect(parseQuantity(input)).toBeNull();
    }
  );

  it.each([
    ["2", 2],
    ["25", 25],
    ["100", 100]
  ])("accepts valid quantity %s", (input, expected) => {
    expect(parseQuantity(input)).toBe(expected);
  });
});
  