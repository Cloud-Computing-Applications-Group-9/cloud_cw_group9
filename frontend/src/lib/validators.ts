import { z } from "zod";
import { CURRENCIES, EXPERIENCE_LEVELS } from "./types";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const salarySubmissionSchema = z.object({
  company_name: z.string().min(1, "Required").max(255),
  role_title: z.string().min(1, "Required").max(255),
  experience_level: z.enum(EXPERIENCE_LEVELS),
  country: z.string().min(1).max(100).default("Sri Lanka"),
  base_salary: z.coerce.number().positive("Must be greater than 0"),
  currency: z.enum(CURRENCIES).default("LKR"),
  anonymize: z.boolean().default(false),
});
export type SalarySubmissionInput = z.infer<typeof salarySubmissionSchema>;
