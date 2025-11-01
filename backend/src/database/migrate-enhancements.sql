-- Migration script to add enhancements to existing database
-- Run this if you already have data and want to preserve it

-- Add vacation balance columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS vacation_days_total INTEGER NOT NULL DEFAULT 20,
ADD COLUMN IF NOT EXISTS vacation_days_used INTEGER NOT NULL DEFAULT 0;

-- Add constraint for vacation days validation
ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS valid_vacation_days 
CHECK (vacation_days_used >= 0 AND vacation_days_used <= vacation_days_total);

-- Add manager notes and approval tracking to vacation_requests table
ALTER TABLE vacation_requests
ADD COLUMN IF NOT EXISTS manager_notes TEXT,
ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Update vacation_days_used for existing approved requests
-- This calculates the days used from existing approved requests
UPDATE users u
SET vacation_days_used = COALESCE((
    SELECT SUM(
        EXTRACT(DAY FROM (vr.end_date - vr.start_date)) + 1
    )
    FROM vacation_requests vr
    WHERE vr.user_id = u.id 
    AND vr.status = 'approved'
), 0)
WHERE u.role = 'employee';

-- Note: This migration preserves existing data
-- All users will start with 20 total vacation days
-- Used days are calculated from approved requests
