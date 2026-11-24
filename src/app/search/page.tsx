import type { Metadata } from "next";
import Navbar from "@/app/components/layout/Navbar";
import Footer from "@/app/components/layout/Footer";
import MovieCard from "@/app/components/layout/MovieCard";
import { getCurrentUser } from "@/lib/session";
import { searchMovies } from "@/lib/tmdb";
import { withRatings } from "@/lib/ratings";

export const metadata: Metadata = { title: "Search" };

// Results page for the navbar search: /search?q=toy story
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q ?? "").trim();

  const user = await getCurrentUser();
  const results = query ? await withRatings(await searchMovies(query)) : [];

  return (
    <div className="site-shell">
      <Navbar isLoggedIn={!!user} searchQuery={query} />
      <main className="search-page">
        <div className="container">
          <h1 className="search-heading">
            {query ? (
              <>
                Results for <span>&ldquo;{query}&rdquo;</span>
              </>
            ) : (
              "Search for a movie"
            )}
          </h1>

          {query && results.length === 0 && (
            <p className="search-empty">
              No movies found. Check the spelling or try a different title.
            </p>
          )}

          {results.length > 0 && (
            <div className="top-picks-grid">
              {results.map((movie) => (
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
