import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase, Globe, Tag } from "lucide-react";
import { salaries } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { ApiError } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { VoteButtons } from "@/components/vote-buttons";
import { formatMoney, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  let submission;
  try {
    submission = await salaries.get(id);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const anonLabel = submission.anonymize ? "Anonymous" : submission.company_name;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            All submissions
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">{submission.role_title}</h1>
              <p className="text-base text-muted-foreground">{anonLabel}</p>
            </div>
            <Badge variant="secondary">{submission.experience_level}</Badge>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold tracking-tight tabular-nums">
              {formatMoney(submission.base_salary, submission.currency)}
            </span>
            <span className="text-sm text-muted-foreground">per year</span>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="space-y-5 pt-6">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field icon={<Globe className="h-4 w-4" />} label="Country" value={submission.country} />
            <Field icon={<Tag className="h-4 w-4" />} label="Currency" value={submission.currency} />
            <Field
              icon={<Briefcase className="h-4 w-4" />}
              label="Status"
              value={<StatusBadge status={submission.status} />}
            />
          </dl>

          <Separator />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Submitted {timeAgo(submission.submitted_at)}
            </div>
            <VoteButtons
              submissionId={submission.id}
              upvotes={submission.upvotes}
              downvotes={submission.downvotes}
              myVote={submission.myVote ?? null}
              isAuthenticated={!!user}
              size="md"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "APPROVED" ? "success" : status === "REJECTED" ? "destructive" : "outline";
  return <Badge variant={variant as "success" | "destructive" | "outline"}>{status}</Badge>;
}
