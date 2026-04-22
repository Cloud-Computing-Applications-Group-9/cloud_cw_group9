import Link from "next/link";
import { FileX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <EmptyState
        icon={<FileX className="h-5 w-5" />}
        title="Submission not found"
        description="It may have been removed or the link is wrong."
        action={
          <Button asChild>
            <Link href="/">Back to feed</Link>
          </Button>
        }
      />
    </div>
  );
}
