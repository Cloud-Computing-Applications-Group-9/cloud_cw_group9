import { NextResponse } from "next/server";
import { salarySubmissionSchema } from "@/lib/validators";
import { createSubmission, listSubmissions } from "@/lib/mocks/db";
import { getSessionUserId } from "@/lib/mocks/session";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const q = url.searchParams.get("q") ?? undefined;
  const userId = await getSessionUserId();
  const data = listSubmissions({ page, pageSize: 9, q: q || undefined, userId });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  const parsed = salarySubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const sub = createSubmission(parsed.data);
  return NextResponse.json(sub, { status: 201 });
}
