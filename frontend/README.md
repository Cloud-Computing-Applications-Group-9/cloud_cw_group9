# TechSalary — Frontend

Next.js 15 (App Router) + TypeScript + Tailwind v4 + ShadCN UI. Consumes the BFF service over httpOnly cookies. Ships with a dev-only mock mode so the UI works end-to-end before the BFF lands.

## Quick start

```bash
pnpm install
cp .env.local.example .env.local   # keep NEXT_PUBLIC_USE_MOCKS=1 for now
pnpm dev                           # http://localhost:3000
```

## Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_BFF_URL` | Base URL of the BFF service. Used when mocks are off. |
| `NEXT_PUBLIC_USE_MOCKS` | `1` → same-origin `/api/*` handlers; empty → call the real BFF. |
| `MOCK_SESSION_SECRET` | Dev-only HMAC secret for mock session cookies. |

When the BFF ships, flip `NEXT_PUBLIC_USE_MOCKS` off and point `NEXT_PUBLIC_BFF_URL` at it — no code change required.

## Expected BFF contract

- `POST /api/auth/signup` — `{ email, password }` → sets `session` cookie, `{ user }`
- `POST /api/auth/login` — `{ email, password }` → sets `session` cookie, `{ user }`
- `POST /api/auth/logout` — clears cookie
- `GET  /api/auth/me` — `{ user }` or 401
- `GET  /api/salaries?page&q` — `{ items, total, page, pageSize }` (each item ideally has `myVote`)
- `POST /api/salaries` — create (body matches the salary schema)
- `GET  /api/salaries/:id` — single submission (+ `myVote` when authed)
- `POST /api/salaries/:id/vote` — `{ type: 'up'|'down' }` → `{ upvotes, downvotes, myVote }`
- `DELETE /api/salaries/:id/vote` — `{ upvotes, downvotes, myVote: null }`

BFF must:
- Set `session` as httpOnly, SameSite=Lax, Path=/, Secure in prod
- Enable CORS with `Access-Control-Allow-Credentials: true` and our origin

## ShadCN MCP

`.mcp.json` registers the ShadCN MCP server (`npx shadcn@latest mcp`). Claude Code will detect it automatically; use it to pull in additional components as the UI grows.

## Scripts

- `pnpm dev` · `pnpm build` · `pnpm start`
- `pnpm lint` · `pnpm typecheck`
