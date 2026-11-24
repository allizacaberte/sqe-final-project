import Image from "next/image";
import Link from "next/link";
import Navbar from "@/app/components/layout/Navbar";

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <Navbar />
      <div className="auth-visual">
        <Image
          src="/images/cf_assets_sqe/background/CF Home bg.png"
          alt=""
          fill
          priority
          className="auth-visual-image"
        />
        <div className="auth-visual-overlay" />
      </div>
      <section className="auth-panel">
        <h1>Create account</h1>
        <p>Join a community of film enthusiasts.</p>
        <form className="auth-form">
          <label>
            Name
            <input type="text" name="name" placeholder="Your name" required />
          </label>
          <label>
            Email
            <input type="email" name="email" placeholder="you@example.com" required />
          </label>
          <label>
            Password
            <input type="password" name="password" placeholder="Create a password" required />
          </label>
          <Link href="/dashboard" className="btn-primary auth-submit">
            Sign Up
          </Link>
        </form>
        <p className="auth-switch">
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}