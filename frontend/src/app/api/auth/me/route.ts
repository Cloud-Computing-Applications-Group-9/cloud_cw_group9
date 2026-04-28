import { NextResponse } from "next/server";
import { getUserById } from "@/lib/mocks/db";
import { getSessionUserId } from "@/lib/mocks/session";
import { proxyBffRequest, shouldUseMockApi } from "@/lib/server/bff-proxy";

export async function GET(req: Request) {
  if (!shouldUseMockApi()) return proxyBffRequest(req, "/api/auth/me");

  const userId = await getSessionUserId();
  if (!userId)
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  const user = getUserById(userId);
  if (!user)
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  return NextResponse.json({ user: { id: user.id, email: user.email } });
}
