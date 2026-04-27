from fastapi import FastAPI, Query
from typing import Optional

app = FastAPI(title="Search Service")

salary_records = [
    {
        "id": 1,
        "country": "Sri Lanka",
        "company": "ABC Tech",
        "role": "Software Engineer",
        "level": "Mid",
        "salary": 350000,
        "status": "APPROVED"
    },
    {
        "id": 2,
        "country": "Sri Lanka",
        "company": "XYZ Solutions",
        "role": "QA Engineer",
        "level": "Junior",
        "salary": 180000,
        "status": "APPROVED"
    },
    {
        "id": 3,
        "country": "UK",
        "company": "CloudSoft",
        "role": "DevOps Engineer",
        "level": "Senior",
        "salary": 65000,
        "status": "PENDING"
    }
]

@app.get("/")
def home():
    return {"message": "Search service running"}

@app.get("/search")
def search_salaries(
    country: Optional[str] = Query(None),
    company: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    level: Optional[str] = Query(None)
):
    results = [record for record in salary_records if record["status"] == "APPROVED"]

    if country:
        results = [r for r in results if r["country"].lower() == country.lower()]

    if company:
        results = [r for r in results if company.lower() in r["company"].lower()]

    if role:
        results = [r for r in results if role.lower() in r["role"].lower()]

    if level:
        results = [r for r in results if r["level"].lower() == level.lower()]

    return {
        "count": len(results),
        "results": results
    }