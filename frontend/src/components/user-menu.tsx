"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/api";
import type { User } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initialsFromEmail } from "@/lib/utils";

export function UserMenu({ user }: { user: User | null }) {
  const router = useRouter();

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">Log in</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/register">Sign up</Link>
        </Button>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await auth.logout();
      toast.success("Logged out");
      router.refresh();
      router.push("/");
    } catch {
      toast.error("Couldn't log out. Try again.");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" asChild className="hidden sm:inline-flex">
        <Link href="/submissions/new">
          <Plus className="h-4 w-4" />
          Submit salary
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Account menu"
          >
            <Avatar>
              <AvatarFallback>{initialsFromEmail(user.email)}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Signed in as</span>
              <span className="truncate text-sm font-medium">{user.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="sm:hidden">
            <Link href="/submissions/new">
              <Plus className="h-4 w-4" />
              Submit salary
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/">
              <UserIcon className="h-4 w-4" />
              Browse salaries
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
