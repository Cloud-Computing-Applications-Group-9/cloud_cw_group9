import os
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uuid
from datetime import datetime

app = FastAPI()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/techsalary")

class SalarySubmission(BaseModel):
    job_title: str
    company: str
    experience_level: str
    years_experience: int
    annual_salary_lkr: int
    anonymize: bool = True

class SubmissionResponse(BaseModel):
    id: str
    job_title: str
    company: str
    country: str
    city: str
    experience_level: str
    years_experience: int
    annual_salary_lkr: int
    anonymize: bool
    status: str
    net_votes: int
    submitted_at: str

def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            CREATE SCHEMA IF NOT EXISTS salary
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS salary.submissions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                job_title VARCHAR(255) NOT NULL,
                company VARCHAR(255) NOT NULL,
                country VARCHAR(255) NOT NULL,
                city VARCHAR(255) NOT NULL,
                experience_level VARCHAR(50) NOT NULL,
                years_experience INT NOT NULL,
                annual_salary_lkr INT NOT NULL,
                currency VARCHAR(10) DEFAULT 'LKR',
                anonymize BOOLEAN DEFAULT true,
                status VARCHAR(50) DEFAULT 'PENDING',
                net_votes INT DEFAULT 0,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
    finally:
        cursor.close()
        conn.close()

@app.on_event("startup")
async def startup_event():
    init_db()

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/submit", response_model=SubmissionResponse)
async def submit_salary(submission: SalarySubmission):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        submission_id = str(uuid.uuid4())

        cursor.execute(
            """INSERT INTO salary.submissions
               (id, job_title, company, country, city, experience_level,
                years_experience, annual_salary_lkr, anonymize)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
               RETURNING id, job_title, company, country, city, experience_level,
                        years_experience, annual_salary_lkr, anonymize, status, net_votes, submitted_at""",
            (submission_id, submission.job_title, submission.company, 'Sri Lanka',
             'Colombo', submission.experience_level, submission.years_experience,
             submission.annual_salary_lkr, submission.anonymize)
        )
        result = cursor.fetchone()
        conn.commit()

        return SubmissionResponse(
            id=result['id'],
            job_title=result['job_title'],
            company=result['company'],
            country=result['country'],
            city=result['city'],
            experience_level=result['experience_level'],
            years_experience=result['years_experience'],
            annual_salary_lkr=result['annual_salary_lkr'],
            anonymize=result['anonymize'],
            status=result['status'],
            net_votes=result['net_votes'],
            submitted_at=result['submitted_at'].isoformat()
        )
    finally:
        cursor.close()
        conn.close()

@app.get("/submissions")
async def get_submissions():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute("SELECT * FROM salary.submissions ORDER BY submitted_at DESC")
        rows = cursor.fetchall()

        submissions = []
        for row in rows:
            submissions.append({
                "id": row['id'],
                "job_title": row['job_title'],
                "company": row['company'],
                "country": row['country'],
                "city": row['city'],
                "experience_level": row['experience_level'],
                "years_experience": row['years_experience'],
                "annual_salary_lkr": row['annual_salary_lkr'],
                "anonymize": row['anonymize'],
                "status": row['status'],
                "net_votes": row['net_votes'],
                "submitted_at": row['submitted_at'].isoformat()
            })

        return {"submissions": submissions}
    finally:
        cursor.close()
        conn.close()
