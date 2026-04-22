import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <Skeleton className="mb-6 h-8 w-36" />
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-10 w-48" />
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <Skeleton className="h-9 w-40" />
        </CardContent>
      </Card>
    </div>
  );
}
