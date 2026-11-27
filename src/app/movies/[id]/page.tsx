import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkles, Star } from "lucide-react";
import Navbar from "@/app/components/layout/Navbar";
import Footer from "@/app/components/layout/Footer";
import GenreChips from "@/app/components/layout/GenreChips";
import MovieRail from "@/app/components/layout/MovieRail";
import { getCurrentUser } from "@/lib/session";
import { formatMeta, formatReleaseDate, getMovie, getRecommendations } from "@/lib/tmdb";
import { formatRating, withRatings } from "@/lib/ratings";
import { prisma } from "@/lib/prisma";

// Public movie page: anyone can read the reviews. [id] is the TMDB movie id.
export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;
  const movie = await getMovie(Number(id));
  if (!movie) notFound();

  const [reviews, recommendations] = await Promise.all([
    prisma.review.findMany({
      where: { movie: { tmdbId: movie.id } },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getRecommendations(movie.id, 8),
  ]);
  const similar = await withRatings(recommendations);
  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;
  const hasReviewed = !!user && reviews.some((r) => r.userId === user.id);

  return (
    <div className="site-shell">
      <Navbar isLoggedIn={!!user} />
      <main className="review-page">
        <div className="container review-layout">
          <div className="review-poster">
            <Image src={movie.poster} alt={`${movie.title} poster`} fill sizes="430px" priority />
          </div>
          <section className="review-details">
            <div className="review-title">
              <h1>{movie.title}</h1>
              <span>{formatMeta(movie)}</span>
            </div>

            <dl className="movie-facts">
              {movie.releaseDate && (
                <div>
                  <dt>Release date</dt>
                  <dd>{formatReleaseDate(movie.releaseDate)}</dd>
                </div>
              )}
              {movie.director && (
                <div>
                  <dt>Director</dt>
                  <dd>{movie.director}</dd>
                </div>
              )}
              {movie.genres.length > 0 && (
                <div>
                  <dt>Genres</dt>
                  <dd>
                    <GenreChips genres={movie.genres} />
                  </dd>
                </div>
              )}
            </dl>

            <div className="review-actions">
              <div className="featured-movie-rating">
                <Star size={42} fill="currentColor" />
                <span>
                  <small>
                    {reviews.length === 1 ? "1 review" : `${reviews.length} reviews`}
                  </small>
                  {formatRating(average)}
                </span>
              </div>
              <Link href={`/reviews/${movie.id}`} className="btn-primary">
                {hasReviewed ? "Edit your review" : "Add Review"}
              </Link>
            </div>
          </section>
        </div>

        <section className="container movie-reviews">
          <h2>Reviews</h2>
          {reviews.length === 0 ? (
            <p className="movie-reviews-empty">No reviews yet. Be the first!</p>
          ) : (
            reviews.map((r) => (
              <article key={r.id} className="movie-review">
                <header>
                  <strong>{r.user.name}</strong>
                  <span className="movie-review-rating">
                    <Star size={18} fill="currentColor" /> {r.rating}/10
                  </span>
                </header>
                <p>{r.body}</p>
                <time dateTime={r.createdAt.toISOString()}>
                  {r.createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
              </article>
            ))
          )}
        </section>

        <MovieRail title="You Might Also Like" icon={<Sparkles size={26} />} movies={similar} />
      </main>
      <Footer />
    </div>
  );
}
