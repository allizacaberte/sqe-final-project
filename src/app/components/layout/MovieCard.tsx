
import Image from "next/image";
import Link from "next/link";
import type { Movie } from "@/app/data/movies";
import { Star } from "lucide-react";

interface MovieCardProps {
  movie: Movie;
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
          <span>{movie.rating.toFixed(1)}/10</span>
        </p>
        <h3>{movie.title}</h3>
        <div className="movie-card-footer">
          <p className="movie-card-meta">
            {movie.year} <span>•</span> {movie.ageRating} <span>•</span> {movie.duration}
          </p>
          <Link href={`/reviews/${movie.id}`} className="btn-primary btn-small">
            Add Review
          </Link>
        </div>
      </div>
    </article>
  );
}
