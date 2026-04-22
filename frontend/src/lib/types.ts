export const EXPERIENCE_LEVELS = [
  "Intern",
  "Junior",
  "Mid",
  "Senior",
  "Lead",
  "Architect",
  "Principal",
] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const CURRENCIES = ["LKR", "USD", "EUR", "GBP", "INR", "AUD", "SGD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export type VoteType = "up" | "down";

export interface User {
  id: string;
  email: string;
}

export interface Submission {
  id: string;
  company_name: string;
  role_title: string;
  experience_level: ExperienceLevel;
  country: string;
  base_salary: number;
  currency: string;
  anonymize: boolean;
  status: string;
  upvotes: number;
  downvotes: number;
  submitted_at: string;
  myVote?: VoteType | null;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface VoteState {
  upvotes: number;
  downvotes: number;
  myVote: VoteType | null;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}
