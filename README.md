# Vacation Management Portal

A full-stack vacation management system built with TypeScript, featuring separate interfaces for managers and employees to handle vacation requests.

## 🚀 Features

### Manager Account
- ✅ View all registered users
- ✅ Create new user accounts (employees/managers)
- ✅ Update user information (name, email, password)
- ✅ Delete users and their associated data
- ✅ **View all vacation requests from employees**
- ✅ **Approve or reject vacation requests with one click**
- ✅ **Separate pending and processed requests**
- ✅ **See employee details with each request**
- ✅ Navigation between Users and Vacation Requests
- ✅ Secure authentication with JWT

### Employee Account
- ✅ View personal vacation requests
- ✅ Create new vacation requests with date range and reason
- ✅ Delete pending vacation requests
- ✅ See request status (pending, approved, rejected)

## 🛠️ Technology Stack

### Backend
- **TypeScript** with Node.js (native HTTP server, no Express)
- **PostgreSQL** for database
- **bcrypt** for password hashing
- **jsonwebtoken** for JWT authentication
- **Zod** for input validation
- **pg** (node-postgres) for database connection

### Frontend (Coming Soon)
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS + shadcn/ui for modern UI
- React Router for navigation

### DevOps
- Docker & Docker Compose for containerization
- PostgreSQL 16 Alpine

## 📋 Prerequisites

- Node.js 20+ 
- Docker & Docker Compose (for containerized setup)
- PostgreSQL 16+ (if running locally without Docker)

## 🚀 Quick Start

### Option 1: Docker (Recommended)

1. **Clone and navigate to the project:**
   ```bash
   cd assignment-epignosis
   ```

2. **Start PostgreSQL:**
   ```bash
   docker-compose up -d postgres
   ```

3. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env if needed (default values work with Docker)
   ```

5. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

6. **Seed the database with sample data:**
   ```bash
   npm run db:seed
   ```

7. **Start the backend server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

### Option 2: Local PostgreSQL

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Create a PostgreSQL database:**
   ```bash
   createdb vacation_portal
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Update DB_HOST, DB_USER, DB_PASSWORD in .env
   ```

4. **Run migrations and seed:**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start the server:**
   ```bash
   npm run dev
   ```

## 🔐 Default Credentials

After seeding the database, use these credentials:

**Manager Account:**
- Email: `manager@company.com`
- Password: `password123`

**Employee Accounts:**
- `alice.smith@company.com` / `password123`
- `bob.johnson@company.com` / `password123`
- `carol.williams@company.com` / `password123`
- `david.brown@company.com` / `password123`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info (requires auth)

### User Management (Manager Only)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Vacation Requests
- `GET /api/requests` - Get all requests (manager) or own requests (employee)
- `GET /api/requests/:id` - Get specific request
- `POST /api/requests` - Create vacation request (employee only)
- `PUT /api/requests/:id/approve` - Approve request (manager only)
- `PUT /api/requests/:id/reject` - Reject request (manager only)
- `DELETE /api/requests/:id` - Delete pending request

## 🧪 Testing the API

### Login as Manager
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@company.com","password":"password123"}'
```

### Get All Users (Manager)
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create New User (Manager)
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Jane Doe",
    "email": "jane.doe@company.com",
    "employee_code": "2000005",
    "password": "securepass123",
    "role": "employee"
  }'
```

### Get All Vacation Requests (Manager)
```bash
curl -X GET http://localhost:3000/api/requests \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Approve a Request (Manager)
```bash
curl -X PUT http://localhost:3000/api/requests/1/approve \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🗄️ Database Schema

### Users Table
- `id` - Serial primary key
- `name` - User's full name
- `email` - Unique email address
- `employee_code` - 7-digit unique employee number
- `password_hash` - Bcrypt hashed password
- `role` - 'manager' or 'employee'
- `created_at`, `updated_at` - Timestamps

### Vacation Requests Table
- `id` - Serial primary key
- `user_id` - Foreign key to users
- `start_date` - Vacation start date
- `end_date` - Vacation end date
- `reason` - Optional reason text
- `status` - 'pending', 'approved', or 'rejected'
- `submitted_at`, `updated_at` - Timestamps

## 🔒 Security Features

- ✅ **Password Hashing** - bcrypt with 10 salt rounds
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Input Validation** - Zod schemas for all inputs
- ✅ **SQL Injection Prevention** - Parameterized queries
- ✅ **Role-Based Access Control** - Manager/Employee permissions
- ✅ **CORS Configuration** - Controlled cross-origin requests

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration (database, env)
│   ├── controllers/     # Request handlers
│   ├── database/        # Migrations and seeds
│   ├── repositories/    # Data access layer
│   ├── types/           # TypeScript types
│   ├── utils/           # Utilities (auth, validation, http)
│   ├── router.ts        # Route definitions
│   └── server.ts        # HTTP server
├── package.json
├── tsconfig.json
└── Dockerfile
```

## 🧹 Available Scripts

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

## 🐳 Docker Commands

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

## 🎯 Development Practices

- **No Framework** - Custom HTTP server without Express
- **Clean Architecture** - Separation of concerns (controllers, repositories, services)
- **Type Safety** - Full TypeScript coverage
- **Validation** - Zod schemas for runtime type checking
- **Security First** - Authentication, authorization, input validation
- **Database Design** - Normalized schema with proper indexes
- **Error Handling** - Consistent error responses
- **Code Quality** - ESLint and Prettier configured

## 📝 Next Steps

- [ ] Add unit and integration tests
- [ ] Implement email notifications
- [ ] Add vacation day balance tracking
- [ ] Create admin dashboard with analytics
- [ ] Add request history and audit logs


