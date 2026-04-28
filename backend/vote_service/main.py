from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Vote Service")

APPROVAL_THRESHOLD = 3

votes = []
submission_status = {}

class VoteRequest(BaseModel):
    submission_id: int
    vote_type: str  # up or down

@app.get("/")
def home():
    return {"message": "Vote service running"}

@app.post("/vote")
def submit_vote(payload: VoteRequest, authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Login required to vote")

    if payload.vote_type not in ["up", "down"]:
        raise HTTPException(status_code=400, detail="vote_type must be 'up' or 'down'")

    votes.append(payload.dict())

    upvotes = len([
        v for v in votes
        if v["submission_id"] == payload.submission_id and v["vote_type"] == "up"
    ])

    downvotes = len([
        v for v in votes
        if v["submission_id"] == payload.submission_id and v["vote_type"] == "down"
    ])

    status = "APPROVED" if upvotes >= APPROVAL_THRESHOLD else "PENDING"
    submission_status[payload.submission_id] = status

    return {
        "message": "Vote recorded",
        "submission_id": payload.submission_id,
        "upvotes": upvotes,
        "downvotes": downvotes,
        "status": status
    }

@app.get("/vote/{submission_id}")
def get_vote_status(submission_id: int):
    return {
        "submission_id": submission_id,
        "status": submission_status.get(submission_id, "PENDING")
    }