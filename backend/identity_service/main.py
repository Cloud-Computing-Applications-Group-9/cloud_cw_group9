from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from db import get_db, create_user, get_user_by_email
from auth import hash_password, verify_password, create_jwt_token
import os

app = FastAPI()

class SignupRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    user_id: str
    token: str


@app.post("/api/auth/signup", response_model=AuthResponse, status_code=201)
def signup(data: SignupRequest):
    db = get_db()
    try:
        if get_user_by_email(db, data.email):
            raise HTTPException(status_code=400, detail="Email already registered")
        user_id = create_user(db, data.email, hash_password(data.password))
        token = create_jwt_token(user_id)
        return {"user_id": user_id, "token": token}
    finally:
        db.close()


@app.post("/api/auth/login", response_model=AuthResponse)
def login(data: SignupRequest):
    db = get_db()
    try:
        user = get_user_by_email(db, data.email)
        if not user or not verify_password(data.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        token = create_jwt_token(user["user_id"])
        return {"user_id": user["user_id"], "token": token}
    finally:
        db.close()

@app.get("/health")
def health():
    return {"status": "healthy"}