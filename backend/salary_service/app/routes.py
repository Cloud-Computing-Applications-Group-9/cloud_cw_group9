from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import SalarySubmission
from app.schemas import SalarySubmissionCreate, SalarySubmissionResponse
from uuid import UUID

router = APIRouter(prefix="/api/salaries", tags=["Salary Submissions"])


@router.get("")
def list_submissions(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * page_size
    base_q = db.query(SalarySubmission).filter(SalarySubmission.status == "APPROVED")
    total = base_q.count()
    rows = base_q.order_by(SalarySubmission.submitted_at.desc()).offset(offset).limit(page_size).all()
    return {"items": [SalarySubmissionResponse.model_validate(r) for r in rows], "total": total, "page": page, "pageSize": page_size}


@router.get("/pending")
def list_pending(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * page_size
    base_q = db.query(SalarySubmission).filter(SalarySubmission.status == "PENDING")
    total = base_q.count()
    rows = base_q.order_by(SalarySubmission.submitted_at.desc()).offset(offset).limit(page_size).all()
    return {"items": [SalarySubmissionResponse.model_validate(r) for r in rows], "total": total, "page": page, "pageSize": page_size}


@router.get("/mine")
def list_mine(
    x_user_id: Optional[str] = Header(None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    offset = (page - 1) * page_size
    base_q = db.query(SalarySubmission).filter(SalarySubmission.user_id == x_user_id)
    total = base_q.count()
    rows = base_q.order_by(SalarySubmission.submitted_at.desc()).offset(offset).limit(page_size).all()
    return {"items": [SalarySubmissionResponse.model_validate(r) for r in rows], "total": total, "page": page, "pageSize": page_size}


@router.post("/", response_model=SalarySubmissionResponse, status_code=201)
def create_submission(
    data: SalarySubmissionCreate,
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    submission = SalarySubmission(**data.model_dump(), user_id=x_user_id)
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@router.get("/{submission_id}", response_model=SalarySubmissionResponse)
def get_submission(submission_id: UUID, db: Session = Depends(get_db)):
    submission = db.query(SalarySubmission).filter(SalarySubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission