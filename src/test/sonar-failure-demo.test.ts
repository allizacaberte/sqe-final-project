import { describe, it, expect } from "vitest";
import { validateMovieRating } from "../lib/sonar-failure-demo";

describe("Movie Rating Validation", () => {
    it("accepts a valid movie rating", () => {
        expect(validateMovieRating(5)).toBe(true);
    });

    it("accepts minimum and maximum ratings", () => {
        expect(validateMovieRating(1)).toBe(true);
        expect(validateMovieRating(10)).toBe(true);
    });

    it("rejects ratings below the minimum", () => {
        expect(validateMovieRating(0)).toBe(false);
    });

    it("rejects ratings above the maximum", () => {
        expect(validateMovieRating(11)).toBe(false);
    });
});