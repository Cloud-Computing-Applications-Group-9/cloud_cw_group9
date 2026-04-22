import { cookies } from "next/headers";
import { readSession, signSession } from "./db";

const COOKIE = "session";

export async function setSessionCookie(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, signSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  return readSession(jar.get(COOKIE)?.value);
}
