import { cookies } from "next/headers";

const COOKIE_NAME = "fb_hub_user";
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

interface UserSession {
  email: string;
  name: string;
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export async function setSession(email: string, name: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, JSON.stringify({ email, name }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
