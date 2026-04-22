import { requireUser } from "@/lib/auth";
import { SubmitSalaryForm } from "@/components/submit-salary-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewSubmissionPage() {
  await requireUser("/submissions/new");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Submit a salary</CardTitle>
          <CardDescription>
            Help fellow engineers benchmark fair compensation. You can anonymize the
            company name; all other fields stay public.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubmitSalaryForm />
        </CardContent>
      </Card>
    </div>
  );
}
