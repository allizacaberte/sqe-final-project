import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/app/components/layout/Navbar";
import LoginForm from "@/app/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/session";

export default async function LoginPage() {
  // Already logged in? Skip the form.
  if (await getCurrentUser()) redirect("/dashboard");

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
        <LoginForm />
        <p className="auth-switch">
          Don't have an account? <Link href="/register">Sign up</Link>
        </p>
      </section>
    </main>
  );
}