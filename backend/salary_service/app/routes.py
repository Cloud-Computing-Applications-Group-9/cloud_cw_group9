from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SalarySubmission
from app.schemas import SalarySubmissionCreate, SalarySubmissionResponse
from uuid import UUID

router = APIRouter(prefix="/api/salaries", tags=["Salary Submissions"])


# --- GET: List submissions with pagination ---

@router.get("")
def list_submissions(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * page_size
    base_q = db.query(SalarySubmission).filter(SalarySubmission.status == "APPROVED")
    total = base_q.count()
    rows = (
        base_q
        .order_by(SalarySubmission.submitted_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    items = [SalarySubmissionResponse.model_validate(r) for r in rows]
    return {"items": items, "total": total, "page": page, "pageSize": page_size}


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