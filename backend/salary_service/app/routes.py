from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SalarySubmission
from app.schemas import SalarySubmissionCreate, SalarySubmissionResponse
from uuid import UUID

router = APIRouter(prefix="/api/salaries", tags=["Salary Submissions"])


# --- POST: Submit a new salary ---

@router.post("/", response_model=SalarySubmissionResponse, status_code=201)
def create_submission(data: SalarySubmissionCreate, db: Session = Depends(get_db)):
    submission = SalarySubmission(**data.model_dump())
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


# --- GET: Retrieve a submission by ID ---

@router.get("/{submission_id}", response_model=SalarySubmissionResponse)
def get_submission(submission_id: UUID, db: Session = Depends(get_db)):
    submission = db.query(SalarySubmission).filter(
        SalarySubmission.id == submission_id
    ).first()

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    return submission