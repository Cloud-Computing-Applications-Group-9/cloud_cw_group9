-- Tech Salary Transparency Platform - Database Schema
-- PostgreSQL initialization script

-- ============================================================================
-- Identity Schema - User Authentication & Management
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS identity;

CREATE TABLE identity.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON identity.users(email);

-- ============================================================================
-- Salary Schema - Salary Submissions & Data
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS salary;

CREATE TABLE salary.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_title VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  country VARCHAR(100) NOT NULL,
  city VARCHAR(100),
  experience_level VARCHAR(50) NOT NULL,
  years_experience INT,
  annual_salary_lkr BIGINT NOT NULL,
  currency VARCHAR(10) DEFAULT 'LKR',
  anonymize BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'PENDING',
  net_votes INT DEFAULT 0,
  submitted_at TIMESTAMP DEFAULT NOW()
);

-- NOTE: no user_id or email in salary.submissions (privacy by design)
CREATE INDEX idx_submissions_status ON salary.submissions(status);
CREATE INDEX idx_submissions_job_title ON salary.submissions(job_title);
CREATE INDEX idx_submissions_company ON salary.submissions(company);
CREATE INDEX idx_submissions_country ON salary.submissions(country);
CREATE INDEX idx_submissions_experience_level ON salary.submissions(experience_level);

-- ============================================================================
-- Community Schema - Voting & Community Engagement
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS community;

CREATE TABLE community.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  submission_id UUID NOT NULL,
  vote_type VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, submission_id)
);

CREATE INDEX idx_votes_user_id ON community.votes(user_id);
CREATE INDEX idx_votes_submission_id ON community.votes(submission_id);
CREATE INDEX idx_votes_vote_type ON community.votes(vote_type);
