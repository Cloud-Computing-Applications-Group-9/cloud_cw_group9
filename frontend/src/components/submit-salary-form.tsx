"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { salaries } from "@/lib/api";
import { ApiError, CURRENCIES, EXPERIENCE_LEVELS } from "@/lib/types";
import {
  salarySubmissionSchema,
  type SalarySubmissionInput,
} from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SubmitSalaryForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<SalarySubmissionInput>({
    resolver: zodResolver(salarySubmissionSchema),
    defaultValues: {
      company_name: "",
      role_title: "",
      experience_level: "Mid",
      country: "Sri Lanka",
      base_salary: 0,
      currency: "LKR",
      anonymize: false,
    },
  });

  async function onSubmit(values: SalarySubmissionInput) {
    setSubmitting(true);
    try {
      const created = await salaries.create(values);
      toast.success("Salary submitted", {
        description: "Pending review by the community.",
      });
      router.refresh();
      router.push(`/submissions/${created.id}`);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Couldn't submit. Try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="company_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. WSO2" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Senior Software Engineer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="experience_level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Experience level</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <FormField
            control={form.control}
            name="base_salary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base salary (annual)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    inputMode="numeric"
                    placeholder="e.g. 3600000"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormDescription>Gross annual base, excluding bonus & equity.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="anonymize"
          render={({ field }) => (
            <FormItem className="flex items-start gap-3 rounded-md border bg-muted/30 p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="cursor-pointer">Hide my company name</FormLabel>
                <FormDescription>
                  Submissions stay useful for salary ranges, but the company stays private.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit salary
          </Button>
        </div>
      </form>
    </Form>
  );
}
