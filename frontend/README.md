# TechSalary — Frontend

A Next.js 15 app for the tech-salary-platform: browse community salary submissions, upvote/downvote them, and submit your own. Built with TypeScript, Tailwind v4, and ShadCN UI. Talks to the BFF over httpOnly session cookies — the browser never sees the JWT.

Ships with a **dev-only mock mode** (in-memory store, seeded with realistic submissions) so the UI is fully usable end-to-end before the BFF is built.

---

## Stack

| Concern   | Choice                                                         |
| --------- | -------------------------------------------------------------- |
| Framework | Next.js 15 (App Router, Server Components)                     |
| Language  | TypeScript (strict)                                            |
| Styling   | Tailwind CSS v4 + ShadCN UI (new-york, neutral)                |
| Forms     | react-hook-form + zod                                          |
| Toasts    | sonner                                                         |
| Auth      | httpOnly cookie set by the BFF — no client-side token handling |
| Container | node:22-alpine, Next.js standalone output, non-root user       |

---

## Features

| Journey                                   | Where               |
| ----------------------------------------- | ------------------- |
| Browse feed (paginated, searchable)       | `/`                 |
| Submission detail                         | `/submissions/[id]` |
| Submit a salary (auth-gated)              | `/submissions/new`  |
| Register                                  | `/register`         |
| Log in                                    | `/login`            |
| Vote / unvote (optimistic, with rollback) | feed + detail       |
| Auth-aware header with avatar dropdown    | every page          |

UX defaults: skeletons during navigation, empty states, accessible labels, focus rings, full keyboard navigation, responsive grid, optimistic voting with toast-based error recovery, and a sign-in prompt when anonymous users try to vote.

---

## Local development

```bash
cd frontend
npm install
cp .env.local.example .env.local        # keeps NEXT_PUBLIC_USE_MOCKS=1 → uses bundled mock BFF
npm run dev                              # http://localhost:3000
```

Smoke-test path: register → land on feed → submit a salary → upvote it → toggle the vote off → log out → `/submissions/new` redirects you back to `/login`.

### Scripts

| Command             | Purpose                                     |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | Dev server with HMR                         |
| `npm run build`     | Production build (emits `.next/standalone`) |
| `npm run start`     | Run the built app                           |
| `npm run lint`      | ESLint via Next                             |
| `npm run typecheck` | `tsc --noEmit`                              |

---

## Environment variables

| Variable                | Default                       | Purpose                                                                                                                                          |
| ----------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_BFF_URL`   | empty                         | Optional browser-visible BFF origin. Leave empty in Docker/Kubernetes so the browser uses same-origin `/api/*`.                                  |
| `BFF_URL_INTERNAL`      | none                          | Server-side BFF origin used by SSR and Next API proxy routes, e.g. `http://bff_service:8080` or `http://bff-service.app.svc.cluster.local:8080`. |
| `NEXT_PUBLIC_USE_MOCKS` | `1` (in `.env.local.example`) | When `1`, the API client targets same-origin `/api/*` mock handlers. Set to empty / unset for real BFF.                                          |
| `MOCK_SESSION_SECRET`   | `dev-only-not-secret`         | HMAC secret used by the mock session cookie. Dev only.                                                                                           |
| `PORT`                  | `3000`                        | Server port (Docker image respects this).                                                                                                        |
| `HOSTNAME`              | `0.0.0.0`                     | Bind address (Docker image respects this).                                                                                                       |

`NEXT_PUBLIC_*` values are inlined at **build time** — when running in Docker, set them as `--build-arg` (see below), not just runtime env.

---

## Docker

### Build the image

```bash
# from repo root
docker build \
  -t techsalary-frontend:dev \
  --build-arg NEXT_PUBLIC_BFF_URL="" \
  --build-arg NEXT_PUBLIC_USE_MOCKS=0 \
  ./frontend
```

The Dockerfile is multi-stage:

1. **deps** — installs `node_modules` from `package.json` / `package-lock.json`
2. **builder** — runs `next build`; thanks to `output: "standalone"` in `next.config.ts`, this emits a self-contained server bundle
3. **runner** — copies just the standalone output, switches to a non-root `nextjs` user, and runs `node server.js`. Final image is small and contains no source or dev deps.

It also exposes a `HEALTHCHECK` that pings `/` via Node's built-in `fetch`, so no extra `curl`/`wget` is needed inside the image.

### Run the image

Mock mode (no BFF needed):

```bash
docker run --rm -p 3000:3000 \
  -e NEXT_PUBLIC_USE_MOCKS=1 \
  techsalary-frontend:dev
# → http://localhost:3000
```

Pointing at a real BFF from the container:

```bash
docker run --rm -p 3000:3000 \
  -e BFF_URL_INTERNAL=http://host.docker.internal:8080 \
  -e NEXT_PUBLIC_USE_MOCKS= \
  techsalary-frontend:dev
```

Note: `NEXT_PUBLIC_BFF_URL` is inlined at **build** time. Prefer leaving it empty for containerized deployments and setting runtime `BFF_URL_INTERNAL` instead.

### Add to the project's `docker-compose.yml`

The repo's root `docker-compose.yml` already wires up the full stack. If you need to add the frontend to another compose file, use the same shape:

```yaml
frontend:
  build:
    context: ./frontend
    args:
      NEXT_PUBLIC_BFF_URL: "" # browser uses same-origin /api
      NEXT_PUBLIC_USE_MOCKS: "0"
  container_name: frontend
  environment:
    - BFF_URL_INTERNAL=http://bff_service:8080
    - NEXT_PUBLIC_USE_MOCKS=0
  ports:
    - "3000:3000"
  depends_on:
    - bff_service
```

For a frontend-only stack while the BFF is still being built, run `NEXT_PUBLIC_USE_MOCKS=1` and skip `depends_on`.

---

## Talking to the BFF

All API calls go through [`src/lib/api.ts`](src/lib/api.ts), which:

- Sends `credentials: 'include'` on every fetch so the browser ships the `session` cookie.
- On the server (RSC pages), forwards the incoming `cookie` header to the BFF so SSR fetches are authenticated.
- Throws a typed `ApiError(status, message, code?)` on non-2xx for predictable UI handling.
- Uses same-origin `/api/*` in the browser by default; those route handlers proxy to `BFF_URL_INTERNAL` unless `NEXT_PUBLIC_USE_MOCKS=1`.

### Expected BFF contract

| Method | Path                     | Body                       | Returns                                                                 |
| ------ | ------------------------ | -------------------------- | ----------------------------------------------------------------------- |
| POST   | `/api/auth/signup`       | `{ email, password }`      | sets `session` cookie, `{ user }`                                       |
| POST   | `/api/auth/login`        | `{ email, password }`      | sets `session` cookie, `{ user }`                                       |
| POST   | `/api/auth/logout`       | —                          | clears cookie, `204`                                                    |
| GET    | `/api/auth/me`           | —                          | `{ user }` or `401`                                                     |
| GET    | `/api/salaries?page&q`   | —                          | `{ items, total, page, pageSize }` (each item ideally carries `myVote`) |
| POST   | `/api/salaries`          | `SalarySubmissionCreate`   | created `Submission`                                                    |
| GET    | `/api/salaries/:id`      | —                          | `Submission` (+ `myVote` when authed)                                   |
| POST   | `/api/salaries/:id/vote` | `{ type: 'up' \| 'down' }` | `{ upvotes, downvotes, myVote }`                                        |
| DELETE | `/api/salaries/:id/vote` | —                          | `{ upvotes, downvotes, myVote: null }`                                  |

The BFF must:

- Issue the session cookie as `httpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` in production.
- Reflect the frontend origin in `Access-Control-Allow-Origin` and set `Access-Control-Allow-Credentials: true` if `NEXT_PUBLIC_BFF_URL` points the browser directly at the BFF.
- Return JSON errors as `{ message, code? }` with appropriate status codes — `401` triggers a redirect to `/login?next=…` from the auth-guarded routes.

### Submission schema

Mirrors `backend/database/init_schema.sql` and `backend/salary_service/app/schemas.py`:

```ts
{
  id: string,                                    // UUID
  company_name: string,
  role_title: string,
  experience_level: 'Intern' | 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Architect' | 'Principal',
  country: string,
  base_salary: number,
  currency: string,
  anonymize: boolean,
  status: string,
  upvotes: number,
  downvotes: number,
  submitted_at: string,                          // ISO-8601
  myVote?: 'up' | 'down' | null
}
```

---

## Project layout

```
frontend/
  Dockerfile                      # multi-stage; standalone output; non-root
  .dockerignore
  .mcp.json                       # registers the shadcn MCP server
  next.config.ts                  # output: "standalone"
  components.json                 # shadcn config
  src/
    middleware.ts                 # edge auth guard for /submissions/new
    app/
      layout.tsx, globals.css
      page.tsx                    # feed (server component)
      login/, register/           # auth pages
      submissions/new/            # auth-gated submit page
      submissions/[id]/           # detail page
      api/**/route.ts             # proxy to BFF; mock BFF when NEXT_PUBLIC_USE_MOCKS=1
    components/
      ui/                         # ShadCN components
      site-header.tsx, user-menu.tsx, submission-card.tsx,
      vote-buttons.tsx, auth-form.tsx, submit-salary-form.tsx,
      feed-search.tsx, empty-state.tsx, skeletons.tsx
    lib/
      api.ts                      # typed BFF client (server+client aware)
      auth.ts                     # server-only: getCurrentUser, requireUser
      types.ts, validators.ts, utils.ts
      mocks/db.ts, mocks/session.ts
```

---

## ShadCN MCP

`.mcp.json` registers the ShadCN MCP server (`npx shadcn@latest mcp`). When using Claude Code in this repo, the MCP is auto-detected — use it to install additional ShadCN components rather than copying them by hand.

---

## Switching from mocks to the real BFF

1. Build / restart the container with `NEXT_PUBLIC_USE_MOCKS=0` and `NEXT_PUBLIC_BFF_URL=""`.
2. Set runtime `BFF_URL_INTERNAL` to the BFF service URL reachable from the frontend container or pod.
3. The mock handlers under `src/app/api/**` only run when `NEXT_PUBLIC_USE_MOCKS=1`; otherwise they proxy to the BFF.

No application code changes are required.
