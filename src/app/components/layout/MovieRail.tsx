import type { ReactNode } from "react";
import MovieCard from "@/app/components/layout/MovieCard";
import type { RatedMovie } from "@/lib/ratings";

interface MovieRailProps {
  title: string;
  icon: ReactNode;
  movies: RatedMovie[];
}

// A titled, horizontally scrolling row of movie cards (Now Showing, Popular, etc.)
export default function MovieRail({ title, icon, movies }: MovieRailProps) {
  if (movies.length === 0) return null;

  return (
    <section className="container landing-section">
      <h2 className="section-title">
        <span className="section-icon popcorn" aria-hidden="true">
          {icon}
        </span>
        {title}
      </h2>
      <div className="movie-rail" role="list">
        {movies.map((movie) => (
          <div role="listitem" key={movie.id} className="movie-rail-item">
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>
    </section>
  );
}
