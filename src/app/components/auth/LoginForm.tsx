"use client";

import { useActionState } from "react";
import { login } from "@/lib/auth";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="auth-form">
      <label>
        Email
        <input type="email" name="email" placeholder="you@example.com" required />
      </label>
      <label>
        Password
        <input type="password" name="password" placeholder="Enter your password" required />
      </label>
      {state?.error && (
        <p className="auth-error" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn-primary auth-submit" disabled={pending}>
        {pending ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
