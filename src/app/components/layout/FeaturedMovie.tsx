
import Image from "next/image";
import Link from "next/link";
import type { Movie } from "@/app/data/movies";
import { Star } from "lucide-react";

interface FeaturedMovieProps {
  movie: Movie;
}

export default function FeaturedMovie({ movie }: FeaturedMovieProps) {
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
          <h3>{movie.title}</h3>
          <p className="featured-movie-meta">
            {movie.year} <span>•</span> {movie.ageRating} <span>•</span> {movie.duration}
          </p>
        </div>
        <h4>Synopsis</h4>
        <p className="featured-movie-synopsis">{movie.synopsis}</p>
        <div className="featured-movie-bottom">
          <p className="featured-movie-rating">
            <Star size={42} fill="currentColor" />
            <span><small>Rating</small>{movie.rating.toFixed(1)}/10</span>
          </p>
          <Link href={`/reviews/${movie.id}`} className="btn-primary">
            Add Review
          </Link>
        </div>
      </div>
    </section>
  );
}
