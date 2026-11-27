
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { formatMeta } from "@/lib/tmdb";
import { formatRating, type RatedMovie } from "@/lib/ratings";

interface FeaturedMovieProps {
  movie: RatedMovie;
  latestReview?: { author: string; body: string } | null;
}

export default function FeaturedMovie({ movie, latestReview }: FeaturedMovieProps) {
  return (
    <section className="featured-movie">
      <div className="featured-movie-poster">
        <Image
          src={movie.poster}
          alt={`${movie.title} movie poster`}
          fill
          sizes="(max-width: 768px) 100vw, 350px"
          className="featured-movie-image"
        />
      </div>

      <div className="featured-movie-info">
        <div className="featured-title-row">
          <h3>
            <Link href={`/movies/${movie.id}`}>{movie.title}</Link>
          </h3>
          <p className="featured-movie-meta">{formatMeta(movie)}</p>
        </div>
        {movie.genres.length > 0 && (
          <p className="featured-movie-genres">{movie.genres.map((g) => g.name).join(" · ")}</p>
        )}
        <h4>Latest review</h4>
        <p className="featured-movie-synopsis">
          {latestReview
            ? `“${latestReview.body}” — ${latestReview.author}`
            : "No reviews yet. Be the first to share your thoughts!"}
        </p>
        <div className="featured-movie-bottom">
          <p className="featured-movie-rating">
            <Star size={42} fill="currentColor" />
            <span>
              <small>Rating</small>
              {formatRating(movie.rating)}
            </span>
          </p>
          <Link href={`/reviews/${movie.id}`} className="btn-primary">
            Add Review
          </Link>
        </div>
      </div>
    </section>
  );
}
