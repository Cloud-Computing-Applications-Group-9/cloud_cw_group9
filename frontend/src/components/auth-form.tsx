"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/api";
import { ApiError } from "@/lib/types";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type Variant = "login" | "register";

export function AuthForm({ variant }: { variant: Variant }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [submitting, setSubmitting] = useState(false);

  const isRegister = variant === "register";
  const form = useForm<LoginInput | RegisterInput>({
    resolver: zodResolver(isRegister ? registerSchema : loginSchema),
    defaultValues: isRegister
      ? { email: "", password: "", confirmPassword: "" }
      : { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput | RegisterInput) {
    setSubmitting(true);
    try {
      if (isRegister) {
        await auth.signup({ email: values.email, password: values.password });
        toast.success("Account created. Welcome!");
      } else {
        await auth.login({ email: values.email, password: values.password });
        toast.success("Welcome back");
      }
      router.refresh();
      router.push(next);
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "Something went wrong. Try again.";
      if (e instanceof ApiError && e.status === 400 && /email/i.test(e.message)) {
        form.setError("email", { message: e.message });
      } else if (e instanceof ApiError && e.status === 401) {
        form.setError("password", { message: "Invalid email or password" });
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  placeholder={isRegister ? "At least 8 characters" : "••••••••"}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isRegister && (
          <FormField
            control={form.control}
            name={"confirmPassword" as const}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Re-enter password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isRegister ? "Create account" : "Sign in"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <Link
                href={`/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
                className="font-medium text-foreground hover:underline"
              >
                Sign in
              </Link>
            </>
          ) : (
            <>
              New here?{" "}
              <Link
                href={`/register${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
                className="font-medium text-foreground hover:underline"
              >
                Create an account
              </Link>
            </>
          )}
        </p>
      </form>
    </Form>
  );
}
