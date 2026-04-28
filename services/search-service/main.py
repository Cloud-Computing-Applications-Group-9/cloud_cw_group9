import os
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI
from typing import Optional, List

app = FastAPI()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/techsalary")

class SearchResult:
    def __init__(self, row):
        self.id = row['id']
        self.job_title = row['job_title']
        self.company = "Anonymous" if row['anonymize'] else row['company']
        self.country = row['country']
        self.city = row['city']
        self.experience_level = row['experience_level']
        self.years_experience = row['years_experience']
        self.annual_salary_lkr = row['annual_salary_lkr']
        self.currency = row['currency']
        self.anonymize = row['anonymize']
        self.status = row['status']
        self.net_votes = row['net_votes']
        self.submitted_at = row['submitted_at'].isoformat()

    def to_dict(self):
        return {
            "id": self.id,
            "job_title": self.job_title,
            "company": self.company,
            "country": self.country,
            "city": self.city,
            "experience_level": self.experience_level,
            "years_experience": self.years_experience,
            "annual_salary_lkr": self.annual_salary_lkr,
            "currency": self.currency,
            "anonymize": self.anonymize,
            "status": self.status,
            "net_votes": self.net_votes,
            "submitted_at": self.submitted_at
        }

def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    return conn

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/search")
async def search(
    role: Optional[str] = None,
    level: Optional[str] = None,
    approved_only: Optional[bool] = True
):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if approved_only:
            query = "SELECT * FROM salary.submissions WHERE status = 'APPROVED' AND country = 'Sri Lanka'"
        else:
            query = "SELECT * FROM salary.submissions WHERE country = 'Sri Lanka'"
        params = []

        if role:
            query += " AND job_title ILIKE %s"
            params.append(f"%{role}%")

        if level:
            query += " AND experience_level = %s"
            params.append(level)

        query += " ORDER BY job_title ASC, submitted_at DESC"

        cursor.execute(query, params)
        rows = cursor.fetchall()

        results = [SearchResult(row).to_dict() for row in rows]

        return {
            "count": len(results),
            "results": results
        }
    finally:
        cursor.close()
        conn.close()
