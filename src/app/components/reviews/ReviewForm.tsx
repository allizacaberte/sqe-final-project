"use client";

import { useActionState } from "react";
import { Star } from "lucide-react";
import { saveReview } from "@/lib/reviews";

interface ReviewFormProps {
  tmdbId: number;
  movieTitle: string;
  initialBody?: string;
  initialRating?: number;
}

export default function ReviewForm({
  tmdbId,
  movieTitle,
  initialBody = "",
  initialRating,
}: ReviewFormProps) {
  const [state, action, pending] = useActionState(saveReview, undefined);

  return (
    <form action={action} className="review-form">
      <input type="hidden" name="tmdbId" value={tmdbId} />
      <textarea
        name="body"
        defaultValue={initialBody}
        placeholder="What did you think?"
        aria-label={`Review for ${movieTitle}`}
        minLength={3}
        maxLength={2000}
        required
      />
      {state?.error && (
        <p className="auth-error" role="alert">
          {state.error}
        </p>
      )}
      <div className="review-actions">
        <label className="featured-movie-rating">
          <Star size={42} fill="currentColor" />
          <span>
            <small>Your rating</small>
            <select
              name="rating"
              defaultValue={initialRating ?? ""}
              required
              className="review-rating-select"
            >
              <option value="" disabled>
                –
              </option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}/10
                </option>
              ))}
            </select>
          </span>
        </label>
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
