
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { formatMeta } from "@/lib/tmdb";
import { formatRating, type RatedMovie } from "@/lib/ratings";

interface MovieCardProps {
  movie: RatedMovie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  return (
    <article className="movie-card">
      <div className="movie-card-poster">
        <Image
          src={movie.poster}
          alt={`${movie.title} movie poster`}
          fill
          sizes="(max-width: 768px) 45vw, 220px"
          className="movie-card-image"
        />
      </div>

      <div className="movie-card-content">
        <p className="movie-card-rating">
          <Star size={20} fill="currentColor" />
          <span>{formatRating(movie.rating)}</span>
          {movie.reviewCount > 0 && (
            <small className="movie-card-count">
              ({movie.reviewCount} {movie.reviewCount === 1 ? "review" : "reviews"})
            </small>
          )}
        </p>
        <h3>
          <Link href={`/movies/${movie.id}`}>{movie.title}</Link>
        </h3>
        <div className="movie-card-footer">
          <p className="movie-card-meta">{formatMeta(movie)}</p>
          <Link href={`/reviews/${movie.id}`} className="btn-primary btn-small">
            Add Review
          </Link>
        </div>
      </div>
    </article>
  );
}
