# MedPulse - Medical Practice Management System

A full-stack, Docker-containerized medical practice management web application covering patient intake through billing across any medical specialty.

## Tech Stack

- **Backend:** NestJS + Prisma + PostgreSQL
- **Frontend:** React + Vite + Shadcn/ui + TailwindCSS
- **Infrastructure:** Docker Compose, Redis, Nginx
- **PDF Generation:** PDFKit
- **Email:** Nodemailer + Ethereal (dev)
- **Real-time:** Socket.IO

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)

### Run with Docker

```bash
docker compose up --build
```

Services will start on:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Swagger Docs:** http://localhost:3001/api/docs
- **PgAdmin:** http://localhost:5050 (dev profile: `docker compose --profile dev up`)

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@medpulse.com | Admin@123 |
| Doctor (Cardiology) | dr.smith@medpulse.com | Doctor@123 |
| Doctor (General) | dr.jones@medpulse.com | Doctor@123 |
| Doctor (Psychiatry) | dr.patel@medpulse.com | Doctor@123 |
| Doctor (Pediatrics) | dr.wilson@medpulse.com | Doctor@123 |
| Nurse | nurse.johnson@medpulse.com | Staff@123 |
| Receptionist | reception@medpulse.com | Staff@123 |
| Lab Tech | lab@medpulse.com | Staff@123 |

### Local Development

**Backend:**
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Architecture

```
MediVerse/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma       # 25+ database models
│   │   ├── seed.ts             # Seed data script
│   │   └── seed-data/          # ICD-10 codes, medications, lab tests
│   └── src/
│       ├── auth/               # JWT authentication & RBAC
│       ├── users/              # Staff management
│       ├── patients/           # Patient records & search
│       ├── appointments/       # Scheduling & calendar
│       ├── specialties/        # Medical specialties & custom fields
│       ├── consultations/      # SOAP notes, vitals, diagnoses
│       ├── prescriptions/      # Rx writing, drug interactions, PDF
│       ├── laboratory/         # Lab orders, results, trends
│       ├── billing/            # Invoicing, payments, PDF
│       ├── documents/          # File upload & management
│       ├── dashboard/          # Analytics & statistics
│       ├── settings/           # Clinic configuration
│       ├── notifications/      # WebSocket real-time notifications
│       └── common/             # Guards, decorators, interceptors
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
│       ├── api/                # TanStack Query hooks
│       ├── components/         # React components
│       │   ├── ui/             # Shadcn/ui base components
│       │   ├── layout/         # App shell, sidebar, header
│       │   ├── dashboard/      # Dashboard widgets
│       │   ├── patients/       # Patient components
│       │   ├── appointments/   # Calendar & booking
│       │   ├── consultations/  # SOAP form, vitals, diagnosis
│       │   ├── prescriptions/  # Rx writer, drug search
│       │   ├── laboratory/     # Lab management
│       │   ├── billing/        # Invoice & payment forms
│       │   └── settings/       # Admin settings
│       ├── pages/              # Route page components
│       ├── stores/             # Zustand state stores
│       ├── hooks/              # Custom React hooks
│       ├── types/              # TypeScript type definitions
│       └── lib/                # Utilities & API client
└── docs/
    ├── API.md
    └── SETUP.md
```

## Modules

### 1. Authentication & Authorization
- JWT access/refresh token flow
- Role-based access control (RBAC): Admin, Doctor, Nurse, Receptionist, Lab Tech
- Password reset via email

### 2. Patient Management
- Patient registration with auto-generated MRN
- Search by name, MRN, phone number
- Family linking
- Visit history timeline

### 3. Appointment Scheduling
- Day/Week/Month calendar views
- Conflict detection
- Waiting queue management
- Patient check-in flow

### 4. Consultations (EMR)
- SOAP note entry with specialty-specific templates
- Vital signs recording with auto BMI calculation
- ICD-10 diagnosis search
- Custom fields per specialty
- Quick text macros
- Body map for dermatology

### 5. Prescriptions
- Multi-medication prescriptions
- Drug interaction checking
- PDF prescription generation
- Medication history

### 6. Laboratory
- Lab order creation with priority levels
- Result entry with auto abnormal flagging
- Patient result trend charts
- Test catalog management

### 7. Billing & Invoicing
- Invoice generation from consultations
- Payment recording (Cash, Card, Insurance, Bank Transfer)
- PDF invoice generation
- Revenue reporting

### 8. Documents
- File upload with drag-and-drop
- Document categorization
- In-app preview

### 9. Dashboard & Analytics
- Role-specific dashboards
- Revenue charts
- Patient demographics
- Appointment statistics

### 10. Settings & Administration
- Clinic profile configuration
- Specialty management with custom fields
- Print settings
- Audit log viewer

### 11. Real-time Notifications
- WebSocket-based notifications
- Appointment reminders
- In-app notification center

## Specialties (Pre-configured)

1. **General Medicine** - Primary care with review of systems
2. **Cardiology** - ECG, echo, stress test, cardiac risk scoring
3. **Psychiatry** - Mental status exam, PHQ-9, GAD-7, mood tracking
4. **Pediatrics** - Growth charts, vaccination checklist, milestones
5. **Orthopedics** - Injury assessment, range of motion, imaging
6. **Dermatology** - Lesion documentation, body map, biopsy results
7. **Ophthalmology** - Visual acuity, IOP, fundoscopy, slit lamp

## Seed Data

- 200+ ICD-10 codes across 15 categories
- 300 common medications with contraindications
- 50+ lab test definitions with normal ranges
- Consultation templates per specialty
- Default service prices
- Clinic configuration

## API Documentation

Swagger docs available at `/api/docs` when the backend is running.

## Environment Variables

See `.env.example` for all configuration options.

## License

Private - All rights reserved.
