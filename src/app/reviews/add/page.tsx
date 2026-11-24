import Link from "next/link";

export default function AddReviewPage() {
  return (
    <main className="auth-page">
      <section className="auth-panel" style={{ gridColumn: "1 / -1" }}>
        <h1>Add a review</h1><p>Select a movie and share your thoughts.</p>
        <Link href="/" className="btn-primary">Back to movies</Link>
      </section>
    </main>
  );
}