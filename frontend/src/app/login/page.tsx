import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [user, sp] = await Promise.all([getCurrentUser(), searchParams]);
  if (user) redirect(sp.next || "/");

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to vote on salaries and submit your own.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <AuthForm variant="login" />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
