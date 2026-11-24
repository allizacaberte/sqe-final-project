"use client";

import { useActionState } from "react";
import { register } from "@/lib/auth";

// `next` = the page to return to after signing up (e.g. the movie you wanted to review)
export default function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(register, undefined);

  return (
    <form action={action} className="auth-form">
      {next && <input type="hidden" name="next" value={next} />}
      <label>
        Username
        <input type="text" name="name" placeholder="Your Username" required />
      </label>
      <label>
        Email
        <input
          type="email"
          name="email"
          placeholder="you@example.com"
          required
        />
      </label>
      <label>
        Password
        <input
          type="password"
          name="password"
          placeholder="Create a password (8+ characters)"
          minLength={8}
          required
        />
      </label>
      {state?.error && (
        <p className="auth-error" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        className="btn-primary auth-submit"
        disabled={pending}
      >
        {pending ? "Creating account..." : "Sign Up"}
      </button>
    </form>
  );
}
