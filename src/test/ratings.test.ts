import { beforeEach, describe, it, expect, vi } from "vitest";

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
  formatRuntime: vi.fn(() => "2h"),
  posterUrl: vi.fn(() => "/poster.jpg"),
}));

import { prisma } from "@/lib/prisma";
import type { TmdbMovie } from "@/lib/tmdb";

import {
  formatRating,
  withRatings,
  getTopPicks,
  getLatestReviews,
} from "../lib/ratings";

const movie: TmdbMovie = {
  id: 101,
  title: "Test Movie",
  year: 2026,
  ageRating: "PG",
  duration: "2h",
  runtimeMin: 120,
  poster: "/poster.jpg",
  posterPath: "/poster.jpg",
  releaseDate: null,
  genres: [],
  director: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

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

describe("Movie Rating Calculation", () => {
  it("calculates the average rating from multiple reviews", async () => {
    vi.mocked(prisma.movie.findMany).mockResolvedValueOnce([
      {
        tmdbId: 101,
        reviews: [{ rating: 8 }, { rating: 6 }, { rating: 10 }],
      },
    ] as never);

    const result = await withRatings([movie]);

    expect(result).toEqual([
      {
        ...movie,
        rating: 8,
        reviewCount: 3,
      },
    ]);
  });

  it("returns null when a movie has no reviews", async () => {
    vi.mocked(prisma.movie.findMany).mockResolvedValueOnce([
      {
        tmdbId: 101,
        reviews: [],
      },
    ] as never);

    const result = await withRatings([movie]);

    expect(result[0].rating).toBeNull();
    expect(result[0].reviewCount).toBe(0);
  });

  it("handles movies not yet stored in the database", async () => {
    vi.mocked(prisma.movie.findMany).mockResolvedValueOnce([]);

    const result = await withRatings([movie]);

    expect(result[0].rating).toBeNull();
    expect(result[0].reviewCount).toBe(0);
  });

  it("handles an empty movie list", async () => {
    vi.mocked(prisma.movie.findMany).mockResolvedValueOnce([]);

    expect(await withRatings([])).toEqual([]);
  });

  it("queries ratings using the supplied movie IDs", async () => {
    vi.mocked(prisma.movie.findMany).mockResolvedValueOnce([]);

    await withRatings([movie, { ...movie, id: 102 }]);

    expect(prisma.movie.findMany).toHaveBeenCalledWith({
      where: {
        tmdbId: {
          in: [101, 102],
        },
      },
      select: {
        tmdbId: true,
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });
  });
});

describe("Top Rated Movies", () => {
  it("returns an empty list when no ranked movies exist", async () => {
    vi.mocked(prisma.review.groupBy).mockResolvedValueOnce([]);

    expect(await getTopPicks()).toEqual([]);
    expect(prisma.movie.findMany).not.toHaveBeenCalled();
  });

  it("returns ranked movies with their average ratings", async () => {
    vi.mocked(prisma.review.groupBy).mockResolvedValueOnce([
      {
        movieId: 1,
        _avg: { rating: 9 },
        _count: { rating: 5 },
      },
    ] as never);

    vi.mocked(prisma.movie.findMany).mockResolvedValueOnce([
      {
        id: 1,
        tmdbId: 101,
        title: "Test Movie",
        releaseYear: 2026,
        ageRating: "PG",
        runtimeMin: 120,
        posterPath: "/poster.jpg",
      },
    ] as never);

    const result = await getTopPicks();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 101,
      title: "Test Movie",
      rating: 9,
      reviewCount: 5,
      ageRating: "PG",
      duration: "2h",
    });
  });

  it("uses NR when the age rating is missing", async () => {
    vi.mocked(prisma.review.groupBy).mockResolvedValueOnce([
      {
        movieId: 1,
        _avg: { rating: 8 },
        _count: { rating: 2 },
      },
    ] as never);

    vi.mocked(prisma.movie.findMany).mockResolvedValueOnce([
      {
        id: 1,
        tmdbId: 101,
        title: "Test Movie",
        releaseYear: 2026,
        ageRating: null,
        runtimeMin: 120,
        posterPath: "/poster.jpg",
      },
    ] as never);

    const result = await getTopPicks();

    expect(result[0].ageRating).toBe("NR");
  });

  it("skips ranked movies missing from the database", async () => {
    vi.mocked(prisma.review.groupBy).mockResolvedValueOnce([
      {
        movieId: 99,
        _avg: { rating: 9 },
        _count: { rating: 3 },
      },
    ] as never);

    vi.mocked(prisma.movie.findMany).mockResolvedValueOnce([]);

    expect(await getTopPicks()).toEqual([]);
  });

  it("requests the specified limit and ranking order", async () => {
    vi.mocked(prisma.review.groupBy).mockResolvedValueOnce([]);

    await getTopPicks(3);

    expect(prisma.review.groupBy).toHaveBeenCalledWith({
      by: ["movieId"],
      _avg: { rating: true },
      _count: { rating: true },
      orderBy: [
        { _avg: { rating: "desc" } },
        { _count: { rating: "desc" } },
      ],
      take: 3,
    });
  });
});

describe("Latest Reviews", () => {
  it("retrieves the four latest reviews by default", async () => {
    vi.mocked(prisma.review.findMany).mockResolvedValueOnce([]);

    await getLatestReviews();

    expect(prisma.review.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        user: {
          select: { name: true },
        },
        movie: {
          select: {
            tmdbId: true,
            title: true,
            posterPath: true,
            releaseYear: true,
          },
        },
      },
    });
  });

  it("supports a custom review limit", async () => {
    vi.mocked(prisma.review.findMany).mockResolvedValueOnce([]);

    await getLatestReviews(10);

    expect(prisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        orderBy: { createdAt: "desc" },
      }),
    );
  });

  it("returns an empty list when no reviews exist", async () => {
    vi.mocked(prisma.review.findMany).mockResolvedValueOnce([]);

    expect(await getLatestReviews()).toEqual([]);
  });
});