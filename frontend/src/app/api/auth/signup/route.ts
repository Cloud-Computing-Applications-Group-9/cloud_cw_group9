import { NextResponse } from "next/server";
import { z } from "zod";
import { createMockUser, getUserByEmail } from "@/lib/mocks/db";
import { setSessionCookie } from "@/lib/mocks/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  if (getUserByEmail(parsed.data.email)) {
    return NextResponse.json({ message: "Email already registered" }, { status: 400 });
  }
  const user = createMockUser(parsed.data.email, parsed.data.password);
  await setSessionCookie(user.id);
  return NextResponse.json({ user: { id: user.id, email: user.email } }, { status: 201 });
}
