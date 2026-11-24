import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/app/components/layout/Navbar";
import RegisterForm from "@/app/components/auth/RegisterForm";
import { getCurrentUser } from "@/lib/session";

export default async function RegisterPage() {
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
        <h1>Create account</h1>
        <p>Join a community of film enthusiasts.</p>
        <RegisterForm />
        <p className="auth-switch">
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}