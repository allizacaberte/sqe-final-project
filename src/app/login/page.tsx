import Image from "next/image";
import Link from "next/link";
import Navbar from "@/app/components/layout/Navbar";

export default function LoginPage() {
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
        <h1>Welcome back</h1>
        <p>Sign in to continue to your movie journal.</p>
        <form className="auth-form">
          <label>
            Email
            <input type="email" name="email" placeholder="you@example.com" required />
          </label>
          <label>
            Password
            <input type="password" name="password" placeholder="Enter your password" required />
          </label>
          <Link href="/dashboard" className="btn-primary auth-submit">
            Login
          </Link>
        </form>
        <p className="auth-switch">
          Don't have an account? <Link href="/register">Sign up</Link>
        </p>
      </section>
    </main>
  );
}