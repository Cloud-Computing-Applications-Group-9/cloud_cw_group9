import os
from typing import Optional

import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, Query

app = FastAPI(title="Search Service")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@postgres:5432/techsalarydb",
)


def _get_conn():
    return psycopg2.connect(DATABASE_URL)


def _row_to_dict(r: dict) -> dict:
    row = dict(r)
    row["id"] = str(row["id"])
    row["base_salary"] = float(row["base_salary"])
    row["submitted_at"] = row["submitted_at"].isoformat()
    if row.get("anonymize"):
        row["company_name"] = "Anonymous"
    return row


@app.get("/")
def home():
    return {"message": "Search service running"}


@app.get("/api/salaries")
def search_salaries(
    q: Optional[str] = Query(None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    offset = (page - 1) * page_size
    where = "status = 'APPROVED'"
    params: list = []

    if q:
        q_param = f"%{q}%"
        where += (
            " AND ("
            "(anonymize = FALSE AND company_name ILIKE %s)"
            " OR role_title ILIKE %s"
            " OR country ILIKE %s"
            ")"
        )
        params.extend([q_param, q_param, q_param])

    with _get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(f"SELECT COUNT(*) AS cnt FROM salary.submissions WHERE {where}", params)
            total = cur.fetchone()["cnt"]

            cur.execute(
                f"""
                SELECT id, company_name, role_title, experience_level, country,
                       base_salary, currency, anonymize, status, upvotes, downvotes, submitted_at
                FROM salary.submissions
                WHERE {where}
                ORDER BY submitted_at DESC
                LIMIT %s OFFSET %s
                """,
                params + [page_size, offset],
            )
            rows = cur.fetchall()

    return {"items": [_row_to_dict(r) for r in rows], "total": total, "page": page, "pageSize": page_size}


@app.get("/search")
def search_salaries_legacy(
    country: Optional[str] = Query(None),
    company: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
):
    clauses = ["status = 'APPROVED'"]
    params: list = []

    if country:
        clauses.append("country ILIKE %s")
        params.append(country)
    if company:
        clauses.append("anonymize = FALSE AND company_name ILIKE %s")
        params.append(f"%{company}%")
    if role:
        clauses.append("role_title ILIKE %s")
        params.append(f"%{role}%")
    if level:
        clauses.append("experience_level ILIKE %s")
        params.append(level)

    where = " AND ".join(clauses)

    with _get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                f"""
                SELECT id, company_name, role_title, experience_level, country,
                       base_salary, currency, anonymize, status, upvotes, downvotes, submitted_at
                FROM salary.submissions
                WHERE {where}
                ORDER BY submitted_at DESC
                """,
                params,
            )
            rows = cur.fetchall()

    results = [_row_to_dict(r) for r in rows]
    return {"count": len(results), "results": results}
