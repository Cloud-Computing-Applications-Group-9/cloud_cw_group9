import { NextResponse } from "next/server";
import { z } from "zod";
import { castVote, removeVote } from "@/lib/mocks/db";
import { getSessionUserId } from "@/lib/mocks/session";

const schema = z.object({ type: z.enum(["up", "down"]) });

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Invalid vote type" }, { status: 400 });
  const result = castVote(id, userId, parsed.data.type);
  if (!result) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json(result);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  const { id } = await ctx.params;
  const result = removeVote(id, userId);
  if (!result) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json(result);
}
