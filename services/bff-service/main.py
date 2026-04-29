import os
import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from jose import JWTError, jwt

app = FastAPI()

IDENTITY_URL = os.getenv("IDENTITY_URL", "http://identity-service:8001")
SALARY_URL = os.getenv("SALARY_URL", "http://salary-submission-service:8002")
VOTE_URL = os.getenv("VOTE_URL", "http://vote-service:8003")
SEARCH_URL = os.getenv("SEARCH_URL", "http://search-service:8004")
STATS_URL = os.getenv("STATS_URL", "http://stats-service:8005")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")

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

# ── Auth routes (ingress strips /api, so paths start at /auth/...) ──────────

@app.post("/auth/signup")
async def signup(request: Request):
    body = await request.json()
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(f"{IDENTITY_URL}/signup", json=body)
        try:
            content = response.json()
        except Exception:
            content = {"detail": response.text}
        return JSONResponse(content=content, status_code=response.status_code)

@app.post("/auth/login")
async def login(request: Request):
    body = await request.json()
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(f"{IDENTITY_URL}/login", json=body)
        try:
            content = response.json()
        except Exception:
            content = {"detail": response.text}
        return JSONResponse(content=content, status_code=response.status_code)

@app.get("/auth/verify")
async def verify(request: Request):
    auth_header = request.headers.get("Authorization")
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{IDENTITY_URL}/verify",
            headers={"Authorization": auth_header} if auth_header else {}
        )
        return JSONResponse(content=response.json(), status_code=response.status_code)

