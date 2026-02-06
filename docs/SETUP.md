# MedPulse Setup Guide

## Docker Setup (Recommended)

### 1. Clone and Configure

```bash
cd C:\MyWorkspace\MediVerse
cp .env.example .env
```

### 2. Start Services

```bash
docker compose up --build
```

This will:
- Build the backend (NestJS) and frontend (React + Vite) images
- Start PostgreSQL 16 and Redis 7
- Run database migrations automatically
- Seed the database with initial data
- Start the backend API on port 3001
- Start the frontend on port 3000 (Nginx)

### 3. Verify

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Swagger Docs: http://localhost:3001/api/docs
- Login with: admin@medpulse.com / Admin@123

### 4. PgAdmin (Optional)

```bash
docker compose --profile dev up
```

Access PgAdmin at http://localhost:5050
- Email: admin@medpulse.com
- Password: admin

## Local Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 16
- Redis 7

### Backend

```bash
cd backend

# Install dependencies
npm install

# Configure environment
# Edit .env with your database connection

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Start development server
npm run start:dev
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The Vite dev server proxies `/api` requests to the backend on port 3001.

## Database Management

### View database with Prisma Studio
```bash
cd backend
npx prisma studio
```

### Create a new migration
```bash
cd backend
npx prisma migrate dev --name <migration_name>
```

### Reset database
```bash
cd backend
npx prisma migrate reset
```

## Common Issues

### Port conflicts
If ports 3000, 3001, 5432, or 6379 are in use, update the port mappings in `docker-compose.yml`.

### Database connection errors
Ensure PostgreSQL is running and the `DATABASE_URL` in `.env` is correct.

### Seed data not loading
The seed script is idempotent - it checks if admin user exists before running. To re-seed:
```bash
npx prisma migrate reset  # This will drop and recreate the database
```
