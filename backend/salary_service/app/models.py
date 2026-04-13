import uuid
from sqlalchemy import Column, String, Numeric, Boolean, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base


class SalarySubmission(Base):
    __tablename__ = "submissions"
    __table_args__ = {"schema": "salary"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_name = Column(String(255), nullable=False)
    role_title = Column(String(255), nullable=False)
    experience_level = Column(String(50), nullable=False)
    country = Column(String(100), nullable=False, default="Sri Lanka")
    base_salary = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(10), nullable=False, default="LKR")
    anonymize = Column(Boolean, nullable=False, default=False)
    status = Column(String(20), nullable=False, default="PENDING")
    upvotes = Column(Integer, nullable=False, default=0)
    downvotes = Column(Integer, nullable=False, default=0)
    submitted_at = Column(DateTime, nullable=False, server_default=func.now())