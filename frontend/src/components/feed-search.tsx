"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function FeedSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();

  useEffect(() => {
    const t = setTimeout(() => {
      const current = searchParams.get("q") ?? "";
      if (value === current) return;
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      if (value) params.set("q", value);
      else params.delete("q");
      params.delete("page");
      startTransition(() => {
        router.replace(`/?${params.toString()}`);
      });
    }, 250);
    return () => clearTimeout(t);
  }, [value, router, searchParams]);

  return (
    <div className="relative max-w-sm">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search company or role..."
        className="pl-8"
        aria-label="Search submissions"
      />
    </div>
  );
}
