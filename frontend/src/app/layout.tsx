import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "TechSalary — Community-powered salary transparency",
  description:
    "Browse and submit tech salaries. Upvote accuracy, downvote outliers. Anonymous or attributed.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <div className="flex min-h-screen flex-col">
          <Suspense fallback={null}>
            <SiteHeader />
          </Suspense>
          <main className="flex-1">{children}</main>
          <footer className="border-t py-6 text-center text-xs text-muted-foreground">
            TechSalary · Cloud Computing Group 9
          </footer>
        </div>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
