import { NextResponse } from "next/server";
import { getUserById } from "@/lib/mocks/db";
import { getSessionUserId } from "@/lib/mocks/session";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  const user = getUserById(userId);
  if (!user) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  return NextResponse.json({ user: { id: user.id, email: user.email } });
}
