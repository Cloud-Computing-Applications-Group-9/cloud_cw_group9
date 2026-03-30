CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Identity Schema --
CREATE SCHEMA IF NOT EXISTS identity;
CREATE TABLE identity.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Salary Schema --
CREATE SCHEMA IF NOT EXISTS salary;
CREATE TABLE salary.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    role_title VARCHAR(255) NOT NULL,
    experience_level VARCHAR(50) NOT NULL,
    country VARCHAR(100) DEFAULT 'Sri Lanka',
    base_salary NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'LKR',
    anonymize BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'PENDING',
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    submitted_at TIMESTAMP DEFAULT NOW()
);

-- Community Schema --
CREATE SCHEMA IF NOT EXISTS community;
CREATE TABLE community.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES salary.submissions(id),
    user_id UUID NOT NULL REFERENCES identity.users(id),
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(submission_id, user_id)
);
