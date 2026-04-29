import { NextResponse } from "next/server";
import { listSubmissions } from "@/lib/mocks/db";
import { proxyBffRequest, shouldUseMockApi } from "@/lib/server/bff-proxy";

export async function GET(req: Request) {
  if (!shouldUseMockApi()) return proxyBffRequest(req, "/api/salaries/pending");

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const data = listSubmissions({ page, pageSize: 9, status: "PENDING" });
  return NextResponse.json(data);
}
