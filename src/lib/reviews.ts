"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getMovie } from "@/lib/tmdb";

export async function saveReview(_prev: unknown, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tmdbId = Number(formData.get("tmdbId"));
  const rating = Number(formData.get("rating"));
  const body = String(formData.get("body") ?? "").trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 10)
    return { error: "Pick a rating from 1 to 10." };
  if (body.length < 3) return { error: "Write a few words for your review." };
  if (body.length > 2000) return { error: "Keep your review under 2000 characters." };

  const m = await getMovie(tmdbId);
  if (!m) return { error: "That movie couldn't be found." };

  // Save (or refresh) our local copy of the movie so the review has something to point to
  const movieData = {
    title: m.title,
    releaseYear: m.year,
    runtimeMin: m.runtimeMin,
    ageRating: m.ageRating,
    posterPath: m.posterPath,
    syncedAt: new Date(),
  };
  const movie = await prisma.movie.upsert({
    where: { tmdbId: m.id },
    create: { tmdbId: m.id, ...movieData },
    update: movieData,
  });

  // One review per user per movie: create it the first time, update it after that
  await prisma.review.upsert({
    where: { userId_movieId: { userId: user.id, movieId: movie.id } },
    create: { userId: user.id, movieId: movie.id, rating, body },
    update: { rating, body },
  });

  revalidatePath("/");
  revalidatePath(`/movies/${m.id}`);
  redirect("/dashboard");
}

export async function deleteReview(reviewId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // The userId check means people can only delete their own reviews
  await prisma.review.deleteMany({ where: { id: reviewId, userId: user.id } });
  revalidatePath("/dashboard");
}
