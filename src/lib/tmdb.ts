import "server-only";

// Movie facts come from TMDB: title, poster, release date/year, age rating
// (G, PG, PG-13, R...), runtime, genres and director. Star ratings do NOT come
// from TMDB; they're our own users' review averages (see src/lib/ratings.ts).

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";
const POSTER_FALLBACK = "/images/cf_assets_sqe/background/CF Home bg.png";

export interface TmdbMovie {
  id: number; // TMDB id, used in URLs: /movies/550
  title: string;
  year: number | null;
  ageRating: string; // "PG-13", or "NR" if TMDB has none
  duration: string; // "2h 56m"
  runtimeMin: number | null;
  poster: string; // full image URL (or a local fallback)
  posterPath: string | null; // TMDB path, what we store in the database
  releaseDate: string | null; // "2014-11-05"
  genres: Genre[]; // e.g. [{ id: 878, name: "Science Fiction" }]
  director: string | null;
}

export interface Genre {
  id: number;
  name: string;
}

interface TmdbDetails {
  id: number;
  title: string;
  release_date: string;
  runtime: number | null;
  poster_path: string | null;
  genres?: Genre[];
  release_dates?: {
    results: { iso_3166_1: string; release_dates: { certification: string }[] }[];
  };
  credits?: { crew: { job: string; name: string }[] };
}

// Calls TMDB. Responses are cached for 1 hour so we don't hit TMDB on every page view.
async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!process.env.TMDB_READ_TOKEN)
    throw new Error("TMDB_READ_TOKEN is missing from .env (restart the dev server after adding it)");

  const url = new URL(BASE + path);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}`,
      accept: "application/json",
    },
    next: { revalidate: 3600 },
  });
  if (res.status === 404) return null;
  if (res.status === 401)
    throw new Error(
      "TMDB rejected the token (401). Use the long 'API Read Access Token' (starts with eyJ), not the short API key.",
    );
  if (!res.ok) throw new Error(`TMDB request ${path} failed with ${res.status}`);
  return res.json();
}

export function posterUrl(path: string | null, size = "w500") {
  return path ? `${IMG}/${size}${path}` : POSTER_FALLBACK;
}

export function formatRuntime(min: number | null) {
  if (!min) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

// "1998 • G • 1h 27m", skipping anything that's missing
export function formatMeta(movie: { year: number | null; ageRating: string; duration: string }) {
  return [movie.year, movie.ageRating, movie.duration].filter(Boolean).join(" • ");
}

function usCertification(d: TmdbDetails) {
  const us = d.release_dates?.results.find((r) => r.iso_3166_1 === "US");
  return us?.release_dates.find((r) => r.certification)?.certification || "NR";
}

function toMovie(d: TmdbDetails): TmdbMovie {
  return {
    id: d.id,
    title: d.title,
    year: d.release_date ? Number(d.release_date.slice(0, 4)) : null,
    ageRating: usCertification(d),
    duration: formatRuntime(d.runtime),
    runtimeMin: d.runtime,
    poster: posterUrl(d.poster_path),
    posterPath: d.poster_path,
    releaseDate: d.release_date || null,
    genres: d.genres ?? [],
    director: d.credits?.crew.find((c) => c.job === "Director")?.name ?? null,
  };
}

// "November 5, 2014"
export function formatReleaseDate(date: string | null) {
  if (!date) return "";
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export async function getMovie(id: number): Promise<TmdbMovie | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  // One call gets details + age ratings + cast/crew (for the director)
  const details = await tmdb<TmdbDetails>(`/movie/${id}`, {
    append_to_response: "release_dates,credits",
  });
  return details ? toMovie(details) : null;
}

// List endpoints don't include runtime or age rating, so load full details for each movie.
async function getList(path: string, limit: number, params: Record<string, string> = {}) {
  const list = await tmdb<{ results: { id: number }[] }>(path, params);
  const movies = await Promise.all(
    (list?.results ?? []).slice(0, limit).map((m) => getMovie(m.id)),
  );
  return movies.filter((m): m is TmdbMovie => m !== null);
}

// ----- Home page categories -----

export const getNowPlaying = (limit = 8) => getList("/movie/now_playing", limit);
export const getPopular = (limit = 8) => getList("/movie/popular", limit);
export const getUpcoming = (limit = 8) => getList("/movie/upcoming", limit);

// Classic, widely praised films. Requiring 1000+ votes keeps brand-new movies
// with a handful of votes from crowding out the classics.
export const getAcclaimed = (limit = 8) =>
  getList("/discover/movie", limit, {
    sort_by: "vote_average.desc",
    "vote_count.gte": "1000",
  });

// ----- Genres -----

export async function getGenres(): Promise<Genre[]> {
  const data = await tmdb<{ genres: Genre[] }>("/genre/movie/list");
  return data?.genres ?? [];
}

// Popular movies in one genre (e.g. 27 = Horror)
export const getMoviesByGenre = (genreId: number, limit = 12) =>
  getList("/discover/movie", limit, {
    with_genres: String(genreId),
    sort_by: "popularity.desc",
    "vote_count.gte": "100",
  });

// "You might also like" on a movie's page
export const getRecommendations = (movieId: number, limit = 8) =>
  getList(`/movie/${movieId}/recommendations`, limit);

// What the search-box dropdown shows for each guess
export interface MovieSuggestion {
  id: number;
  title: string;
  year: number | null;
  poster: string; // small thumbnail URL
}

// Quick guesses while the user is typing. Uses only the search results
// (one TMDB call, no detail lookups) so the dropdown feels instant.
export async function suggestMovies(query: string, limit = 6): Promise<MovieSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const list = await tmdb<{
    results: { id: number; title: string; release_date?: string; poster_path: string | null }[];
  }>("/search/movie", { query: q, include_adult: "false" });

  return (list?.results ?? []).slice(0, limit).map((m) => ({
    id: m.id,
    title: m.title,
    year: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
    poster: posterUrl(m.poster_path, "w92"),
  }));
}

// Movie search for the navbar. Returns up to `limit` matches with full details.
export async function searchMovies(query: string, limit = 12) {
  const q = query.trim();
  if (!q) return [];
  return getList("/search/movie", limit, { query: q, include_adult: "false" });
}
