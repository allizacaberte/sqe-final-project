import {
  beforeEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    movie: {
      upsert: vi.fn(),
    },
    review: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/tmdb", () => ({
  getMovie: vi.fn(),
}));

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getMovie, type TmdbMovie } from "@/lib/tmdb";

import { saveReview, deleteReview } from "../lib/reviews";

const testUser = {
  id: "user-101",
  name: "Test User",
  email: "test@example.com",
};

const testMovie: TmdbMovie = {
  id: 101,
  title: "Test Movie",
  year: 2026,
  ageRating: "PG",
  duration: "2h 0m",
  runtimeMin: 120,
  poster: "/poster.jpg",
  posterPath: "/poster.jpg",
  releaseDate: "2026-01-15",
  genres: [],
  director: null,
};

const storedMovie = {
  id: "movie-101",
  tmdbId: 101,
  title: "Test Movie",
};

function reviewForm(
  overrides: Record<string, string> = {},
) {
  const form = new FormData();

  const values = {
    tmdbId: "101",
    rating: "8",
    body: "This is a great movie!",
    ...overrides,
  };

  for (const [key, value] of Object.entries(values)) {
    form.set(key, value);
  }

  return form;
}

beforeEach(() => {
  vi.resetAllMocks();

  vi.mocked(getCurrentUser).mockResolvedValue(
    testUser as never,
  );

  vi.mocked(getMovie).mockResolvedValue(testMovie);

  vi.mocked(prisma.movie.upsert).mockResolvedValue(
    storedMovie as never,
  );

  vi.mocked(prisma.review.upsert).mockResolvedValue(
    {} as never,
  );

  vi.mocked(prisma.review.deleteMany).mockResolvedValue({
    count: 1,
  });

  vi.mocked(redirect).mockImplementation(() => {
    throw new Error("NEXT_REDIRECT");
  });
});

describe("Review Authentication", () => {
  it("redirects unauthenticated users to login", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null);

    await expect(
      saveReview(null, reviewForm()),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/login");
    expect(getMovie).not.toHaveBeenCalled();
    expect(prisma.review.upsert).not.toHaveBeenCalled();
  });

  it("prevents unauthenticated users from deleting reviews", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null);

    await expect(
      deleteReview("review-101"),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/login");
    expect(prisma.review.deleteMany).not.toHaveBeenCalled();
  });
});

describe("Review Rating Validation", () => {
  it.each(["0", "-1", "11", "100", "5.5", "abc", ""])(
    "rejects invalid rating '%s'",
    async (rating) => {
      const result = await saveReview(
        null,
        reviewForm({ rating }),
      );

      expect(result).toEqual({
        error: "Pick a rating from 1 to 10.",
      });

      expect(getMovie).not.toHaveBeenCalled();
      expect(prisma.review.upsert).not.toHaveBeenCalled();
    },
  );

  it("rejects a missing rating field", async () => {
    const form = reviewForm();
    form.delete("rating");

    expect(await saveReview(null, form)).toEqual({
      error: "Pick a rating from 1 to 10.",
    });
  });

  it.each(["1", "10"])(
    "accepts boundary rating %s",
    async (rating) => {
      await expect(
        saveReview(null, reviewForm({ rating })),
      ).rejects.toThrow("NEXT_REDIRECT");

      expect(prisma.review.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            rating: Number(rating),
          }),
        }),
      );
    },
  );
});

describe("Review Body Validation", () => {
  it.each(["", " ", "Hi", "  Hi  "])(
    "rejects a short or empty review '%s'",
    async (body) => {
      const result = await saveReview(
        null,
        reviewForm({ body }),
      );

      expect(result).toEqual({
        error: "Write a few words for your review.",
      });

      expect(prisma.review.upsert).not.toHaveBeenCalled();
    },
  );

  it("rejects a missing review body", async () => {
    const form = reviewForm();
    form.delete("body");

    expect(await saveReview(null, form)).toEqual({
      error: "Write a few words for your review.",
    });
  });

  it("rejects reviews longer than 2000 characters", async () => {
    const result = await saveReview(
      null,
      reviewForm({ body: "a".repeat(2001) }),
    );

    expect(result).toEqual({
      error: "Keep your review under 2000 characters.",
    });

    expect(prisma.review.upsert).not.toHaveBeenCalled();
  });

  it("accepts the minimum review length", async () => {
    await expect(
      saveReview(null, reviewForm({ body: "Good" })),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(prisma.review.upsert).toHaveBeenCalled();
  });

  it("accepts a review with exactly 2000 characters", async () => {
    await expect(
      saveReview(
        null,
        reviewForm({ body: "a".repeat(2000) }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(prisma.review.upsert).toHaveBeenCalled();
  });

  it("trims unnecessary whitespace from reviews", async () => {
    await expect(
      saveReview(
        null,
        reviewForm({ body: "  Great movie!  " }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(prisma.review.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {
          rating: 8,
          body: "Great movie!",
        },
      }),
    );
  });
});

describe("Movie Validation", () => {
  it("rejects a review for an unavailable movie", async () => {
    vi.mocked(getMovie).mockResolvedValueOnce(null);

    const result = await saveReview(
      null,
      reviewForm({ tmdbId: "999" }),
    );

    expect(result).toEqual({
      error: "That movie couldn't be found.",
    });

    expect(getMovie).toHaveBeenCalledWith(999);
    expect(prisma.movie.upsert).not.toHaveBeenCalled();
    expect(prisma.review.upsert).not.toHaveBeenCalled();
  });

  it("retrieves movie details using the submitted ID", async () => {
    await expect(
      saveReview(null, reviewForm()),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(getMovie).toHaveBeenCalledWith(101);
  });
});

describe("Saving Movie Reviews", () => {
  it("saves or refreshes the movie information", async () => {
    await expect(
      saveReview(null, reviewForm()),
    ).rejects.toThrow("NEXT_REDIRECT");

    const expectedMovieData = {
      title: "Test Movie",
      releaseYear: 2026,
      runtimeMin: 120,
      ageRating: "PG",
      posterPath: "/poster.jpg",
      syncedAt: expect.any(Date),
    };

    expect(prisma.movie.upsert).toHaveBeenCalledWith({
      where: { tmdbId: 101 },
      create: {
        tmdbId: 101,
        ...expectedMovieData,
      },
      update: expectedMovieData,
    });
  });

  it("creates a review associated with the current user", async () => {
    await expect(
      saveReview(null, reviewForm()),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(prisma.review.upsert).toHaveBeenCalledWith({
      where: {
        userId_movieId: {
          userId: "user-101",
          movieId: "movie-101",
        },
      },
      create: {
        userId: "user-101",
        movieId: "movie-101",
        rating: 8,
        body: "This is a great movie!",
      },
      update: {
        rating: 8,
        body: "This is a great movie!",
      },
    });
  });

  it("uses the same user and movie key when updating a review", async () => {
    await expect(
      saveReview(
        null,
        reviewForm({
          rating: "9",
          body: "Updated movie review.",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(prisma.review.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_movieId: {
            userId: "user-101",
            movieId: "movie-101",
          },
        },
        update: {
          rating: 9,
          body: "Updated movie review.",
        },
      }),
    );
  });

  it("refreshes affected pages after saving a review", async () => {
    await expect(
      saveReview(null, reviewForm()),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/movies/101");
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("does not save a review when movie storage fails", async () => {
    vi.mocked(prisma.movie.upsert).mockRejectedValueOnce(
      new Error("Database error"),
    );

    await expect(
      saveReview(null, reviewForm()),
    ).rejects.toThrow("Database error");

    expect(prisma.review.upsert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("does not redirect when saving a review fails", async () => {
    vi.mocked(prisma.review.upsert).mockRejectedValueOnce(
      new Error("Review storage failed"),
    );

    await expect(
      saveReview(null, reviewForm()),
    ).rejects.toThrow("Review storage failed");

    expect(revalidatePath).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("Deleting Movie Reviews", () => {
  it("deletes a review belonging to the current user", async () => {
    await deleteReview("review-101");

    expect(prisma.review.deleteMany).toHaveBeenCalledWith({
      where: {
        id: "review-101",
        userId: "user-101",
      },
    });
  });

  it("refreshes the dashboard after deletion", async () => {
    await deleteReview("review-101");

    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("handles a review not owned by the current user", async () => {
    vi.mocked(prisma.review.deleteMany).mockResolvedValueOnce({
      count: 0,
    });

    await expect(
      deleteReview("another-users-review"),
    ).resolves.toBeUndefined();

    expect(prisma.review.deleteMany).toHaveBeenCalledWith({
      where: {
        id: "another-users-review",
        userId: "user-101",
      },
    });
  });

  it("does not refresh the dashboard if deletion fails", async () => {
    vi.mocked(prisma.review.deleteMany).mockRejectedValueOnce(
      new Error("Deletion failed"),
    );

    await expect(
      deleteReview("review-101"),
    ).rejects.toThrow("Deletion failed");

    expect(revalidatePath).not.toHaveBeenCalled();
  });
});