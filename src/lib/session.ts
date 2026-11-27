import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const COOKIE = "session";
const WEEK = 7 * 24 * 60 * 60 * 1000;

export async function createSession(userId: string) {
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + WEEK);
  await prisma.session.create({ data: { id, userId, expiresAt } });
  (await cookies()).set(COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function getCurrentUser() {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id) return null;
  const session = await prisma.session.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function deleteSession() {
  const store = await cookies();
  const id = store.get(COOKIE)?.value;
  if (id) await prisma.session.deleteMany({ where: { id } });
  store.delete(COOKIE);
}
