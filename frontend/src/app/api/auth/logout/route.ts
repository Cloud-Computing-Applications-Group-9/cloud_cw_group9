import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/mocks/session";
import { proxyBffRequest, shouldUseMockApi } from "@/lib/server/bff-proxy";

export async function POST(req: Request) {
  if (!shouldUseMockApi()) return proxyBffRequest(req, "/api/auth/logout");

  await clearSessionCookie();
  return new NextResponse(null, { status: 204 });
}
