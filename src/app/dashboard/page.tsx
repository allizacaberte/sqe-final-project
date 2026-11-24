import Image from "next/image";
import Link from "next/link";
import { BookOpenText, Star } from "lucide-react";
import Navbar from "@/app/components/layout/Navbar";
import Footer from "@/app/components/layout/Footer";
import { redirect } from "next/navigation";
import { movies } from "@/app/data/movies";
import { getCurrentUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const journal = [movies[0], movies[2], movies[1]];
  const comments = [
    "An unforgettable story with beautiful animation and heart.",
    "A bold, ambitious journey that stays with you long after the credits.",
    "A charming and memorable adventure with a strong, inspiring lead.",
  ];

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
            {journal.map((movie, index) => (
              <article className="journal-entry" key={movie.id}>
                <div className="journal-entry-poster">
                  <Image
                    src={movie.poster}
                    alt={`${movie.title} poster`}
                    fill
                    sizes="145px"
                  />
                </div>

                <div className="journal-entry-body">
                  <div className="journal-entry-top">
                    <h2>{movie.title}</h2>
                    <div className="journal-rating">
                      <Star size={28} fill="currentColor" />
                      <span>{Math.round(movie.rating)}/10</span>
                    </div>
                  </div>

                  <p>{comments[index]}</p>

                  <div className="journal-entry-footer">
                    <Link
                      href={`/reviews/${movie.id}`}
                      className="journal-edit"
                    >
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