import Link from "next/link";
import { Briefcase, MapPin } from "lucide-react";
import type { Submission } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { VoteButtons } from "@/components/vote-buttons";
import { formatMoney, timeAgo } from "@/lib/utils";

export function SubmissionCard({
  submission,
  isAuthenticated,
}: {
  submission: Submission;
  isAuthenticated: boolean;
}) {
  const anonLabel = submission.anonymize ? "Anonymous" : submission.company_name;
  return (
    <Card className="flex h-full flex-col overflow-hidden hover:shadow-md">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/submissions/${submission.id}`}
            className="truncate text-base font-semibold hover:underline focus-visible:outline-none focus-visible:underline"
          >
            {submission.role_title}
          </Link>
          <Badge variant="secondary" className="shrink-0">
            {submission.experience_level}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5 truncate">
            <Briefcase className="h-3.5 w-3.5" />
            <span className="truncate">{anonLabel}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {submission.country}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="text-2xl font-bold tracking-tight tabular-nums">
          {formatMoney(submission.base_salary, submission.currency)}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Submitted {timeAgo(submission.submitted_at)}
        </p>
      </CardContent>
      <CardFooter className="justify-between">
        <Link
          href={`/submissions/${submission.id}`}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          View details →
        </Link>
        <VoteButtons
          submissionId={submission.id}
          upvotes={submission.upvotes}
          downvotes={submission.downvotes}
          myVote={submission.myVote ?? null}
          isAuthenticated={isAuthenticated}
        />
      </CardFooter>
    </Card>
  );
}
