import { ApiError, Paged, Submission, User, VoteState, VoteType } from "./types";
import type { SalarySubmissionInput } from "./validators";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "1";
const BFF_URL = process.env.NEXT_PUBLIC_BFF_URL ?? "http://localhost:8080";

function resolveBase(): string {
  if (USE_MOCKS) return "";
  if (typeof window !== "undefined") return BFF_URL;
  return BFF_URL;
}

async function serverCookieHeader(): Promise<string | undefined> {
  if (typeof window !== "undefined") return undefined;
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  const all = jar.getAll().map((c) => `${c.name}=${c.value}`);
  return all.length ? all.join("; ") : undefined;
}

async function resolveUrl(path: string): Promise<string> {
  const base = resolveBase();
  if (base) return `${base}${path}`;
  if (typeof window !== "undefined") return path;
  // Server-side + mock mode: build absolute URL from request host.
  const { headers } = await import("next/headers");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}${path}`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = await resolveUrl(path);
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const cookieHeader = await serverCookieHeader();
  if (cookieHeader && !headers.has("Cookie")) {
    headers.set("Cookie", cookieHeader);
  }

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  if (res.status === 204) return undefined as T;

  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!res.ok) {
    const p = payload as { message?: string; code?: string; detail?: string } | null;
    const message = p?.message ?? p?.detail ?? res.statusText ?? "Request failed";
    throw new ApiError(res.status, message, p?.code);
  }
  return payload as T;
}

export const auth = {
  signup: (body: { email: string; password: string }) =>
    request<{ user: User }>("/api/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<{ user: User }>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request<void>("/api/auth/logout", { method: "POST" }),
  me: async (): Promise<User | null> => {
    try {
      const { user } = await request<{ user: User }>("/api/auth/me");
      return user;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return null;
      throw e;
    }
  },
};

export const salaries = {
  list: (params: { page?: number; q?: string } = {}) => {
    const s = new URLSearchParams();
    if (params.page) s.set("page", String(params.page));
    if (params.q) s.set("q", params.q);
    const qs = s.toString();
    return request<Paged<Submission>>(`/api/salaries${qs ? `?${qs}` : ""}`);
  },
  get: (id: string) => request<Submission>(`/api/salaries/${id}`),
  create: (body: SalarySubmissionInput) =>
    request<Submission>("/api/salaries", { method: "POST", body: JSON.stringify(body) }),
};

export const votes = {
  cast: (id: string, type: VoteType) =>
    request<VoteState>(`/api/salaries/${id}/vote`, {
      method: "POST",
      body: JSON.stringify({ type }),
    }),
  remove: (id: string) =>
    request<VoteState>(`/api/salaries/${id}/vote`, { method: "DELETE" }),
};
