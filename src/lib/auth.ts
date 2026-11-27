"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";

// Where to go after login/register. Only allows paths on this site ("/movies/1"),
// never another website ("//evil.com" or "https://..."), to avoid open redirects.
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
    ? next
    : "/dashboard";
}

export async function register(_prev: unknown, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 8)
    return { error: "Fill in all fields; password must be 8+ characters." };

  if (await prisma.user.findUnique({ where: { email } }))
    return { error: "That email is already registered." };

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 10) },
  });
  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function login(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return { error: "Wrong email or password." };
  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
