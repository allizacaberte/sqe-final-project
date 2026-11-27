import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/app/components/layout/Navbar";
import Footer from "@/app/components/layout/Footer";
import ReviewForm from "@/app/components/reviews/ReviewForm";
import { getCurrentUser } from "@/lib/session";
import { formatMeta, getMovie } from "@/lib/tmdb";
import { prisma } from "@/lib/prisma";

// Write or edit your review. [id] is the TMDB movie id.
export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Not logged in? Send them to login, then straight back here afterwards
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/reviews/${encodeURIComponent(id)}`);

  const movie = await getMovie(Number(id));
  if (!movie) notFound();

  // Already reviewed? Pre-fill the form so this page works as "Edit" too
  const existing = await prisma.review.findFirst({
    where: { userId: user.id, movie: { tmdbId: movie.id } },
  });

  return (
    <div className="site-shell">
      <Navbar isLoggedIn />
      <main className="review-page">
        <div className="container review-layout">
          <div className="review-poster">
            <Image src={movie.poster} alt={`${movie.title} poster`} fill sizes="430px" priority />
          </div>
          <section className="review-details">
            <div className="review-title">
              <h1>{movie.title}</h1>
              <span>{formatMeta(movie)}</span>
            </div>
            <h2>{existing ? "Edit your review" : "Your review"}</h2>
            <ReviewForm
              tmdbId={movie.id}
              movieTitle={movie.title}
              initialBody={existing?.body}
              initialRating={existing?.rating}
            />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
