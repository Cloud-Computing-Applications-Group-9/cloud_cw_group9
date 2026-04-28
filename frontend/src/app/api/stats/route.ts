import { NextResponse } from "next/server";
import { listSubmissions } from "@/lib/mocks/db";
import { proxyBffRequest, shouldUseMockApi } from "@/lib/server/bff-proxy";
import type { Submission } from "@/lib/types";

interface Summary {
  avg: number;
  median: number;
  p25: number;
  p75: number;
  min: number;
  max: number;
  count: number;
}

export async function GET(req: Request) {
  if (!shouldUseMockApi()) return proxyBffRequest(req, "/api/stats");

  const url = new URL(req.url);
  const role = url.searchParams.get("role")?.trim() || null;
  const experienceLevel = url.searchParams.get("experience_level") || null;
  const country = url.searchParams.get("country")?.trim() || null;
  const currency = url.searchParams.get("currency") || null;

  const rows = listSubmissions({ page: 1, pageSize: 1000 }).items.filter(
    (row) => {
      if (role && !row.role_title.toLowerCase().includes(role.toLowerCase()))
        return false;
      if (experienceLevel && row.experience_level !== experienceLevel)
        return false;
      if (country && row.country !== country) return false;
      if (currency && row.currency !== currency) return false;
      return true;
    },
  );

  return NextResponse.json({
    overall: summarize(rows),
    byExperience: groupBy(
      rows,
      (row) => row.experience_level,
      "experience_level",
    ),
    topRoles: groupBy(rows, (row) => row.role_title, "role_title").slice(0, 10),
    byCurrency: groupCounts(rows, (row) => row.currency, "currency"),
    filters: {
      role,
      experience_level: experienceLevel,
      country,
      currency,
    },
  });
}

function summarize(rows: Submission[]): Summary {
  const values = rows.map((row) => row.base_salary).sort((a, b) => a - b);
  const count = values.length;
  if (count === 0) {
    return { avg: 0, median: 0, p25: 0, p75: 0, min: 0, max: 0, count: 0 };
  }

  return {
    avg: round(values.reduce((sum, value) => sum + value, 0) / count),
    median: percentile(values, 0.5),
    p25: percentile(values, 0.25),
    p75: percentile(values, 0.75),
    min: round(values[0]),
    max: round(values[count - 1]),
    count,
  };
}

function percentile(values: number[], p: number): number {
  if (values.length === 1) return round(values[0]);
  const index = p * (values.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return round(values[lower] + (values[upper] - values[lower]) * weight);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function groupBy<T extends "experience_level" | "role_title">(
  rows: Submission[],
  keyFn: (row: Submission) => string,
  keyName: T,
): Array<Record<T, string> & Summary> {
  const groups = new Map<string, Submission[]>();
  for (const row of rows) {
    const key = keyFn(row);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  return Array.from(groups.entries())
    .map(
      ([key, groupRows]) =>
        ({ [keyName]: key, ...summarize(groupRows) }) as Record<T, string> &
          Summary,
    )
    .sort((a, b) => b.count - a.count);
}

function groupCounts<T extends "currency">(
  rows: Submission[],
  keyFn: (row: Submission) => string,
  keyName: T,
): Array<Record<T, string> & { count: number }> {
  const counts = new Map<string, number>();
  for (const row of rows)
    counts.set(keyFn(row), (counts.get(keyFn(row)) ?? 0) + 1);

  return Array.from(counts.entries())
    .map(
      ([key, count]) =>
        ({ [keyName]: key, count }) as Record<T, string> & { count: number },
    )
    .sort((a, b) => b.count - a.count);
}
