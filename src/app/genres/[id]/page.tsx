import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/app/components/layout/Navbar";
import Footer from "@/app/components/layout/Footer";
import MovieCard from "@/app/components/layout/MovieCard";
import GenreChips from "@/app/components/layout/GenreChips";
import { getCurrentUser } from "@/lib/session";
import { getGenres, getMoviesByGenre } from "@/lib/tmdb";
import { withRatings } from "@/lib/ratings";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const genre = (await getGenres()).find((g) => g.id === Number(id));
  return { title: genre ? `${genre.name} movies` : "Genre" };
}

// Popular movies in one genre, e.g. /genres/27 = Horror
export default async function GenrePage({ params }: Props) {
  const { id } = await params;
  const genreId = Number(id);

  const [user, genres] = await Promise.all([getCurrentUser(), getGenres()]);
  const genre = genres.find((g) => g.id === genreId);
  if (!genre) notFound();

  const movies = await withRatings(await getMoviesByGenre(genre.id, 12));

  return (
    <div className="site-shell">
      <Navbar isLoggedIn={!!user} />
      <main className="search-page">
        <div className="container">
          <h1 className="search-heading">
            <span>{genre.name}</span> movies
          </h1>
          <GenreChips genres={genres} activeId={genre.id} />

          {movies.length === 0 ? (
            <p className="search-empty">No movies found in this genre.</p>
          ) : (
            <div className="top-picks-grid genre-grid">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
