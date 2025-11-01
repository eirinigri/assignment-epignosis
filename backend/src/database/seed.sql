-- Seed data for Vacation Portal
-- Note: Passwords are hashed with bcrypt (password: "password123" for all users)

-- Insert manager account
INSERT INTO users (name, email, employee_code, password_hash, role) VALUES
('John Manager', 'manager@company.com', '1000001', '$2b$10$rKZvVxwlvVxvVxwlvVxwle8KZvVxwlvVxwlvVxwlvVxwlvVxwlvVx', 'manager');

-- Insert employee accounts
INSERT INTO users (name, email, employee_code, password_hash, role) VALUES
('Alice Smith', 'alice.smith@company.com', '2000001', '$2b$10$rKZvVxwlvVxvVxwlvVxwle8KZvVxwlvVxwlvVxwlvVxwlvVxwlvVx', 'employee'),
('Bob Johnson', 'bob.johnson@company.com', '2000002', '$2b$10$rKZvVxwlvVxvVxwlvVxwle8KZvVxwlvVxwlvVxwlvVxwlvVxwlvVx', 'employee'),
('Carol Williams', 'carol.williams@company.com', '2000003', '$2b$10$rKZvVxwlvVxvVxwlvVxwle8KZvVxwlvVxwlvVxwlvVxwlvVxwlvVx', 'employee'),
('David Brown', 'david.brown@company.com', '2000004', '$2b$10$rKZvVxwlvVxvVxwlvVxwle8KZvVxwlvVxwlvVxwlvVxwlvVxwlvVx', 'employee');

-- Insert sample vacation requests
INSERT INTO vacation_requests (user_id, start_date, end_date, reason, status) VALUES
(2, '2024-12-20', '2024-12-27', 'Christmas holiday', 'approved'),
(2, '2025-01-15', '2025-01-19', 'Personal time off', 'pending'),
(3, '2024-11-10', '2024-11-15', 'Family vacation', 'approved'),
(3, '2025-02-01', '2025-02-07', 'Winter break', 'pending'),
(4, '2024-12-01', '2024-12-05', 'Medical appointment', 'rejected'),
(4, '2025-03-10', '2025-03-14', 'Spring vacation', 'pending'),
(5, '2025-01-20', '2025-01-25', 'Conference attendance', 'approved');

-- Note: The actual password hashes will be generated properly in the TypeScript seed script
-- This SQL file is for reference and manual database setup
