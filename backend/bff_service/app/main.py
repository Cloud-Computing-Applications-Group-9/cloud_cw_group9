from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.clients import close_client
from app.config import settings
from app.routes import auth, salaries, votes


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield
    await close_client()


app = FastAPI(
    title="BFF Service",
    description="Backend-for-Frontend aggregating identity, salary, vote, and search services",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(salaries.router)
app.include_router(votes.router)


@app.get("/health")
def health():
    return {"status": "healthy"}
