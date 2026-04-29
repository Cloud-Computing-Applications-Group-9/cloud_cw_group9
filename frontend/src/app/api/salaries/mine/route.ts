import { NextResponse } from "next/server";
import { listSubmissions } from "@/lib/mocks/db";
import { getSessionUserId } from "@/lib/mocks/session";
import { proxyBffRequest, shouldUseMockApi } from "@/lib/server/bff-proxy";

export async function GET(req: Request) {
  if (!shouldUseMockApi()) return proxyBffRequest(req, "/api/salaries/mine");

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const data = listSubmissions({ page, pageSize: 9, ownedBy: userId, status: null });
  return NextResponse.json(data);
}
