import Image from "next/image";
import Link from "next/link";
import { BookOpenText, Star } from "lucide-react";
import Navbar from "@/app/components/layout/Navbar";
import Footer from "@/app/components/layout/Footer";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { posterUrl } from "@/lib/tmdb";
import { deleteReview } from "@/lib/reviews";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const reviews = await prisma.review.findMany({
    where: { userId: user.id },
    include: { movie: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="site-shell">
      <Navbar isLoggedIn={!!user} />
      <main className="journal-page">
        <div className="container">
          <div className="journal-header">
            <BookOpenText size={32} color="var(--gold)" />
            <h1>My Movie Journal</h1>
          </div>

          <div className="journal-list">
            {reviews.length === 0 && (
              <p className="journal-empty">
                You haven&apos;t reviewed anything yet. <Link href="/">Find a movie</Link>
              </p>
            )}

            {reviews.map((review) => (
              <article className="journal-entry" key={review.id}>
                <div className="journal-entry-poster">
                  <Image
                    src={posterUrl(review.movie.posterPath, "w342")}
                    alt={`${review.movie.title} poster`}
                    fill
                    sizes="145px"
                  />
                </div>

                <div className="journal-entry-body">
                  <div className="journal-entry-top">
                    <h2>
                      <Link href={`/movies/${review.movie.tmdbId}`}>{review.movie.title}</Link>
                    </h2>
                    <div className="journal-rating">
                      <Star size={28} fill="currentColor" />
                      <span>{review.rating}/10</span>
                    </div>
                  </div>

                  <p>{review.body}</p>

                  <div className="journal-entry-footer">
                    <form action={deleteReview.bind(null, review.id)}>
                      <button type="submit" className="journal-delete">
                        Delete
                      </button>
                    </form>
                    <Link href={`/reviews/${review.movie.tmdbId}`} className="journal-edit">
                      Edit
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
