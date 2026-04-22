import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserByEmail, verifyPassword } from "@/lib/mocks/db";
import { setSessionCookie } from "@/lib/mocks/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }
  const user = getUserByEmail(parsed.data.email);
  if (!user || !verifyPassword(user, parsed.data.password)) {
    return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
  }
  await setSessionCookie(user.id);
  return NextResponse.json({ user: { id: user.id, email: user.email } });
}
