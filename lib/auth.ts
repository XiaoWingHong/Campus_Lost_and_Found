import { cookies } from "next/headers";
import { getUserById } from "./db";
import type { SessionPayload, User } from "@/types";

const SESSION_COOKIE = "session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

function encodeSession(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

function decodeSession(token: string): SessionPayload | null {
  try {
    const decoded = JSON.parse(
      Buffer.from(token, "base64").toString("utf-8")
    ) as SessionPayload;
    if (decoded.exp < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function createSession(
  userId: string,
  role: string
): Promise<void> {
  const payload: SessionPayload = {
    userId,
    role: role as SessionPayload["role"],
    exp: Date.now() + SESSION_DURATION_MS,
  };

  const token = encodeSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_MS / 1000,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decodeSession(token);
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  const user = getUserById(session.userId);
  if (!user || !user.isActive) return null;
  return user;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  if (user.role !== "admin") throw new Error("Forbidden");
  return user;
}
