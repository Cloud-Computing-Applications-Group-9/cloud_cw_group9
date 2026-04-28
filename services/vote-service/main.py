import os
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from jose import JWTError, jwt
import uuid

app = FastAPI()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/techsalary")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")

class VoteRequest(BaseModel):
    vote_type: str

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

def extract_user_from_token(authorization: str) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    token = authorization[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/vote/{submission_id}")
async def vote(submission_id: str, vote_request: VoteRequest, request: Request):
    # Read Authorization from HTTP header
    auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
    user_id = extract_user_from_token(auth_header)

    if vote_request.vote_type not in ["up", "down"]:
        raise HTTPException(status_code=400, detail="Invalid vote_type. Must be 'up' or 'down'")

    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # Check for existing vote — replace it
        cursor.execute(
            "SELECT id FROM community.votes WHERE user_id = %s AND submission_id = %s",
            (user_id, submission_id)
        )
        if cursor.fetchone():
            cursor.execute(
                "DELETE FROM community.votes WHERE user_id = %s AND submission_id = %s",
                (user_id, submission_id)
            )

        vote_id = str(uuid.uuid4())
        cursor.execute(
            """INSERT INTO community.votes (id, user_id, submission_id, vote_type)
               VALUES (%s, %s, %s, %s)
               RETURNING id, user_id, submission_id, vote_type, created_at""",
            (vote_id, user_id, submission_id, vote_request.vote_type)
        )
        vote_result = cursor.fetchone()

        # Recalculate net votes
        cursor.execute(
            """SELECT
                 SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE 0 END) -
                 SUM(CASE WHEN vote_type = 'down' THEN 1 ELSE 0 END) AS net
               FROM community.votes WHERE submission_id = %s""",
            (submission_id,)
        )
        net_votes = cursor.fetchone()["net"] or 0

        cursor.execute(
            "UPDATE salary.submissions SET net_votes = %s WHERE id = %s",
            (net_votes, submission_id)
        )

        # Auto-approve at threshold of 3
        if net_votes >= 3:
            cursor.execute(
                "UPDATE salary.submissions SET status = 'APPROVED' WHERE id = %s",
                (submission_id,)
            )

        conn.commit()

        return {
            "id": str(vote_result["id"]),
            "user_id": str(vote_result["user_id"]),
            "submission_id": str(vote_result["submission_id"]),
            "vote_type": vote_result["vote_type"],
            "net_votes": net_votes,
            "status": "APPROVED" if net_votes >= 3 else "PENDING",
            "created_at": vote_result["created_at"].isoformat()
        }
    finally:
        cursor.close()
        conn.close()
