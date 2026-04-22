import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function SubmissionCardSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-14" />
        </div>
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-7 w-32" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

export function FeedSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <SubmissionCardSkeleton key={i} />
      ))}
    </div>
  );
}
