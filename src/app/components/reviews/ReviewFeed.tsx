import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { posterUrl } from "@/lib/tmdb";

interface FeedReview {
  id: string;
  rating: number;
  body: string;
  createdAt: Date;
  user: { name: string };
  movie: { tmdbId: number; title: string; posterPath: string | null; releaseYear: number | null };
}

// "Latest Reviews" on the home page: what people on the site are saying right now
export default function ReviewFeed({ reviews }: { reviews: FeedReview[] }) {
  if (reviews.length === 0) {
    return (
      <p className="section-empty">
        No reviews yet. Find a movie and be the first to share your thoughts!
      </p>
    );
  }

  return (
    <div className="review-feed">
      {reviews.map((review) => (
        <article key={review.id} className="review-feed-item">
          <Link
            href={`/movies/${review.movie.tmdbId}`}
            className="review-feed-poster"
            aria-label={review.movie.title}
          >
            <Image
              src={posterUrl(review.movie.posterPath, "w185")}
              alt=""
              fill
              sizes="72px"
            />
          </Link>
          <div className="review-feed-body">
            <div className="review-feed-top">
              <Link href={`/movies/${review.movie.tmdbId}`} className="review-feed-title">
                {review.movie.title}
                {review.movie.releaseYear && <span> ({review.movie.releaseYear})</span>}
              </Link>
              <span className="movie-review-rating">
                <Star size={16} fill="currentColor" /> {review.rating}/10
              </span>
            </div>
            <p className="review-feed-text">{review.body}</p>
            <p className="review-feed-meta">
              {review.user.name} ·{" "}
              {review.createdAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
