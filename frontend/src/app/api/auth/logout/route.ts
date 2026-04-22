import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/mocks/session";

export async function POST() {
  await clearSessionCookie();
  return new NextResponse(null, { status: 204 });
}
