
import Image from "next/image";
import Link from "next/link";
import { Award, CalendarClock, Clapperboard, Flame, MessageSquareText, Tags } from "lucide-react";

import Navbar from "@/app/components/layout/Navbar";
import Footer from "@/app/components/layout/Footer";
import MovieCard from "@/app/components/layout/MovieCard";
import MovieRail from "@/app/components/layout/MovieRail";
import FeaturedMovie from "@/app/components/layout/FeaturedMovie";
import GenreChips from "@/app/components/layout/GenreChips";
import ReviewFeed from "@/app/components/reviews/ReviewFeed";

import { getCurrentUser } from "@/lib/session";
import { getAcclaimed, getGenres, getNowPlaying, getPopular, getUpcoming } from "@/lib/tmdb";
import { getLatestReviews, getTopPicks, withRatings } from "@/lib/ratings";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const user = await getCurrentUser();

  // Movie lists come from TMDB; ratings, Top Picks and reviews come from our database.
  // Everything is fetched at the same time so the page loads faster.
  const [nowPlaying, popular, upcoming, acclaimed, genres, topPicks, latestReviews] =
    await Promise.all([
      getNowPlaying(9),
      getPopular(8),
      getUpcoming(8),
      getAcclaimed(8),
      getGenres(),
      getTopPicks(6),
      getLatestReviews(4),
    ]);

  const [nowRated, popularRated, upcomingRated, acclaimedRated] = await Promise.all([
    withRatings(nowPlaying),
    withRatings(popular),
    withRatings(upcoming),
    withRatings(acclaimed),
  ]);
  const [featuredMovie, ...nowShowing] = nowRated;

  const latestForFeatured = featuredMovie
    ? await prisma.review.findFirst({
        where: { movie: { tmdbId: featuredMovie.id } },
        orderBy: { createdAt: "desc" },
        select: { body: true, user: { select: { name: true } } },
      })
    : null;

  return (
    <div className="site-shell">
      <Navbar isLoggedIn={!!user} />
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

        {/* Newest release in cinemas, featured big */}
        <section className="container landing-section">
          <h2 className="section-title">
            <span className="section-icon" aria-hidden="true">●</span>
            Recently Added
          </h2>
          {featuredMovie && (
            <FeaturedMovie
              movie={featuredMovie}
              latestReview={
                latestForFeatured && {
                  author: latestForFeatured.user.name,
                  body: latestForFeatured.body,
                }
              }
            />
          )}
        </section>

        {/* Highest average rating from OUR users */}
        <section className="container landing-section">
          <h2 className="section-title">
            <span className="section-icon popcorn" aria-hidden="true">▾</span>
            Top Picks
          </h2>
          <p className="section-subtitle">The highest-rated movies by Critic&apos;s Frame members.</p>
          {topPicks.length > 0 ? (
            <div className="top-picks-grid">
              {topPicks.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <p className="section-empty">
              No ratings yet. <Link href="/search">Review a movie</Link> to start the Top Picks!
            </p>
          )}
        </section>

        {/* What people are saying right now */}
        <section className="container landing-section">
          <h2 className="section-title">
            <span className="section-icon popcorn" aria-hidden="true">
              <MessageSquareText size={26} />
            </span>
            Latest Reviews
          </h2>
          <ReviewFeed reviews={latestReviews} />
        </section>

        <MovieRail title="Now Showing" icon={<Clapperboard size={26} />} movies={nowShowing} />
        <MovieRail title="Popular Right Now" icon={<Flame size={26} />} movies={popularRated} />
        <MovieRail title="Coming Soon" icon={<CalendarClock size={26} />} movies={upcomingRated} />
        <MovieRail title="Critically Acclaimed" icon={<Award size={26} />} movies={acclaimedRated} />

        <section className="container landing-section">
          <h2 className="section-title">
            <span className="section-icon popcorn" aria-hidden="true">
              <Tags size={26} />
            </span>
            Browse by Genre
          </h2>
          <GenreChips genres={genres} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
