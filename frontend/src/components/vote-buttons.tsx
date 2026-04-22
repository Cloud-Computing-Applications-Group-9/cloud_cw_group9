"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import { toast } from "sonner";
import { ApiError, type VoteType } from "@/lib/types";
import { votes } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface VoteButtonsProps {
  submissionId: string;
  upvotes: number;
  downvotes: number;
  myVote?: VoteType | null;
  isAuthenticated: boolean;
  size?: "sm" | "md";
}

export function VoteButtons({
  submissionId,
  upvotes,
  downvotes,
  myVote = null,
  isAuthenticated,
  size = "sm",
}: VoteButtonsProps) {
  const router = useRouter();
  const [state, setState] = useState({ upvotes, downvotes, myVote });
  const [isPending, startTransition] = useTransition();

  const handleVote = (type: VoteType) => {
    if (!isAuthenticated) {
      const next = encodeURIComponent(
        typeof window !== "undefined" ? window.location.pathname : "/",
      );
      toast.message("Sign in to vote", {
        description: "Create a free account to help validate submissions.",
        action: { label: "Sign in", onClick: () => router.push(`/login?next=${next}`) },
      });
      return;
    }

    const prev = state;
    const removing = state.myVote === type;

    const optimistic = { ...state };
    if (removing) {
      optimistic.myVote = null;
      if (type === "up") optimistic.upvotes = Math.max(0, optimistic.upvotes - 1);
      else optimistic.downvotes = Math.max(0, optimistic.downvotes - 1);
    } else {
      if (state.myVote === "up") optimistic.upvotes = Math.max(0, optimistic.upvotes - 1);
      if (state.myVote === "down") optimistic.downvotes = Math.max(0, optimistic.downvotes - 1);
      if (type === "up") optimistic.upvotes += 1;
      else optimistic.downvotes += 1;
      optimistic.myVote = type;
    }
    setState(optimistic);

    startTransition(async () => {
      try {
        const result = removing ? await votes.remove(submissionId) : await votes.cast(submissionId, type);
        setState(result);
        router.refresh();
      } catch (e) {
        setState(prev);
        const msg =
          e instanceof ApiError ? e.message : "Couldn't record your vote. Try again.";
        toast.error(msg);
      }
    });
  };

  const btnSize = size === "md" ? "default" : "sm";

  return (
    <div
      className="inline-flex items-center rounded-md border bg-background"
      aria-label="Vote on submission"
    >
      <Button
        type="button"
        variant="ghost"
        size={btnSize}
        onClick={() => handleVote("up")}
        disabled={isPending}
        aria-pressed={state.myVote === "up"}
        aria-label={`Upvote (${state.upvotes})`}
        className={cn(
          "rounded-r-none rounded-l-md gap-1.5",
          state.myVote === "up" && "bg-success/15 text-success hover:bg-success/25",
        )}
      >
        <ArrowUp className="h-4 w-4" />
        <span className="tabular-nums">{state.upvotes}</span>
      </Button>
      <span className="h-5 w-px bg-border" aria-hidden />
      <Button
        type="button"
        variant="ghost"
        size={btnSize}
        onClick={() => handleVote("down")}
        disabled={isPending}
        aria-pressed={state.myVote === "down"}
        aria-label={`Downvote (${state.downvotes})`}
        className={cn(
          "rounded-l-none rounded-r-md gap-1.5",
          state.myVote === "down" && "bg-destructive/15 text-destructive hover:bg-destructive/25",
        )}
      >
        <ArrowDown className="h-4 w-4" />
        <span className="tabular-nums">{state.downvotes}</span>
      </Button>
    </div>
  );
}
