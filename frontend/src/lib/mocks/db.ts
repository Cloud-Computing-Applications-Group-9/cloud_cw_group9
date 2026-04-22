import { randomUUID, createHmac } from "node:crypto";
import type { Submission, User, VoteType } from "@/lib/types";

export interface MockUser extends User {
  passwordHash: string;
}

interface MockVote {
  submissionId: string;
  userId: string;
  type: VoteType;
}

interface Store {
  users: Map<string, MockUser>;
  submissions: Map<string, Submission>;
  votes: Map<string, MockVote>;
  seeded: boolean;
}

const globalRef = globalThis as unknown as { __mockStore?: Store };

function createStore(): Store {
  return {
    users: new Map(),
    submissions: new Map(),
    votes: new Map(),
    seeded: false,
  };
}

function store(): Store {
  if (!globalRef.__mockStore) globalRef.__mockStore = createStore();
  if (!globalRef.__mockStore.seeded) seed(globalRef.__mockStore);
  return globalRef.__mockStore;
}

function seed(s: Store) {
  const rows: Array<Omit<Submission, "id" | "status" | "upvotes" | "downvotes" | "submitted_at"> & {
    days: number;
    up: number;
    down: number;
  }> = [
    { company_name: "WSO2", role_title: "Senior Software Engineer", experience_level: "Senior", country: "Sri Lanka", base_salary: 4200000, currency: "LKR", anonymize: false, days: 2, up: 18, down: 1 },
    { company_name: "Virtusa", role_title: "Associate Tech Lead", experience_level: "Lead", country: "Sri Lanka", base_salary: 5800000, currency: "LKR", anonymize: false, days: 5, up: 12, down: 3 },
    { company_name: "99x", role_title: "Software Engineer", experience_level: "Mid", country: "Sri Lanka", base_salary: 2400000, currency: "LKR", anonymize: false, days: 1, up: 24, down: 0 },
    { company_name: "Sysco LABS", role_title: "Senior Software Engineer", experience_level: "Senior", country: "Sri Lanka", base_salary: 4900000, currency: "LKR", anonymize: true, days: 7, up: 30, down: 2 },
    { company_name: "IFS", role_title: "Principal Engineer", experience_level: "Principal", country: "Sri Lanka", base_salary: 9500000, currency: "LKR", anonymize: false, days: 14, up: 41, down: 4 },
    { company_name: "MillenniumIT ESP", role_title: "Junior Developer", experience_level: "Junior", country: "Sri Lanka", base_salary: 900000, currency: "LKR", anonymize: false, days: 3, up: 6, down: 0 },
    { company_name: "Canonical", role_title: "Software Engineer II", experience_level: "Mid", country: "Remote", base_salary: 95000, currency: "USD", anonymize: false, days: 10, up: 52, down: 6 },
    { company_name: "Stripe", role_title: "Staff Engineer", experience_level: "Principal", country: "Singapore", base_salary: 320000, currency: "SGD", anonymize: false, days: 21, up: 88, down: 9 },
    { company_name: "Dialog Axiata", role_title: "Intern – Backend", experience_level: "Intern", country: "Sri Lanka", base_salary: 360000, currency: "LKR", anonymize: false, days: 1, up: 3, down: 0 },
    { company_name: "LSEG", role_title: "Architect", experience_level: "Architect", country: "Sri Lanka", base_salary: 11000000, currency: "LKR", anonymize: true, days: 30, up: 22, down: 5 },
    { company_name: "Atlassian", role_title: "Senior Frontend Engineer", experience_level: "Senior", country: "Australia", base_salary: 180000, currency: "AUD", anonymize: false, days: 4, up: 33, down: 2 },
    { company_name: "Google", role_title: "Software Engineer III", experience_level: "Mid", country: "India", base_salary: 5200000, currency: "INR", anonymize: false, days: 6, up: 47, down: 3 },
  ];

  const now = Date.now();
  rows.forEach((r) => {
    const id = randomUUID();
    const submitted_at = new Date(now - r.days * 86_400_000).toISOString();
    s.submissions.set(id, {
      id,
      company_name: r.company_name,
      role_title: r.role_title,
      experience_level: r.experience_level,
      country: r.country,
      base_salary: r.base_salary,
      currency: r.currency,
      anonymize: r.anonymize,
      status: "APPROVED",
      upvotes: r.up,
      downvotes: r.down,
      submitted_at,
    });
  });
  s.seeded = true;
}

// --- Users ---

export function getUserByEmail(email: string): MockUser | undefined {
  const s = store();
  for (const u of s.users.values()) if (u.email.toLowerCase() === email.toLowerCase()) return u;
  return undefined;
}

export function getUserById(id: string): MockUser | undefined {
  return store().users.get(id);
}

export function createMockUser(email: string, password: string): MockUser {
  const s = store();
  const id = randomUUID();
  const user: MockUser = {
    id,
    email,
    passwordHash: hash(password),
  };
  s.users.set(id, user);
  return user;
}

export function verifyPassword(user: MockUser, password: string): boolean {
  return user.passwordHash === hash(password);
}

// --- Sessions ---

const SECRET = process.env.MOCK_SESSION_SECRET ?? "dev-only-not-secret";

function hash(val: string): string {
  return createHmac("sha256", SECRET).update(val).digest("hex");
}

export function signSession(userId: string): string {
  const sig = createHmac("sha256", SECRET).update(userId).digest("hex").slice(0, 24);
  return `${userId}.${sig}`;
}

export function readSession(cookie: string | undefined): string | null {
  if (!cookie) return null;
  const [userId, sig] = cookie.split(".");
  if (!userId || !sig) return null;
  const expected = createHmac("sha256", SECRET).update(userId).digest("hex").slice(0, 24);
  return sig === expected ? userId : null;
}

// --- Submissions ---

export function listSubmissions(opts: { page: number; pageSize: number; q?: string; userId?: string | null }) {
  const s = store();
  const all = Array.from(s.submissions.values()).sort(
    (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime(),
  );
  const q = opts.q?.toLowerCase().trim();
  const filtered = q
    ? all.filter(
        (x) =>
          (!x.anonymize && x.company_name.toLowerCase().includes(q)) ||
          x.role_title.toLowerCase().includes(q) ||
          x.country.toLowerCase().includes(q),
      )
    : all;
  const total = filtered.length;
  const start = (opts.page - 1) * opts.pageSize;
  const items = filtered.slice(start, start + opts.pageSize).map((x) => attachMyVote(x, opts.userId));
  return { items, total, page: opts.page, pageSize: opts.pageSize };
}

export function getSubmission(id: string, userId?: string | null): Submission | undefined {
  const s = store();
  const sub = s.submissions.get(id);
  if (!sub) return undefined;
  return attachMyVote(sub, userId);
}

export function createSubmission(body: Omit<Submission, "id" | "status" | "upvotes" | "downvotes" | "submitted_at">): Submission {
  const s = store();
  const id = randomUUID();
  const sub: Submission = {
    ...body,
    id,
    status: "PENDING",
    upvotes: 0,
    downvotes: 0,
    submitted_at: new Date().toISOString(),
  };
  s.submissions.set(id, sub);
  return sub;
}

function attachMyVote(sub: Submission, userId?: string | null): Submission {
  if (!userId) return { ...sub, myVote: null };
  const s = store();
  const key = voteKey(sub.id, userId);
  const v = s.votes.get(key);
  return { ...sub, myVote: v?.type ?? null };
}

// --- Votes ---

function voteKey(submissionId: string, userId: string) {
  return `${submissionId}:${userId}`;
}

export function castVote(submissionId: string, userId: string, type: VoteType) {
  const s = store();
  const sub = s.submissions.get(submissionId);
  if (!sub) return null;
  const key = voteKey(submissionId, userId);
  const existing = s.votes.get(key);
  if (existing?.type === type) {
    // already same vote — no-op
  } else if (existing) {
    if (existing.type === "up") sub.upvotes = Math.max(0, sub.upvotes - 1);
    else sub.downvotes = Math.max(0, sub.downvotes - 1);
    if (type === "up") sub.upvotes += 1;
    else sub.downvotes += 1;
    s.votes.set(key, { submissionId, userId, type });
  } else {
    if (type === "up") sub.upvotes += 1;
    else sub.downvotes += 1;
    s.votes.set(key, { submissionId, userId, type });
  }
  return { upvotes: sub.upvotes, downvotes: sub.downvotes, myVote: type };
}

export function removeVote(submissionId: string, userId: string) {
  const s = store();
  const sub = s.submissions.get(submissionId);
  if (!sub) return null;
  const key = voteKey(submissionId, userId);
  const existing = s.votes.get(key);
  if (existing) {
    if (existing.type === "up") sub.upvotes = Math.max(0, sub.upvotes - 1);
    else sub.downvotes = Math.max(0, sub.downvotes - 1);
    s.votes.delete(key);
  }
  return { upvotes: sub.upvotes, downvotes: sub.downvotes, myVote: null };
}
