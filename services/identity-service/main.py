import os
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import bcrypt
from datetime import datetime, timedelta
from jose import JWTError, jwt
import uuid

app = FastAPI()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/techsalary")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")

class SignupRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    token: str
    user_id: str

class VerifyResponse(BaseModel):
    user_id: str

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))

def make_token(user_id: str, email: str) -> str:
    return jwt.encode({"user_id": user_id, "email": email}, JWT_SECRET, algorithm="HS256")

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/signup")
async def signup(request: SignupRequest):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute("SELECT id FROM identity.users WHERE email = %s", (request.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")

        password_hash = hash_password(request.password)
        user_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO identity.users (id, email, password_hash) VALUES (%s, %s, %s)",
            (user_id, request.email, password_hash)
        )
        conn.commit()
        token = make_token(user_id, request.email)
        return {"token": token, "user_id": user_id}
    finally:
        cursor.close()
        conn.close()

@app.post("/login")
async def login(request: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute(
            "SELECT id, password_hash FROM identity.users WHERE email = %s",
            (request.email,)
        )
        user = cursor.fetchone()
        if not user or not verify_password(request.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token = make_token(str(user["id"]), request.email)
        return {"token": token, "user_id": str(user["id"])}
    finally:
        cursor.close()
        conn.close()

@app.get("/verify")
async def verify(authorization: str = None):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    token = authorization[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": user_id}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
