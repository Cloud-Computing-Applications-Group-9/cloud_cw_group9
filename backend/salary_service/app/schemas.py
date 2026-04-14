from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


# --- Request Schema (what the user sends) ---

class SalarySubmissionCreate(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=255)
    role_title: str = Field(..., min_length=1, max_length=255)
    experience_level: str = Field(..., pattern="^(Intern|Junior|Mid|Senior|Lead|Architect|Principal)$")
    country: str = Field(default="Sri Lanka", max_length=100)
    base_salary: float = Field(..., gt=0)
    currency: str = Field(default="LKR", max_length=10)
    anonymize: bool = Field(default=False)


# --- Response Schema (what the API sends back) ---

class SalarySubmissionResponse(BaseModel):
    id: UUID
    company_name: str
    role_title: str
    experience_level: str
    country: str
    base_salary: float
    currency: str
    anonymize: bool
    status: str
    submitted_at: datetime

    class Config:
        from_attributes = True