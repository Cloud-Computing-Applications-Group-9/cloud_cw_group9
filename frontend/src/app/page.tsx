import Link from "next/link";
import { Inbox, Plus } from "lucide-react";
import { salaries } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { SubmissionCard } from "@/components/submission-card";
import { EmptyState } from "@/components/empty-state";
import { FeedSearch } from "@/components/feed-search";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface SearchParams {
  page?: string;
  q?: string;
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q?.trim() || undefined;

  const [user, data] = await Promise.all([
    getCurrentUser(),
    salaries.list({ page, q }),
  ]);

  const items = data.items ?? [];
  const pageSize = data.pageSize ?? items.length ?? 0;
  const total = data.total ?? items.length;
  const hasPrev = page > 1;
  const hasNext = pageSize > 0 && page * pageSize < total;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Salary submissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Community-verified salaries. Upvote ones you trust, downvote outliers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FeedSearch />
          <Button asChild>
            <Link href="/submissions/new">
              <Plus className="h-4 w-4" />
              Submit salary
            </Link>
          </Button>
        </div>
      </section>

      {items.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-5 w-5" />}
          title={q ? "No matches" : "No submissions yet"}
          description={
            q
              ? `Nothing found for "${q}". Try a broader search.`
              : "Be the first to contribute — your submission helps the whole community."
          }
          action={
            !q ? (
              <Button asChild>
                <Link href="/submissions/new">Submit the first salary</Link>
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <SubmissionCard key={s.id} submission={s} isAuthenticated={!!user} />
          ))}
        </div>
      )}

      {(hasPrev || hasNext) && (
        <nav
          aria-label="Pagination"
          className="mt-8 flex items-center justify-between border-t pt-4"
        >
          <Button variant="outline" size="sm" asChild disabled={!hasPrev}>
            <Link
              href={buildPageHref(page - 1, q)}
              aria-disabled={!hasPrev}
              tabIndex={hasPrev ? 0 : -1}
            >
              ← Previous
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page}
            {total ? ` of ${Math.max(1, Math.ceil(total / Math.max(1, pageSize)))}` : ""}
          </span>
          <Button variant="outline" size="sm" asChild disabled={!hasNext}>
            <Link
              href={buildPageHref(page + 1, q)}
              aria-disabled={!hasNext}
              tabIndex={hasNext ? 0 : -1}
            >
              Next →
            </Link>
          </Button>
        </nav>
      )}
    </div>
  );
}

function buildPageHref(page: number, q?: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (q) params.set("q", q);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}
