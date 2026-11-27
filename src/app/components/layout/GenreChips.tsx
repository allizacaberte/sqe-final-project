import Link from "next/link";
import type { Genre } from "@/lib/tmdb";

// A row of genre buttons linking to /genres/[id]. `activeId` highlights the current one.
export default function GenreChips({ genres, activeId }: { genres: Genre[]; activeId?: number }) {
  return (
    <nav className="genre-chips" aria-label="Browse by genre">
      {genres.map((genre) => (
        <Link
          key={genre.id}
          href={`/genres/${genre.id}`}
          className={genre.id === activeId ? "genre-chip is-active" : "genre-chip"}
          aria-current={genre.id === activeId ? "page" : undefined}
        >
          {genre.name}
        </Link>
      ))}
    </nav>
  );
}
