import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    movie: {
      findMany: vi.fn(),
    },
    review: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/tmdb", () => ({
  formatRuntime: vi.fn(),
  posterUrl: vi.fn(),
}));

import { formatRating } from "../lib/ratings";

describe("Movie Rating Formatting", () => {
  it("formats a valid movie rating", () => {
    expect(formatRating(7.5)).toBe("7.5/10");
  });

  it("rounds a rating to one decimal place", () => {
    expect(formatRating(8.76)).toBe("8.8/10");
  });

  it("displays No ratings when no reviews exist", () => {
    expect(formatRating(null)).toBe("No ratings");
  });

  it("formats the minimum rating boundary", () => {
    expect(formatRating(0)).toBe("0.0/10");
  });

  it("formats the maximum rating boundary", () => {
    expect(formatRating(10)).toBe("10.0/10");
  });
});