import {
  afterEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";

import {
  render,
  screen,
  cleanup,
  within,
} from "@testing-library/react";

import type { ReactNode } from "react";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
  }) => (
    <img
      src={src}
      alt={alt}
      className={className}
    />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
    className?: string;
    "aria-label"?: string;
    "aria-current"?: React.AriaAttributes["aria-current"];
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import Footer from "@/app/components/layout/Footer";
import GenreChips from "@/app/components/layout/GenreChips";
import MovieCard from "@/app/components/layout/MovieCard";
import MovieRail from "@/app/components/layout/MovieRail";
import FeaturedMovie from "@/app/components/layout/FeaturedMovie";

import type { RatedMovie } from "@/lib/ratings";

const genres = [
  { id: 28, name: "Action" },
  { id: 35, name: "Comedy" },
  { id: 18, name: "Drama" },
];

const testMovie: RatedMovie = {
  id: 101,
  title: "Test Movie",
  year: 2026,
  ageRating: "PG",
  duration: "2h 0m",
  runtimeMin: 120,
  poster: "/poster.jpg",
  posterPath: "/poster.jpg",
  releaseDate: "2026-01-15",
  genres: [
    { id: 28, name: "Action" },
    { id: 18, name: "Drama" },
  ],
  director: null,
  rating: 8.5,
  reviewCount: 3,
};

afterEach(() => {
  cleanup();
});

describe("Footer Component", () => {
  it("renders the footer", () => {
    render(<Footer />);

    expect(
      screen.getByRole("contentinfo"),
    ).toBeInTheDocument();
  });

  it("renders the application logo", () => {
    render(<Footer />);

    expect(
      screen.getByRole("img", {
        name: "Critic's Frame",
      }),
    ).toBeInTheDocument();
  });

  it("provides a link to the homepage", () => {
    render(<Footer />);

    expect(
      screen.getByRole("link", {
        name: "Critic's Frame home",
      }),
    ).toHaveAttribute("href", "/");
  });

  it("displays the current copyright year", () => {
    render(<Footer />);

    expect(
      screen.getByText(
        new RegExp(
          `${new Date().getFullYear()} Critic's Frame`,
        ),
      ),
    ).toBeInTheDocument();
  });

  it("provides proper TMDB attribution", () => {
    render(<Footer />);

    const link = screen.getByRole("link", {
      name: "TMDB",
    });

    expect(link).toHaveAttribute(
      "href",
      "https://www.themoviedb.org",
    );

    expect(link).toHaveAttribute("target", "_blank");

    expect(link).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );

    expect(
      screen.getByText(/not endorsed or certified by TMDB/i),
    ).toBeInTheDocument();
  });

  it("provides a back-to-top link", () => {
    render(<Footer />);

    expect(
      screen.getByRole("link", {
        name: "Back to top",
      }),
    ).toHaveAttribute("href", "#top");
  });
});

describe("GenreChips Component", () => {
  it("renders genre navigation", () => {
    render(<GenreChips genres={genres} />);

    expect(
      screen.getByRole("navigation", {
        name: "Browse by genre",
      }),
    ).toBeInTheDocument();
  });

  it("renders all available genres", () => {
    render(<GenreChips genres={genres} />);

    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("links each genre to its corresponding page", () => {
    render(<GenreChips genres={genres} />);

    for (const genre of genres) {
      expect(
        screen.getByRole("link", {
          name: genre.name,
        }),
      ).toHaveAttribute(
        "href",
        `/genres/${genre.id}`,
      );
    }
  });

  it("highlights the active genre", () => {
    render(
      <GenreChips
        genres={genres}
        activeId={28}
      />,
    );

    const active = screen.getByRole("link", {
      name: "Action",
    });

    expect(active).toHaveClass("is-active");
    expect(active).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("does not highlight inactive genres", () => {
    render(
      <GenreChips
        genres={genres}
        activeId={28}
      />,
    );

    const inactive = screen.getByRole("link", {
      name: "Comedy",
    });

    expect(inactive).not.toHaveClass("is-active");
    expect(inactive).not.toHaveAttribute("aria-current");
  });

  it("handles an unknown active genre", () => {
    render(
      <GenreChips
        genres={genres}
        activeId={999}
      />,
    );

    for (const link of screen.getAllByRole("link")) {
      expect(link).not.toHaveClass("is-active");
    }
  });

  it("handles an empty genre list", () => {
    render(<GenreChips genres={[]} />);

    expect(
      screen.queryAllByRole("link"),
    ).toHaveLength(0);
  });
});

describe("MovieCard Component", () => {
  it("renders a movie card", () => {
    render(<MovieCard movie={testMovie} />);

    expect(
      screen.getByRole("article"),
    ).toBeInTheDocument();
  });

  it("displays the movie title", () => {
    render(<MovieCard movie={testMovie} />);

    expect(
      screen.getByRole("heading", {
        name: "Test Movie",
      }),
    ).toBeInTheDocument();
  });

  it("displays the movie poster", () => {
    render(<MovieCard movie={testMovie} />);

    expect(
      screen.getByRole("img", {
        name: "Test Movie movie poster",
      }),
    ).toHaveAttribute("src", "/poster.jpg");
  });

  it("displays the formatted rating", () => {
    render(<MovieCard movie={testMovie} />);

    expect(
      screen.getByText("8.5/10"),
    ).toBeInTheDocument();
  });

  it("displays plural review counts", () => {
    render(<MovieCard movie={testMovie} />);

    expect(
      screen.getByText("(3 reviews)"),
    ).toBeInTheDocument();
  });

  it("displays a singular review count", () => {
    render(
      <MovieCard
        movie={{
          ...testMovie,
          reviewCount: 1,
        }}
      />,
    );

    expect(
      screen.getByText("(1 review)"),
    ).toBeInTheDocument();
  });

  it("hides the review count when there are no reviews", () => {
    render(
      <MovieCard
        movie={{
          ...testMovie,
          rating: null,
          reviewCount: 0,
        }}
      />,
    );

    expect(
      screen.queryByText(/\(0 reviews?\)/),
    ).not.toBeInTheDocument();
  });

  it("displays the fallback for an unrated movie", () => {
    render(
      <MovieCard
        movie={{
          ...testMovie,
          rating: null,
          reviewCount: 0,
        }}
      />,
    );

    expect(
      screen.getByText("No ratings"),
    ).toBeInTheDocument();
  });

  it("displays movie metadata", () => {
    render(<MovieCard movie={testMovie} />);

    expect(
      screen.getByText(/2026.*PG.*2h 0m/),
    ).toBeInTheDocument();
  });

  it("links to the movie details page", () => {
    render(<MovieCard movie={testMovie} />);

    expect(
      screen.getByRole("link", {
        name: "Test Movie",
      }),
    ).toHaveAttribute("href", "/movies/101");
  });

  it("links to the review submission page", () => {
    render(<MovieCard movie={testMovie} />);

    expect(
      screen.getByRole("link", {
        name: "Add Review",
      }),
    ).toHaveAttribute("href", "/reviews/101");
  });
});

describe("MovieRail Component", () => {
  it("displays the section title", () => {
    render(
      <MovieRail
        title="Popular Movies"
        icon={<span>Icon</span>}
        movies={[testMovie]}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Popular Movies",
      }),
    ).toBeInTheDocument();
  });

  it("renders multiple movie cards", () => {
    render(
      <MovieRail
        title="Popular Movies"
        icon={<span>Icon</span>}
        movies={[
          testMovie,
          {
            ...testMovie,
            id: 102,
            title: "Second Movie",
          },
        ]}
      />,
    );

    expect(
      screen.getAllByRole("listitem"),
    ).toHaveLength(2);

    expect(
      screen.getAllByRole("article"),
    ).toHaveLength(2);

    expect(
      screen.getByRole("heading", {
        name: "Second Movie",
      }),
    ).toBeInTheDocument();
  });

  it("renders movie cards inside a list", () => {
    render(
      <MovieRail
        title="Now Showing"
        icon={<span>Icon</span>}
        movies={[testMovie]}
      />,
    );

    const list = screen.getByRole("list");

    expect(
      within(list).getByRole("listitem"),
    ).toBeInTheDocument();

    expect(
      within(list).getByRole("article"),
    ).toBeInTheDocument();
  });

  it("does not render when the movie list is empty", () => {
    const { container } = render(
      <MovieRail
        title="Upcoming Movies"
        icon={<span>Icon</span>}
        movies={[]}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

describe("FeaturedMovie Component", () => {
  it("displays the featured movie title", () => {
    render(<FeaturedMovie movie={testMovie} />);

    expect(
      screen.getByRole("heading", {
        name: "Test Movie",
      }),
    ).toBeInTheDocument();
  });

  it("displays the featured movie poster", () => {
    render(<FeaturedMovie movie={testMovie} />);

    expect(
      screen.getByRole("img", {
        name: "Test Movie movie poster",
      }),
    ).toHaveAttribute("src", "/poster.jpg");
  });

  it("displays the movie metadata", () => {
    render(<FeaturedMovie movie={testMovie} />);

    expect(
      screen.getByText(/2026.*PG.*2h 0m/),
    ).toBeInTheDocument();
  });

  it("displays the movie genres", () => {
    render(<FeaturedMovie movie={testMovie} />);

    expect(
      screen.getByText("Action · Drama"),
    ).toBeInTheDocument();
  });

  it("hides the genre section when no genres exist", () => {
    const { container } = render(
      <FeaturedMovie
        movie={{
          ...testMovie,
          genres: [],
        }}
      />,
    );

    expect(
      container.querySelector(".featured-movie-genres"),
    ).toBeNull();
  });

  it("displays the latest review and its author", () => {
    render(
      <FeaturedMovie
        movie={testMovie}
        latestReview={{
          author: "Test Reviewer",
          body: "An amazing movie!",
        }}
      />,
    );

    expect(
      screen.getByText(
        /An amazing movie!.*Test Reviewer/,
      ),
    ).toBeInTheDocument();
  });

  it("displays a fallback when the latest review is missing", () => {
    render(<FeaturedMovie movie={testMovie} />);

    expect(
      screen.getByText(
        "No reviews yet. Be the first to share your thoughts!",
      ),
    ).toBeInTheDocument();
  });

  it("handles a null latest review", () => {
    render(
      <FeaturedMovie
        movie={testMovie}
        latestReview={null}
      />,
    );

    expect(
      screen.getByText(/No reviews yet/),
    ).toBeInTheDocument();
  });

  it("displays the featured movie rating", () => {
    render(<FeaturedMovie movie={testMovie} />);

    expect(
      screen.getByText("8.5/10"),
    ).toBeInTheDocument();
  });

  it("handles a featured movie without ratings", () => {
    render(
      <FeaturedMovie
        movie={{
          ...testMovie,
          rating: null,
          reviewCount: 0,
        }}
      />,
    );

    expect(
      screen.getByText("No ratings"),
    ).toBeInTheDocument();
  });

  it("links to the featured movie details", () => {
    render(<FeaturedMovie movie={testMovie} />);

    expect(
      screen.getByRole("link", {
        name: "Test Movie",
      }),
    ).toHaveAttribute("href", "/movies/101");
  });

  it("links to the featured movie review page", () => {
    render(<FeaturedMovie movie={testMovie} />);

    expect(
      screen.getByRole("link", {
        name: "Add Review",
      }),
    ).toHaveAttribute("href", "/reviews/101");
  });
});