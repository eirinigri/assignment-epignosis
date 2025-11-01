# Vacation Management Portal

Full-stack TypeScript application for managing employee vacation requests with role-based access control.

## Features

**Manager Features:**
- User Management: Create, view, update, and delete employee/manager accounts
- Vacation Approval: View all requests, approve or reject with optional notes
- Request Dashboard: Separate views for pending and processed requests
- Employee Details: See requester information with each vacation request
- Advanced Filtering: Filter by status and search by employee name or reason
- Analytics Dashboard: View comprehensive statistics and trends

**Employee Features:**
- Request Management: Create vacation requests with date range and optional reason
- Request Editing: Modify pending requests before approval
- Status Tracking: View all personal requests with status (pending, approved, rejected)
- Request Control: Delete pending requests before approval
- Vacation Balance: Track remaining vacation days with visual progress indicator
- Manager Feedback: View manager notes on approved/rejected requests
- Advanced Filtering: Filter by status and search requests

**Security:**
- JWT authentication with bcrypt password hashing
- Role-based access control (Manager/Employee)
- Input validation with Zod schemas
- SQL injection prevention via parameterized queries
- CORS configuration

## Technology Stack

**Backend:** TypeScript, Node.js (native HTTP, no Express), PostgreSQL, bcrypt, jsonwebtoken, Zod  
**Frontend:** React 18, TypeScript, Vite, TailwindCSS, React Router  
**DevOps:** Docker Compose, PostgreSQL 16

## Prerequisites

- Node.js 20+ 
- Docker & Docker Compose (for containerized setup)
- PostgreSQL 16+ (if running locally without Docker)

## Quick Start

1. **Start PostgreSQL:**
   ```bash
   docker-compose up -d postgres
   ```

2. **Setup Backend:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```
   Backend runs on `http://localhost:3000`

3. **Setup Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

## Default Credentials

**Manager:** `manager@company.com` / `password123`  
**Employees:** `alice.smith@company.com`, `bob.johnson@company.com`, `carol.williams@company.com`, `david.brown@company.com` / `password123`

## API Endpoints

**Authentication:**
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

**User Management (Manager):**
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

**Vacation Requests:**
- `GET /api/requests` - List requests (supports filtering: ?status=pending&search=vacation)
- `POST /api/requests` - Create request (Employee)
- `GET /api/requests/:id` - Get request
- `PUT /api/requests/:id` - Update pending request (Employee)
- `PUT /api/requests/:id/approve` - Approve (Manager)
- `PUT /api/requests/:id/reject` - Reject (Manager)
- `DELETE /api/requests/:id` - Delete pending request

**Analytics (Manager):**
- `GET /api/analytics` - Get dashboard analytics

## Database Schema

### Users Table
- `id` - Serial primary key
- `name` - User's full name
- `email` - Unique email address
- `employee_code` - 7-digit unique employee number
- `password_hash` - Bcrypt hashed password
- `role` - 'manager' or 'employee'
- `vacation_days_total` - Total annual vacation days (default: 20)
- `vacation_days_used` - Days used from approved requests
- `created_at`, `updated_at` - Timestamps

### Vacation Requests Table
- `id` - Serial primary key
- `user_id` - Foreign key to users
- `start_date` - Vacation start date
- `end_date` - Vacation end date
- `reason` - Optional reason text
- `status` - 'pending', 'approved', or 'rejected'
- `manager_notes` - Optional feedback from manager
- `approved_by` - User ID of approving manager
- `approved_at` - Timestamp of approval/rejection
- `submitted_at`, `updated_at` - Timestamps

## Security Features

- Password Hashing - bcrypt with 10 salt rounds
- JWT Authentication - Secure token-based auth
- Input Validation - Zod schemas for all inputs
- SQL Injection Prevention - Parameterized queries
- Role-Based Access Control - Manager/Employee permissions
- CORS Configuration - Controlled cross-origin requests

## Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
npm test             # Run tests
npm run lint         # Lint code
npm run format       # Format code with Prettier
```

## Docker Commands

```bash
# Start all services
docker-compose up -d

# Start only database
docker-compose up -d postgres

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down

# Remove volumes (reset database)
docker-compose down -v
```

## Development Practices

- No Framework - Custom HTTP server without Express
- Clean Architecture - Separation of concerns (controllers, repositories, services)
- Type Safety - Full TypeScript coverage
- Validation - Zod schemas for runtime type checking
- Security First - Authentication, authorization, input validation
- Database Design - Normalized schema with proper indexes
- Error Handling - Consistent error responses
- Code Quality - ESLint and Prettier configured

## Enhancements

### 1. Vacation Balance & Tracking
- Employees have 20 vacation days per year (configurable)
- Real-time balance tracking with automatic deduction on approval
- Validation prevents requests exceeding available days
- Visual progress indicator showing usage percentage

### 2. Overlapping Request Detection
- Prevents conflicting vacation requests for same employee
- Validates against both pending and approved requests
- Comprehensive overlap detection for all date scenarios

### 3. Manager Notes & Approval Tracking
- Managers can add optional notes when approving/rejecting
- Employees see manager feedback in request history
- System tracks who approved/rejected and when
- Interactive modal UI for adding notes

### 4. Request Editing
- Employees can edit pending requests (dates and reason)
- Automatic validation for balance and overlaps on update
- Only pending requests can be modified
- Edit modal with inline validation

### 5. Advanced Filtering & Search
- Filter requests by status (pending, approved, rejected)
- Search by employee name or reason text
- Query parameter support: `?status=pending&search=vacation`
- Works for both managers and employees

### 6. Analytics Dashboard (Manager)
- Total request counts by status
- Average approval time in hours
- Top requesters leaderboard
- Vacation utilization by employee with progress bars
- Monthly request trends (last 12 months)
- Visual charts and statistics

## Troubleshooting

**Internal Server Error on Login:**
Database schema is out of sync. Run:
```bash
cd backend
npm run db:migrate
npm run db:seed
```

**Column does not exist errors:**
Run migration: `npm run db:migrate`

**Database connection failed:**
Check `.env` file has correct PostgreSQL credentials

