import { describe, it, expect } from "vitest";

describe("CI Failure Demonstration", () => {
  it("should correctly calculate the average movie rating", () => {
    const ratings = [8, 9, 10];

    const average =
      ratings.reduce((sum, rating) => sum + rating, 0) /
      ratings.length;

    expect(average).toBe(9);
  });
});