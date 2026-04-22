"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16">
      <EmptyState
        icon={<AlertTriangle className="h-5 w-5" />}
        title="Something went wrong"
        description={error.message || "We couldn't load submissions. Please try again."}
        action={
          <Button onClick={reset} variant="outline">
            Try again
          </Button>
        }
      />
    </div>
  );
}
