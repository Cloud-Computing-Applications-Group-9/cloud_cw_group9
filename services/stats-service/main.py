import os
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI
from typing import Optional

app = FastAPI()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/techsalary")

class StatsResponse:
    def __init__(self, avg, median, p25, p75, count):
        self.avg = avg
        self.median = median
        self.p25 = p25
        self.p75 = p75
        self.count = count

    def to_dict(self):
        return {
            "avg": round(self.avg, 2) if self.avg else 0,
            "median": round(self.median, 2) if self.median else 0,
            "p25": round(self.p25, 2) if self.p25 else 0,
            "p75": round(self.p75, 2) if self.p75 else 0,
            "count": self.count
        }

def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    return conn

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/stats")
async def get_stats(role: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        query = """
            SELECT
                AVG(annual_salary_lkr) as avg_salary,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY annual_salary_lkr) as median_salary,
                PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY annual_salary_lkr) as p25_salary,
                PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY annual_salary_lkr) as p75_salary,
                COUNT(*) as count
            FROM salary.submissions
            WHERE status = 'APPROVED' AND country = 'Sri Lanka'
        """
        params = []

        if role:
            query += " AND job_title ILIKE %s"
            params.append(f"%{role}%")

        cursor.execute(query, params)
        result = cursor.fetchone()

        stats = StatsResponse(
            avg=result['avg_salary'],
            median=result['median_salary'],
            p25=result['p25_salary'],
            p75=result['p75_salary'],
            count=result['count']
        )

        return stats.to_dict()
    finally:
        cursor.close()
        conn.close()
