import { NextResponse } from "next/server";
import { getSubmission } from "@/lib/mocks/db";
import { getSessionUserId } from "@/lib/mocks/session";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const userId = await getSessionUserId();
  const sub = getSubmission(id, userId);
  if (!sub) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json(sub);
}
