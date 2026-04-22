import Link from "next/link";
import { Wallet } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { UserMenu } from "@/components/user-menu";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Wallet className="h-4 w-4" />
          </span>
          <span>TechSalary</span>
        </Link>
        <UserMenu user={user} />
      </div>
    </header>
  );
}
