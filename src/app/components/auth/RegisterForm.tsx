"use client";

import { useActionState } from "react";
import { register } from "@/lib/auth";

export default function RegisterForm() {
  const [state, action, pending] = useActionState(register, undefined);

  return (
    <form action={action} className="auth-form">
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
