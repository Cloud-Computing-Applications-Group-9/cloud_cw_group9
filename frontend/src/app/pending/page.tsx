import Link from "next/link";
import { Inbox } from "lucide-react";
import { salaries } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { SubmissionCard } from "@/components/submission-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface SearchParams {
  page?: string;
}

export default async function PendingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [user, data] = await Promise.all([
    getCurrentUser(),
    salaries.listPending({ page }),
  ]);

  const items = data.items ?? [];
  const pageSize = data.pageSize ?? items.length ?? 0;
  const total = data.total ?? items.length;
  const hasPrev = page > 1;
  const hasNext = pageSize > 0 && page * pageSize < total;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Pending submissions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Awaiting community review. Upvote accurate salaries — {3} upvotes publishes a submission.
        </p>
      </section>

      {items.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-5 w-5" />}
          title="No pending submissions"
          description="All submissions have been reviewed. Check back later."
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
              href={page > 2 ? `/pending?page=${page - 1}` : "/pending"}
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
              href={`/pending?page=${page + 1}`}
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
