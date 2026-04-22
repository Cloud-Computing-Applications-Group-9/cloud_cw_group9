import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "./api";
import type { User } from "./types";

export const getCurrentUser = cache(async (): Promise<User | null> => {
  return auth.me();
});

export async function requireUser(nextPath: string = "/"): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}
