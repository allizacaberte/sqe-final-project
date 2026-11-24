import "server-only";
import { prisma } from "@/lib/prisma";
import { formatRuntime, posterUrl, type TmdbMovie } from "@/lib/tmdb";

// A TMDB movie plus the average star rating from our users' reviews.
export interface RatedMovie extends TmdbMovie {
  rating: number | null; // null = nobody has reviewed it yet
  reviewCount: number;
}

// Looks up the average user rating for each movie in one database query.
export async function withRatings(movies: TmdbMovie[]): Promise<RatedMovie[]> {
  const stats = await prisma.movie.findMany({
    where: { tmdbId: { in: movies.map((m) => m.id) } },
    select: { tmdbId: true, reviews: { select: { rating: true } } },
  });

  const byTmdbId = new Map(
    stats.map((s) => {
      const count = s.reviews.length;
      const total = s.reviews.reduce((sum, r) => sum + r.rating, 0);
      return [s.tmdbId, { rating: count ? total / count : null, reviewCount: count }];
    }),
  );

  return movies.map((m) => ({
    ...m,
    ...(byTmdbId.get(m.id) ?? { rating: null, reviewCount: 0 }),
  }));
}

// Top Picks: the movies OUR users rated highest (ties go to the one with more reviews).
// Built from the movie info we saved when people reviewed, so no TMDB calls are needed.
export async function getTopPicks(limit = 6): Promise<RatedMovie[]> {
  const ranked = await prisma.review.groupBy({
    by: ["movieId"],
    _avg: { rating: true },
    _count: { rating: true },
    orderBy: [{ _avg: { rating: "desc" } }, { _count: { rating: "desc" } }],
    take: limit,
  });
  if (ranked.length === 0) return [];

  const movies = await prisma.movie.findMany({
    where: { id: { in: ranked.map((r) => r.movieId) } },
  });
  const byId = new Map(movies.map((m) => [m.id, m]));

  return ranked.flatMap((r) => {
    const m = byId.get(r.movieId);
    if (!m) return [];
    return [
      {
        id: m.tmdbId,
        title: m.title,
        year: m.releaseYear,
        ageRating: m.ageRating ?? "NR",
        duration: formatRuntime(m.runtimeMin),
        runtimeMin: m.runtimeMin,
        poster: posterUrl(m.posterPath),
        posterPath: m.posterPath,
        releaseDate: null,
        genres: [],
        director: null,
        rating: r._avg.rating,
        reviewCount: r._count.rating,
      },
    ];
  });
}

// The newest reviews from everyone, for the "Latest Reviews" section on the home page
export function getLatestReviews(limit = 4) {
  return prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { name: true } },
      movie: { select: { tmdbId: true, title: true, posterPath: true, releaseYear: true } },
    },
  });
}

// "7.5/10", or "No ratings" when nobody has reviewed it yet
export function formatRating(rating: number | null) {
  return rating === null ? "No ratings" : `${rating.toFixed(1)}/10`;
}
