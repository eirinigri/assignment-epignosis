-- Vacation Portal Database Schema

-- Drop tables if they exist (for clean migrations)
DROP TABLE IF EXISTS vacation_requests CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS request_status CASCADE;

-- Create custom types
CREATE TYPE user_role AS ENUM ('manager', 'employee');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    employee_code VARCHAR(7) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    vacation_days_total INTEGER NOT NULL DEFAULT 20,
    vacation_days_used INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_vacation_days CHECK (vacation_days_used >= 0 AND vacation_days_used <= vacation_days_total)
);

-- Vacation requests table
CREATE TABLE vacation_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status request_status NOT NULL DEFAULT 'pending',
    manager_notes TEXT,
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_employee_code ON users(employee_code);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_vacation_requests_user_id ON vacation_requests(user_id);
CREATE INDEX idx_vacation_requests_status ON vacation_requests(status);
CREATE INDEX idx_vacation_requests_dates ON vacation_requests(start_date, end_date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vacation_requests_updated_at BEFORE UPDATE ON vacation_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
