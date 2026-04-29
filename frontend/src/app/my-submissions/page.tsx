import Link from "next/link";
import { Inbox, Plus } from "lucide-react";
import { salaries } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { SubmissionCard } from "@/components/submission-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface SearchParams {
  page?: string;
}

export default async function MySubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const user = await requireUser("/my-submissions");
  const data = await salaries.listMine({ page });

  const items = data.items ?? [];
  const pageSize = data.pageSize ?? items.length ?? 0;
  const total = data.total ?? items.length;
  const hasPrev = page > 1;
  const hasNext = pageSize > 0 && page * pageSize < total;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My submissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Salaries you have submitted — pending and approved.
          </p>
        </div>
        <Button asChild>
          <Link href="/submissions/new">
            <Plus className="h-4 w-4" />
            Submit salary
          </Link>
        </Button>
      </section>

      {items.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-5 w-5" />}
          title="No submissions yet"
          description="You haven't submitted any salaries. Be the first to contribute."
          action={
            <Button asChild>
              <Link href="/submissions/new">Submit your first salary</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <div key={s.id} className="relative">
              <Badge
                variant={s.status === "APPROVED" ? "default" : "secondary"}
                className="absolute right-3 top-3 z-10"
              >
                {s.status}
              </Badge>
              <SubmissionCard submission={s} isAuthenticated={true} />
            </div>
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
              href={page > 2 ? `/my-submissions?page=${page - 1}` : "/my-submissions"}
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
              href={`/my-submissions?page=${page + 1}`}
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
