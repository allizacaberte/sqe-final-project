"use client";

import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { MovieSuggestion } from "@/lib/tmdb";

interface SearchBoxProps {
  initialQuery?: string;
  className?: string;
  onNavigate?: () => void; // e.g. close the mobile menu after choosing a movie
}

const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;

// Search input with an autocomplete dropdown of movie suggestions.
// - Typing shows up to 6 guesses (fetched from /api/search/suggest)
// - Arrow keys move through them, Enter opens the highlighted movie, Escape closes
// - Pressing Enter with nothing highlighted goes to the full /search results page
export default function SearchBox({ initialQuery = "", className = "", onNavigate }: SearchBoxProps) {
  const router = useRouter();
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<MovieSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const trimmed = query.trim();
  const showDropdown = open && trimmed.length >= MIN_CHARS && suggestions.length > 0;

  // Fetch suggestions a moment after the user stops typing
  useEffect(() => {
    if (trimmed.length < MIN_CHARS) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        const data: MovieSuggestion[] = res.ok ? await res.json() : [];
        setSuggestions(data);
        setActiveIndex(-1);
      } catch {
        // Aborted because the user kept typing, or a network error: ignore
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  function choose(movie: MovieSuggestion) {
    setOpen(false);
    onNavigate?.();
    router.push(`/movies/${movie.id}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown) {
      if (e.key === "ArrowDown" && suggestions.length > 0) setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault(); // open the highlighted movie instead of the results page
      choose(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault(); // first Escape only closes the list; the browser would also clear the text
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div
      ref={containerRef}
      className={`search-box ${className}`}
      // Close the dropdown when focus leaves the search box entirely
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <Form
        action="/search"
        className="navbar-search"
        role="search"
        onSubmit={() => {
          setOpen(false);
          onNavigate?.();
        }}
      >
        <input
          type="search"
          name="q"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search movies..."
          aria-label="Search movies"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          required
        />
        <button type="submit" className="navbar-search-button" aria-label="Search">
          <Search size={16} />
        </button>
      </Form>

      {showDropdown && (
        <ul id={listId} role="listbox" className="search-suggestions">
          {suggestions.map((movie, i) => (
            <li
              key={movie.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={i === activeIndex ? "is-active" : undefined}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <Link
                href={`/movies/${movie.id}`}
                tabIndex={-1}
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
              >
                <span className="search-suggestion-poster">
                  <Image src={movie.poster} alt="" fill sizes="32px" />
                </span>
                <span className="search-suggestion-title">{movie.title}</span>
                {movie.year && <span className="search-suggestion-year">{movie.year}</span>}
              </Link>
            </li>
          ))}
          <li className="search-suggestions-all">
            <Link
              href={`/search?q=${encodeURIComponent(trimmed)}`}
              tabIndex={-1}
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
            >
              See all results for &ldquo;{trimmed}&rdquo;
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}
