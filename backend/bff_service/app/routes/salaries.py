from typing import Optional
from fastapi import APIRouter, Query, Request, status

from app.clients import call_upstream, raise_for_upstream
from app.config import settings
from app.schemas import SalarySubmissionInput
from app.security import require_user_id

router = APIRouter(prefix="/api/salaries", tags=["salaries"])


@router.get("")
async def list_submissions(
    request: Request,
    page: int = Query(default=1, ge=1),
    q: Optional[str] = Query(default=None),
):
    """List salary submissions.

    Search is delegated to the search_service when `q` is provided; otherwise
    the salary_service is queried directly.
    """
    target = settings.search_service_url if q else settings.salary_service_url
    params: dict = {"page": page, "page_size": settings.default_page_size}
    if q:
        params["q"] = q

    status_code, payload = await call_upstream(
        "GET", target, "/api/salaries", params=params
    )
    raise_for_upstream(status_code, payload)
    return payload


@router.get("/{submission_id}")
async def get_submission(submission_id: str, request: Request):
    status_code, payload = await call_upstream(
        "GET",
        settings.salary_service_url,
        f"/api/salaries/{submission_id}",
    )
    raise_for_upstream(status_code, payload)
    return payload


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_submission(body: SalarySubmissionInput, request: Request):
    user_id = require_user_id(request)
    status_code, payload = await call_upstream(
        "POST",
        settings.salary_service_url,
        "/api/salaries/",
        json=body.model_dump(),
        headers={"X-User-Id": user_id},
    )
    raise_for_upstream(status_code, payload)
    return payload
