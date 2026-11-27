import {
  beforeEach,
  afterEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";

vi.mock("server-only", () => ({}));

import {
  posterUrl,
  formatRuntime,
  formatMeta,
  formatReleaseDate,
  getMovie,
  getNowPlaying,
  getPopular,
  getUpcoming,
  getAcclaimed,
  getGenres,
  getMoviesByGenre,
  getRecommendations,
  suggestMovies,
  searchMovies,
} from "../lib/tmdb";

const fetchMock = vi.fn();

const fallback =
  "/images/cf_assets_sqe/background/CF Home bg.png";

const movieDetails = {
  id: 101,
  title: "Test Movie",
  release_date: "2026-01-15",
  runtime: 125,
  poster_path: "/test.jpg",
  genres: [{ id: 28, name: "Action" }],
  release_dates: {
    results: [
      {
        iso_3166_1: "US",
        release_dates: [
          { certification: "" },
          { certification: "PG-13" },
        ],
      },
    ],
  },
  credits: {
    crew: [
      { job: "Producer", name: "Test Producer" },
      { job: "Director", name: "Test Director" },
    ],
  },
};

function mockResponse(data: unknown, status = 200) {
  fetchMock.mockResolvedValueOnce({
    status,
    ok: status >= 200 && status < 300,
    json: async () => data,
  });
}

function requestUrl(index = 0): URL {
  return new URL(String(fetchMock.mock.calls[index][0]));
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("TMDB_READ_TOKEN", "test-token");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Poster URLs", () => {
  it("generates a default poster URL", () => {
    expect(posterUrl("/test.jpg")).toBe(
      "https://image.tmdb.org/t/p/w500/test.jpg",
    );
  });

  it("supports a custom poster size", () => {
    expect(posterUrl("/test.jpg", "w92")).toBe(
      "https://image.tmdb.org/t/p/w92/test.jpg",
    );
  });

  it("returns a fallback for missing posters", () => {
    expect(posterUrl(null)).toBe(fallback);
  });
});

describe("Runtime Formatting", () => {
  it("formats runtimes shorter than an hour", () => {
    expect(formatRuntime(45)).toBe("45m");
  });

  it("formats hours and minutes", () => {
    expect(formatRuntime(125)).toBe("2h 5m");
  });

  it("formats exact hours", () => {
    expect(formatRuntime(120)).toBe("2h 0m");
  });

  it("handles zero runtime", () => {
    expect(formatRuntime(0)).toBe("");
  });

  it("handles missing runtime", () => {
    expect(formatRuntime(null)).toBe("");
  });
});

describe("Movie Metadata", () => {
  it("combines available movie metadata", () => {
    const result = formatMeta({
      year: 2026,
      ageRating: "PG",
      duration: "2h 5m",
    });

    expect(result).toMatch(/^2026.+PG.+2h 5m$/);
  });

  it("skips missing metadata", () => {
    expect(
      formatMeta({
        year: null,
        ageRating: "",
        duration: "45m",
      }),
    ).toBe("45m");
  });

  it("handles completely missing metadata", () => {
    expect(
      formatMeta({
        year: null,
        ageRating: "",
        duration: "",
      }),
    ).toBe("");
  });
});

describe("Release Date Formatting", () => {
  it("formats a valid release date", () => {
    expect(formatReleaseDate("2014-11-05")).toBe(
      "November 5, 2014",
    );
  });

  it("handles missing release dates", () => {
    expect(formatReleaseDate(null)).toBe("");
  });
});

describe("Movie Retrieval", () => {
  it("retrieves and transforms movie details", async () => {
    mockResponse(movieDetails);

    expect(await getMovie(101)).toEqual({
      id: 101,
      title: "Test Movie",
      year: 2026,
      ageRating: "PG-13",
      duration: "2h 5m",
      runtimeMin: 125,
      poster: "https://image.tmdb.org/t/p/w500/test.jpg",
      posterPath: "/test.jpg",
      releaseDate: "2026-01-15",
      genres: [{ id: 28, name: "Action" }],
      director: "Test Director",
    });

    expect(requestUrl().pathname).toBe("/3/movie/101");

    expect(
      requestUrl().searchParams.get("append_to_response"),
    ).toBe("release_dates,credits");

    expect(fetchMock.mock.calls[0][1]).toEqual({
      headers: {
        Authorization: "Bearer test-token",
        accept: "application/json",
      },
      next: { revalidate: 3600 },
    });
  });

  it.each([0, -1, 1.5, NaN, Infinity])(
    "rejects invalid movie ID %s",
    async (id) => {
      expect(await getMovie(id)).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("returns null when a movie does not exist", async () => {
    mockResponse(null, 404);

    expect(await getMovie(999)).toBeNull();
  });

  it("handles missing optional movie information", async () => {
    mockResponse({
      id: 102,
      title: "Unknown Movie",
      release_date: "",
      runtime: null,
      poster_path: null,
    });

    expect(await getMovie(102)).toEqual({
      id: 102,
      title: "Unknown Movie",
      year: null,
      ageRating: "NR",
      duration: "",
      runtimeMin: null,
      poster: fallback,
      posterPath: null,
      releaseDate: null,
      genres: [],
      director: null,
    });
  });

  it("uses NR when no US certification exists", async () => {
    mockResponse({
      ...movieDetails,
      release_dates: {
        results: [
          {
            iso_3166_1: "GB",
            release_dates: [{ certification: "15" }],
          },
        ],
      },
    });

    expect((await getMovie(101))?.ageRating).toBe("NR");
  });

  it("uses NR when certifications are empty", async () => {
    mockResponse({
      ...movieDetails,
      release_dates: {
        results: [
          {
            iso_3166_1: "US",
            release_dates: [{ certification: "" }],
          },
        ],
      },
    });

    expect((await getMovie(101))?.ageRating).toBe("NR");
  });

  it("handles missing directors", async () => {
    mockResponse({
      ...movieDetails,
      credits: {
        crew: [{ job: "Producer", name: "Test Producer" }],
      },
    });

    expect((await getMovie(101))?.director).toBeNull();
  });
});

describe("TMDB API Error Handling", () => {
  it("rejects requests without an API token", async () => {
    vi.stubEnv("TMDB_READ_TOKEN", "");

    await expect(getMovie(101)).rejects.toThrow(
      "TMDB_READ_TOKEN is missing",
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("handles unauthorized API requests", async () => {
    mockResponse(null, 401);

    await expect(getMovie(101)).rejects.toThrow(
      "TMDB rejected the token (401)",
    );
  });

  it("handles server errors", async () => {
    mockResponse(null, 500);

    await expect(getMovie(101)).rejects.toThrow(
      "TMDB request /movie/101 failed with 500",
    );
  });

  it("propagates network failures", async () => {
    fetchMock.mockRejectedValueOnce(
      new Error("Network failure"),
    );

    await expect(getMovie(101)).rejects.toThrow(
      "Network failure",
    );
  });
});

describe("Movie Categories", () => {
  it("retrieves now-playing movies", async () => {
    mockResponse({ results: [{ id: 101 }] });
    mockResponse(movieDetails);

    const result = await getNowPlaying();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(101);
    expect(requestUrl().pathname).toBe(
      "/3/movie/now_playing",
    );
  });

  it("retrieves popular movies with a custom limit", async () => {
    mockResponse({
      results: [{ id: 101 }, { id: 102 }],
    });
    mockResponse(movieDetails);

    expect(await getPopular(1)).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(requestUrl().pathname).toBe("/3/movie/popular");
  });

  it("retrieves popular movies with the default limit", async () => {
    mockResponse({ results: [] });

    expect(await getPopular()).toEqual([]);
  });

  it("retrieves upcoming movies", async () => {
    mockResponse({ results: [] });

    expect(await getUpcoming()).toEqual([]);
    expect(requestUrl().pathname).toBe("/3/movie/upcoming");
  });

  it("retrieves acclaimed movies using vote filters", async () => {
    mockResponse({ results: [] });

    expect(await getAcclaimed()).toEqual([]);

    expect(requestUrl().pathname).toBe("/3/discover/movie");

    expect(requestUrl().searchParams.get("sort_by")).toBe(
      "vote_average.desc",
    );

    expect(
      requestUrl().searchParams.get("vote_count.gte"),
    ).toBe("1000");
  });

  it("handles unavailable movie lists", async () => {
    mockResponse(null, 404);

    expect(await getNowPlaying()).toEqual([]);
  });

  it("filters out unavailable movie details", async () => {
    mockResponse({
      results: [{ id: 101 }, { id: 999 }],
    });

    mockResponse(movieDetails);
    mockResponse(null, 404);

    const result = await getNowPlaying();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(101);
  });
});

describe("Movie Genres", () => {
  it("retrieves available genres", async () => {
    const genres = [
      { id: 28, name: "Action" },
      { id: 27, name: "Horror" },
    ];

    mockResponse({ genres });

    expect(await getGenres()).toEqual(genres);
    expect(requestUrl().pathname).toBe(
      "/3/genre/movie/list",
    );
  });

  it("handles missing genre data", async () => {
    mockResponse(null, 404);

    expect(await getGenres()).toEqual([]);
  });

  it("retrieves movies filtered by genre", async () => {
    mockResponse({ results: [{ id: 101 }] });
    mockResponse(movieDetails);

    expect(await getMoviesByGenre(28)).toHaveLength(1);

    expect(requestUrl().searchParams.get("with_genres")).toBe(
      "28",
    );

    expect(requestUrl().searchParams.get("sort_by")).toBe(
      "popularity.desc",
    );

    expect(
      requestUrl().searchParams.get("vote_count.gte"),
    ).toBe("100");
  });
});

describe("Movie Recommendations", () => {
  it("retrieves recommendations for a movie", async () => {
    mockResponse({ results: [{ id: 101 }] });
    mockResponse(movieDetails);

    expect(await getRecommendations(550)).toHaveLength(1);

    expect(requestUrl().pathname).toBe(
      "/3/movie/550/recommendations",
    );
  });
});

describe("Movie Search Suggestions", () => {
  it.each(["", " ", "a", " a "])(
    "ignores short search query '%s'",
    async (query) => {
      expect(await suggestMovies(query)).toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("returns suggestions using one API request", async () => {
    mockResponse({
      results: [
        {
          id: 101,
          title: "Test Movie",
          release_date: "2026-01-15",
          poster_path: "/test.jpg",
        },
      ],
    });

    expect(await suggestMovies("  Test  ")).toEqual([
      {
        id: 101,
        title: "Test Movie",
        year: 2026,
        poster: "https://image.tmdb.org/t/p/w92/test.jpg",
      },
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(requestUrl().searchParams.get("query")).toBe(
      "Test",
    );
    expect(
      requestUrl().searchParams.get("include_adult"),
    ).toBe("false");
  });

  it("handles suggestions with missing dates and posters", async () => {
    mockResponse({
      results: [
        {
          id: 102,
          title: "Unknown Movie",
          poster_path: null,
        },
      ],
    });

    expect(await suggestMovies("Unknown")).toEqual([
      {
        id: 102,
        title: "Unknown Movie",
        year: null,
        poster: fallback,
      },
    ]);
  });

  it("limits the number of suggestions", async () => {
    mockResponse({
      results: [
        { id: 101, title: "Movie A", poster_path: null },
        { id: 102, title: "Movie B", poster_path: null },
      ],
    });

    expect(await suggestMovies("Movie", 1)).toHaveLength(1);
  });

  it("handles unavailable search results", async () => {
    mockResponse(null, 404);

    expect(await suggestMovies("Unknown")).toEqual([]);
  });
});

describe("Full Movie Search", () => {
  it("ignores empty search queries", async () => {
    expect(await searchMovies("   ")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("retrieves full movie details for search results", async () => {
    mockResponse({ results: [{ id: 101 }] });
    mockResponse(movieDetails);

    const result = await searchMovies("  Test Movie  ");

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Test Movie");

    expect(requestUrl().pathname).toBe("/3/search/movie");

    expect(requestUrl().searchParams.get("query")).toBe(
      "Test Movie",
    );

    expect(
      requestUrl().searchParams.get("include_adult"),
    ).toBe("false");
  });

  it("supports a custom search result limit", async () => {
    mockResponse({
      results: [{ id: 101 }, { id: 102 }],
    });
    mockResponse(movieDetails);

    expect(await searchMovies("Movie", 1)).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});