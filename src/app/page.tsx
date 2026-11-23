
import Image from "next/image";
import Link from "next/link";

import Navbar from "@/app/components/layout/Navbar";
import Footer from "@/app/components/layout/Footer";
import MovieCard from "@/app/components/layout/MovieCard";
import FeaturedMovie from "@/app/components/layout/FeaturedMovie";

import {
  recentlyAddedMovies,
  topPickMovies,
} from "@/app/data/movies";

export default function Home() {
  const featuredMovie = recentlyAddedMovies[0];

  return (
    <div className="site-shell">
      <Navbar />
      <main className="landing-main">
        <section className="hero-section">
          <Image
            src="/images/cf_assets_sqe/background/CF Home bg.png"
            alt=""
            fill
            priority
            className="hero-background"
          />
          <div className="hero-shade" />
        </section>

        <section className="container landing-section">
          <h2 className="section-title">
            <span className="section-icon" aria-hidden="true">●</span>
            Recently Added
          </h2>
          {featuredMovie && <FeaturedMovie movie={featuredMovie} />}
        </section>

        <section className="container landing-section">
          <h2 className="section-title">
            <span className="section-icon popcorn" aria-hidden="true">▾</span>
            Top picks
          </h2>
          <div className="top-picks-grid">
            {topPickMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
