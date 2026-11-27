import {
  beforeEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";

vi.mock("@/lib/tmdb", () => ({
  suggestMovies: vi.fn(),
}));

import { suggestMovies } from "@/lib/tmdb";
import { GET } from "@/app/api/search/suggest/route";

const mockSuggestMovies = vi.mocked(suggestMovies);

const movies = [
  {
    id: 101,
    title: "Batman",
    year: 2022,
    poster: "/batman.jpg",
  },
  {
    id: 102,
    title: "Batman Begins",
    year: 2005,
    poster: "/batman-begins.jpg",
  },
];

function createRequest(query?: string) {
  const url = new URL(
    "http://localhost:3000/api/search/suggest",
  );

  if (query !== undefined) {
    url.searchParams.set("q", query);
  }

  return new Request(url);
}

beforeEach(() => {
  vi.resetAllMocks();
  mockSuggestMovies.mockResolvedValue(movies);
});

describe("Search Suggestion API", () => {
  it("returns a successful HTTP response", async () => {
    const response = await GET(createRequest("Batman"));

    expect(response.status).toBe(200);
  });

  it("returns movie suggestions as JSON", async () => {
    const response = await GET(createRequest("Batman"));

    expect(await response.json()).toEqual(movies);
  });

  it("returns the correct content type", async () => {
    const response = await GET(createRequest("Batman"));

    expect(
      response.headers.get("content-type"),
    ).toContain("application/json");
  });

  it("passes the query to suggestMovies", async () => {
    await GET(createRequest("Batman"));

    expect(mockSuggestMovies).toHaveBeenCalledTimes(1);
    expect(mockSuggestMovies).toHaveBeenCalledWith(
      "Batman",
    );
  });

  it("handles a missing query parameter", async () => {
    mockSuggestMovies.mockResolvedValue([]);

    const response = await GET(createRequest());

    expect(mockSuggestMovies).toHaveBeenCalledWith("");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it("handles an explicitly empty query", async () => {
    mockSuggestMovies.mockResolvedValue([]);

    const response = await GET(createRequest(""));

    expect(mockSuggestMovies).toHaveBeenCalledWith("");
    expect(await response.json()).toEqual([]);
  });

  it("handles whitespace in the query", async () => {
    mockSuggestMovies.mockResolvedValue([]);

    await GET(createRequest("   "));

    expect(mockSuggestMovies).toHaveBeenCalledWith(
      "   ",
    );
  });

  it("decodes special characters in the query", async () => {
    await GET(createRequest("Batman & Robin"));

    expect(mockSuggestMovies).toHaveBeenCalledWith(
      "Batman & Robin",
    );
  });

  it("preserves queries shorter than 100 characters", async () => {
    const query = "a".repeat(99);

    await GET(createRequest(query));

    expect(mockSuggestMovies).toHaveBeenCalledWith(
      query,
    );
  });

  it("accepts exactly 100 characters", async () => {
    const query = "a".repeat(100);

    await GET(createRequest(query));

    expect(mockSuggestMovies).toHaveBeenCalledWith(
      query,
    );
  });

  it("truncates queries longer than 100 characters", async () => {
    const query = "a".repeat(101);

    await GET(createRequest(query));

    expect(mockSuggestMovies).toHaveBeenCalledWith(
      "a".repeat(100),
    );
  });

  it("returns an empty array when no movies are found", async () => {
    mockSuggestMovies.mockResolvedValue([]);

    const response = await GET(
      createRequest("Unknown Movie"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it("returns HTTP 502 when TMDB fails", async () => {
    mockSuggestMovies.mockRejectedValue(
      new Error("TMDB unavailable"),
    );

    const response = await GET(createRequest("Batman"));

    expect(response.status).toBe(502);
  });

  it("returns an empty array when TMDB fails", async () => {
    mockSuggestMovies.mockRejectedValue(
      new Error("Network error"),
    );

    const response = await GET(createRequest("Batman"));

    expect(await response.json()).toEqual([]);
  });

  it("does not expose internal error details", async () => {
    mockSuggestMovies.mockRejectedValue(
      new Error("Internal server error details"),
    );

    const response = await GET(createRequest("Batman"));
    const body = await response.text();

    expect(body).not.toContain(
      "Internal server error details",
    );

    expect(body).toBe("[]");
  });
});