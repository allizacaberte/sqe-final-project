
export interface Movie {
  id: number;
  title: string;
  year: number;
  ageRating: string;
  duration: string;
  rating: number;
  poster: string;
  synopsis: string;
  category: "recently-added" | "top-picks";
}

export const movies: Movie[] = [
  {
    id: 1,
    title: "Brave",
    year: 2012,
    ageRating: "PG",
    duration: "1h 33m",
    rating: 7.1,
    poster: "/images/cf_assets_sqe/movies/Brave.jpg",
    synopsis:
      "Determined to make her own path in life, Princess Merida defies a custom that brings chaos to her kingdom. To change her fate, she must rely on her bravery and archery skills.",
    category: "recently-added",
  },
  {
    id: 2,
    title: "Mulan",
    year: 1998,
    ageRating: "G",
    duration: "1h 27m",
    rating: 7.7,
    poster: "/images/cf_assets_sqe/movies/Mulan.jpg",
    synopsis:
      "To save her father from the Imperial Army, a courageous young woman disguises herself as a man and takes his place in the army.",
    category: "top-picks",
  },
  {
    id: 3,
    title: "The Odyssey",
    year: 2026,
    ageRating: "R",
    duration: "2h 52m",
    rating: 8.4,
    poster: "/images/cf_assets_sqe/movies/Odyssey.jpg",
    synopsis:
      "A legendary journey unfolds as Odysseus faces extraordinary challenges on his long voyage home.",
    category: "top-picks",
  },
  {
    id: 4,
    title: "The Batman",
    year: 2022,
    ageRating: "PG-13",
    duration: "2h 56m",
    rating: 7.8,
    poster: "/images/cf_assets_sqe/movies/Batman.jpg",
    synopsis:
      "When a sadistic killer leaves behind a trail of cryptic clues, Batman investigates the corruption within Gotham City.",
    category: "top-picks",
  },
];

export const recentlyAddedMovies = movies.filter(
  (movie) => movie.category === "recently-added"
);

export const topPickMovies = movies.filter(
  (movie) => movie.category === "top-picks"
);
