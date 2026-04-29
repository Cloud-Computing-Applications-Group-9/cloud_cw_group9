import Link from "next/link";
import { BarChart3, Clock, Wallet } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { UserMenu } from "@/components/user-menu";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Wallet className="h-4 w-4" />
            </span>
            <span>TechSalary</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/stats"
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Stats</span>
            </Link>
            <Link
              href="/pending"
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Clock className="h-4 w-4" />
              <span>Pending</span>
            </Link>
          </nav>
        </div>
        <UserMenu user={user} />
      </div>
    </header>
  );
}
