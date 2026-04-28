import os
from typing import Optional

import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException

app = FastAPI(title="Stats Service", version="1.0.0")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@postgres:5432/techsalarydb",
)


def get_db_connection():
    return psycopg2.connect(DATABASE_URL)


def _round(value):
    return round(float(value), 2) if value is not None else 0.0


def _summary_row(row) -> dict:
    return {
        "avg": _round(row["avg_salary"]),
        "median": _round(row["median_salary"]),
        "p25": _round(row["p25_salary"]),
        "p75": _round(row["p75_salary"]),
        "min": _round(row["min_salary"]),
        "max": _round(row["max_salary"]),
        "count": int(row["count"] or 0),
    }


SUMMARY_SELECT = """
    AVG(base_salary) AS avg_salary,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY base_salary) AS median_salary,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY base_salary) AS p25_salary,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY base_salary) AS p75_salary,
    MIN(base_salary) AS min_salary,
    MAX(base_salary) AS max_salary,
    COUNT(*) AS count
"""


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/stats")
def get_stats(
    role: Optional[str] = None,
    experience_level: Optional[str] = None,
    country: Optional[str] = None,
    currency: Optional[str] = None,
):
    """Aggregated salary statistics from approved submissions.

    Returns overall summary plus breakdowns by experience level and top roles.
    """
    try:
        conn = get_db_connection()
    except psycopg2.Error as exc:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {exc}")

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        where_clauses = ["status = 'APPROVED'"]
        params: list = []

        if role:
            where_clauses.append("role_title ILIKE %s")
            params.append(f"%{role}%")
        if experience_level:
            where_clauses.append("experience_level = %s")
            params.append(experience_level)
        if country:
            where_clauses.append("country = %s")
            params.append(country)
        if currency:
            where_clauses.append("currency = %s")
            params.append(currency)

        where_sql = " AND ".join(where_clauses)

        cursor.execute(
            f"SELECT {SUMMARY_SELECT} FROM salary.submissions WHERE {where_sql}",
            params,
        )
        overall = _summary_row(cursor.fetchone())

        cursor.execute(
            f"""
            SELECT experience_level, {SUMMARY_SELECT}
            FROM salary.submissions
            WHERE {where_sql}
            GROUP BY experience_level
            ORDER BY count DESC
            """,
            params,
        )
        by_experience = [
            {"experience_level": r["experience_level"], **_summary_row(r)}
            for r in cursor.fetchall()
        ]

        cursor.execute(
            f"""
            SELECT role_title, {SUMMARY_SELECT}
            FROM salary.submissions
            WHERE {where_sql}
            GROUP BY role_title
            ORDER BY count DESC
            LIMIT 10
            """,
            params,
        )
        top_roles = [
            {"role_title": r["role_title"], **_summary_row(r)}
            for r in cursor.fetchall()
        ]

        cursor.execute(
            f"""
            SELECT currency, COUNT(*) AS count
            FROM salary.submissions
            WHERE {where_sql}
            GROUP BY currency
            ORDER BY count DESC
            """,
            params,
        )
        by_currency = [
            {"currency": r["currency"], "count": int(r["count"])}
            for r in cursor.fetchall()
        ]

        return {
            "overall": overall,
            "byExperience": by_experience,
            "topRoles": top_roles,
            "byCurrency": by_currency,
            "filters": {
                "role": role,
                "experience_level": experience_level,
                "country": country,
                "currency": currency,
            },
        }
    finally:
        cursor.close()
        conn.close()
