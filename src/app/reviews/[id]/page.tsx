import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import Navbar from "@/app/components/layout/Navbar";
import Footer from "@/app/components/layout/Footer";
import { redirect } from "next/navigation";
import { movies } from "@/app/data/movies";
import { getCurrentUser } from "@/lib/session";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  // Writing a review needs an account.
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const movie = movies.find((item) => item.id === Number(id)) ?? movies[0];

  return (
    <div className="site-shell">
      <Navbar isLoggedIn={!!user} />
      <main className="review-page">
        <div className="container review-layout">
          <div className="review-poster"><Image src={movie.poster} alt={`${movie.title} poster`} fill sizes="430px" priority /></div>
          <section className="review-details">
            <div className="review-title"><h1>{movie.title}</h1><span>{movie.year} • {movie.ageRating} • {movie.duration}</span></div>
            <h2>Comments</h2>
            <textarea defaultValue="Lorem ipsum dolor sit amet, consectetur adipiscing elit. This film offers a memorable journey and a perspective worth sharing." aria-label={`Review for ${movie.title}`} />
            <div className="review-actions">
              <div className="featured-movie-rating"><Star size={42} fill="currentColor" /><span><small>Rating</small>{movie.rating}/10</span></div>
              <Link href="/dashboard" className="btn-primary">Save</Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}