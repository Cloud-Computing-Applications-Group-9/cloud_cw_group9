import os
import bcrypt
from jose import jwt
from datetime import datetime, timedelta, timezone

JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret")
JWT_ALGORITHM = "HS256"
JWT_EXP_DELTA_SECONDS = 3600

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def create_jwt_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(seconds=JWT_EXP_DELTA_SECONDS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
