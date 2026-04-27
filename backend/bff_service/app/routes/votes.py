from fastapi import APIRouter, Request, status

from app.clients import call_upstream, raise_for_upstream
from app.config import settings
from app.schemas import VoteRequest
from app.security import require_user_id

router = APIRouter(prefix="/api/salaries", tags=["votes"])


@router.post("/{submission_id}/vote")
async def cast_vote(submission_id: str, body: VoteRequest, request: Request):
    user_id = require_user_id(request)
    status_code, payload = await call_upstream(
        "POST",
        settings.vote_service_url,
        f"/api/salaries/{submission_id}/vote",
        json={"type": body.type, "user_id": user_id},
        headers={"X-User-Id": user_id},
    )
    raise_for_upstream(status_code, payload)
    return payload


@router.delete("/{submission_id}/vote")
async def remove_vote(submission_id: str, request: Request):
    user_id = require_user_id(request)
    status_code, payload = await call_upstream(
        "DELETE",
        settings.vote_service_url,
        f"/api/salaries/{submission_id}/vote",
        headers={"X-User-Id": user_id},
    )
    raise_for_upstream(status_code, payload)
    if payload is None:
        return {"upvotes": 0, "downvotes": 0, "myVote": None}
    return payload
