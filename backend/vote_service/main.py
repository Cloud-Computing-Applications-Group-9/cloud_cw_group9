import os
from typing import Literal, Optional

import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Vote Service")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/techsalarydb",
)
APPROVAL_THRESHOLD = 3


class VoteRequest(BaseModel):
    type: Literal["up", "down"]
    user_id: str


def _get_conn():
    return psycopg2.connect(DATABASE_URL)


def _sync_counts(cur, submission_id: str) -> None:
    """Recompute upvotes/downvotes on salary.submissions and auto-approve."""
    cur.execute(
        """
        UPDATE salary.submissions
        SET
            upvotes   = (SELECT COUNT(*) FROM community.votes
                         WHERE submission_id = %s::uuid AND vote_type = 'up'),
            downvotes = (SELECT COUNT(*) FROM community.votes
                         WHERE submission_id = %s::uuid AND vote_type = 'down'),
            status    = CASE
                          WHEN (SELECT COUNT(*) FROM community.votes
                                WHERE submission_id = %s::uuid AND vote_type = 'up') >= %s
                          THEN 'APPROVED'
                          ELSE status
                        END
        WHERE id = %s::uuid
        """,
        (submission_id, submission_id, submission_id, APPROVAL_THRESHOLD, submission_id),
    )


@app.get("/")
def home():
    return {"message": "Vote service running"}


@app.post("/api/salaries/{submission_id}/vote")
def cast_vote(
    submission_id: str,
    payload: VoteRequest,
    x_user_id: Optional[str] = Header(None),
):
    user_id = x_user_id or payload.user_id
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    with _get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO community.votes (submission_id, user_id, vote_type)
                VALUES (%s::uuid, %s::uuid, %s)
                ON CONFLICT (submission_id, user_id)
                DO UPDATE SET vote_type = EXCLUDED.vote_type
                """,
                (submission_id, user_id, payload.type),
            )
            _sync_counts(cur, submission_id)
            cur.execute(
                "SELECT upvotes, downvotes FROM salary.submissions WHERE id = %s::uuid",
                (submission_id,),
            )
            row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {"upvotes": row["upvotes"], "downvotes": row["downvotes"], "myVote": payload.type}


@app.delete("/api/salaries/{submission_id}/vote")
def remove_vote(
    submission_id: str,
    x_user_id: Optional[str] = Header(None),
):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    with _get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "DELETE FROM community.votes WHERE submission_id = %s::uuid AND user_id = %s::uuid",
                (submission_id, x_user_id),
            )
            _sync_counts(cur, submission_id)
            cur.execute(
                "SELECT upvotes, downvotes FROM salary.submissions WHERE id = %s::uuid",
                (submission_id,),
            )
            row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {"upvotes": row["upvotes"], "downvotes": row["downvotes"], "myVote": None}


@app.get("/vote/{submission_id}")
def get_vote_status(
    submission_id: str,
    x_user_id: Optional[str] = Header(None),
):
    with _get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT upvotes, downvotes, status FROM salary.submissions WHERE id = %s::uuid",
                (submission_id,),
            )
            row = cur.fetchone()
            my_vote = None
            if x_user_id:
                cur.execute(
                    "SELECT vote_type FROM community.votes WHERE submission_id = %s::uuid AND user_id = %s::uuid",
                    (submission_id, x_user_id),
                )
                v = cur.fetchone()
                if v:
                    my_vote = v["vote_type"]

    if not row:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {
        "submission_id": submission_id,
        "upvotes": row["upvotes"],
        "downvotes": row["downvotes"],
        "status": row["status"],
        "myVote": my_vote,
    }
