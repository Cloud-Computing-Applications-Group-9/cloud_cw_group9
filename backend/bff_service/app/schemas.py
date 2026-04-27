from typing import Generic, Literal, Optional, TypeVar
from pydantic import BaseModel, EmailStr, Field

T = TypeVar("T")


class User(BaseModel):
    id: str
    email: str


class UserResponse(BaseModel):
    user: User


class AuthCredentials(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class SalarySubmissionInput(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=255)
    role_title: str = Field(..., min_length=1, max_length=255)
    experience_level: Literal[
        "Intern", "Junior", "Mid", "Senior", "Lead", "Architect", "Principal"
    ]
    country: str = Field(default="Sri Lanka", max_length=100)
    base_salary: float = Field(..., gt=0)
    currency: str = Field(default="LKR", max_length=10)
    anonymize: bool = False


class VoteRequest(BaseModel):
    type: Literal["up", "down"]


class VoteState(BaseModel):
    upvotes: int
    downvotes: int
    myVote: Optional[Literal["up", "down"]] = None


class Paged(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    pageSize: int
