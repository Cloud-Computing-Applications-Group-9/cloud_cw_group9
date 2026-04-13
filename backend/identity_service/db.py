import os
import psycopg2
import uuid

def get_db():
    return psycopg2.connect(
        dbname=os.getenv("POSTGRES_DB", "yourdb"),
        user=os.getenv("POSTGRES_USER", "user"),
        password=os.getenv("POSTGRES_PASSWORD", "password"),
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=os.getenv("POSTGRES_PORT", "5432"),
        options="-c search_path=identity"
    )

def get_user_by_email(db, email):
    with db.cursor() as cur:
        cur.execute("SELECT id, email, password_hash FROM users WHERE email = %s", (email,))
        row = cur.fetchone()
        if row:
            return {"id": row[0], "email": row[1], "password_hash": row[2]}
        return None

def create_user(db, email, password_hash):
    user_id = str(uuid.uuid4())
    with db.cursor() as cur:
        cur.execute(
            "INSERT INTO users (id, email, password_hash) VALUES (%s, %s, %s)",
            (user_id, email, password_hash)
        )
        db.commit()
    return user_id