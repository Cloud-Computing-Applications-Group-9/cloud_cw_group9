import { NextResponse } from "next/server";
import { getSubmission } from "@/lib/mocks/db";
import { getSessionUserId } from "@/lib/mocks/session";
import { proxyBffRequest, shouldUseMockApi } from "@/lib/server/bff-proxy";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!shouldUseMockApi()) {
    return proxyBffRequest(req, `/api/salaries/${encodeURIComponent(id)}`);
  }

  const userId = await getSessionUserId();
  const sub = getSubmission(id, userId);
  if (!sub) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json(sub);
}
