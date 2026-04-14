from fastapi import FastAPI
from app.routes import router

app = FastAPI(
    title="Salary Submission Service",
    description="Accepts anonymous salary submissions for tech salary transparency in Sri Lanka",
    version="1.0.0"
)

app.include_router(router)


@app.get("/health")
def health_check():
    return {"status": "healthy"}