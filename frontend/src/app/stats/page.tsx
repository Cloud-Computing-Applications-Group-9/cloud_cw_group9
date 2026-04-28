import { BarChart3, TrendingUp, Users, Wallet } from "lucide-react";
import { stats as statsApi } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/empty-state";
import { StatsFilters } from "@/components/stats-filters";
import { ApiError } from "@/lib/types";

export const dynamic = "force-dynamic";

interface SearchParams {
  role?: string;
  experience_level?: string;
  country?: string;
  currency?: string;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDecimal(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

interface SummaryStatProps {
  label: string;
  value: string;
  hint?: string;
}

function SummaryStat({ label, value, hint }: SummaryStatProps) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filters = {
    role: sp.role?.trim() || undefined,
    experience_level: sp.experience_level || undefined,
    country: sp.country?.trim() || undefined,
    currency: sp.currency || undefined,
  };

  let data: Awaited<ReturnType<typeof statsApi.get>> | null = null;
  let errorMessage: string | null = null;
  try {
    data = await statsApi.get(filters);
  } catch (e) {
    errorMessage =
      e instanceof ApiError
        ? `Stats service error (${e.status}): ${e.message}`
        : "Could not reach the stats service.";
  }

  const overall = data?.overall;
  const empty = !data || (overall?.count ?? 0) === 0;
  const activeFilters = [
    filters.role && { label: "Role", value: filters.role },
    filters.experience_level && {
      label: "Experience",
      value: filters.experience_level,
    },
    filters.country && { label: "Country", value: filters.country },
    filters.currency && { label: "Currency", value: filters.currency },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <section className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BarChart3 className="h-4 w-4" />
          Salary statistics
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Compensation overview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aggregated from approved community submissions. Filter to drill into
          specific roles, levels, or markets.
        </p>
      </section>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Narrow the dataset before reading the numbers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatsFilters />
          {activeFilters.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Active:</span>
              {activeFilters.map((f) => (
                <Badge key={f.label} variant="secondary">
                  {f.label}: {f.value}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {errorMessage ? (
        <EmptyState
          icon={<TrendingUp className="h-5 w-5" />}
          title="Stats unavailable"
          description={errorMessage}
        />
      ) : empty ? (
        <EmptyState
          icon={<TrendingUp className="h-5 w-5" />}
          title="No data for this filter"
          description="No approved submissions match. Try loosening the filters or come back once more salaries have been approved."
        />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Overall</CardTitle>
                  <CardDescription>
                    Across {formatNumber(overall!.count)} approved submission
                    {overall!.count === 1 ? "" : "s"}
                  </CardDescription>
                </div>
                <Wallet className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                <SummaryStat
                  label="Average"
                  value={formatDecimal(overall!.avg)}
                />
                <SummaryStat
                  label="Median"
                  value={formatDecimal(overall!.median)}
                />
                <SummaryStat
                  label="P25"
                  value={formatDecimal(overall!.p25)}
                  hint="Lower quartile"
                />
                <SummaryStat
                  label="P75"
                  value={formatDecimal(overall!.p75)}
                  hint="Upper quartile"
                />
                <SummaryStat label="Min" value={formatDecimal(overall!.min)} />
                <SummaryStat label="Max" value={formatDecimal(overall!.max)} />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>By experience level</CardTitle>
                    <CardDescription>
                      Median and range per seniority bucket
                    </CardDescription>
                  </div>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {data!.byExperience.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data.</p>
                ) : (
                  <ul className="divide-y">
                    {data!.byExperience.map((row) => (
                      <li
                        key={row.experience_level}
                        className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                      >
                        <div>
                          <p className="font-medium">{row.experience_level}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(row.count)} submission
                            {row.count === 1 ? "" : "s"} · range{" "}
                            {formatDecimal(row.p25)}–{formatDecimal(row.p75)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold tabular-nums">
                            {formatDecimal(row.median)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            median
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Top roles</CardTitle>
                    <CardDescription>
                      Most reported roles in this slice
                    </CardDescription>
                  </div>
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {data!.topRoles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data.</p>
                ) : (
                  <ul className="divide-y">
                    {data!.topRoles.map((row) => (
                      <li
                        key={row.role_title}
                        className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {row.role_title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            avg {formatDecimal(row.avg)} · range{" "}
                            {formatDecimal(row.min)}–{formatDecimal(row.max)}
                          </p>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {formatNumber(row.count)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {data!.byCurrency.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Currency mix</CardTitle>
                <CardDescription>
                  Submission counts per reported currency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  {data!.byCurrency.map((row, idx) => (
                    <span key={row.currency} className="flex items-center">
                      <Badge variant="outline">
                        {row.currency} · {formatNumber(row.count)}
                      </Badge>
                      {idx < data!.byCurrency.length - 1 && (
                        <Separator
                          orientation="vertical"
                          className="mx-2 h-4"
                        />
                      )}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
