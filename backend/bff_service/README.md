# BFF Service

Backend-for-Frontend for the tech salary platform. Sits between the Next.js frontend and the backend microservices (`identity_service`, `salary_service`, `vote_service`, `search_service`), exposing the API contract the frontend expects on port `8080`.

## Responsibilities

- Translate browser session cookies into upstream auth (issues an httpOnly cookie containing the identity service JWT).
- Route browser requests to the right upstream service.
- Normalize error shapes for the frontend.

## Endpoints

All paths are prefixed with `/api`.

### Auth (`identity_service`)
- `POST /api/auth/signup` — body `{ email, password }` → `{ user }` + sets session cookie
- `POST /api/auth/login` — body `{ email, password }` → `{ user }` + sets session cookie
- `POST /api/auth/logout` — clears session cookie, `204`
- `GET  /api/auth/me` — returns `{ user }` from the session cookie, `401` if missing

### Salaries (`salary_service` / `search_service`)
- `GET  /api/salaries?page=&q=` — list (delegates to `search_service` when `q` is set)
- `GET  /api/salaries/:id` — single submission
- `POST /api/salaries` — create (auth required)

### Votes (`vote_service`)
- `POST   /api/salaries/:id/vote` — body `{ type: "up" | "down" }`, returns updated `VoteState`
- `DELETE /api/salaries/:id/vote` — clears the user's vote, returns updated `VoteState`

### Health
- `GET /health`

## Configuration

| Env var | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8080` | Listen port |
| `IDENTITY_SERVICE_URL` | `http://identity_service:8000` | |
| `SALARY_SERVICE_URL` | `http://salary_service:8000` | |
| `VOTE_SERVICE_URL` | `http://vote_service:8000` | |
| `SEARCH_SERVICE_URL` | `http://search_service:8000` | |
| `JWT_SECRET` | `your_jwt_secret` | Must match `identity_service` |
| `JWT_ALGORITHM` | `HS256` | Must match `identity_service` |
| `SESSION_COOKIE_NAME` | `session` | Browser cookie name |
| `SESSION_COOKIE_MAX_AGE` | `3600` | Seconds |
| `SESSION_COOKIE_SECURE` | `false` | Set `true` behind TLS |
| `SESSION_COOKIE_SAMESITE` | `lax` | |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowlist |
| `UPSTREAM_TIMEOUT` | `10` | Seconds per upstream call |

## Local development

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

## Docker

```bash
docker build -t bff_service .
docker run --rm -p 8080:8080 \
  -e IDENTITY_SERVICE_URL=http://host.docker.internal:8001 \
  -e SALARY_SERVICE_URL=http://host.docker.internal:8000 \
  bff_service
```

Inside `docker-compose.yml`, the default upstream URLs already point at the
service names (`identity_service`, `salary_service`, etc.).
