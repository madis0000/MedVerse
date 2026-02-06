# MedPulse API Documentation

Base URL: `http://localhost:3001/api`

Swagger UI: `http://localhost:3001/api/docs`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /auth/login | Login with email/password | Public |
| POST | /auth/register | Register new user | Public |
| POST | /auth/refresh | Refresh access token | Public |
| POST | /auth/logout | Invalidate refresh token | Required |
| POST | /auth/forgot-password | Request password reset | Public |
| POST | /auth/reset-password | Reset password with token | Public |

### Users

| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | /users | List all users | SUPER_ADMIN |
| GET | /users/:id | Get user by ID | Any |
| POST | /users | Create user | SUPER_ADMIN |
| PATCH | /users/:id | Update user | SUPER_ADMIN |
| DELETE | /users/:id | Soft delete user | SUPER_ADMIN |

### Patients

| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | /patients | List patients with search/filter | Any |
| GET | /patients/:id | Get patient profile | Any |
| POST | /patients | Create patient | Any |
| PATCH | /patients/:id | Update patient | Any |
| GET | /patients/:id/timeline | Visit history | Any |
| POST | /patients/:id/family-link | Link family members | Any |

### Appointments

| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | /appointments | List with filters | Any |
| GET | /appointments/calendar | Calendar format | Any |
| POST | /appointments | Create appointment | Any |
| PATCH | /appointments/:id | Update appointment | Any |
| PATCH | /appointments/:id/status | Change status | Any |
| GET | /appointments/waiting-queue | Today's queue | Any |
| POST | /appointments/:id/check-in | Check in patient | Any |

### Consultations

| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| POST | /consultations | Create from appointment | DOCTOR, NURSE |
| GET | /consultations/:id | Get full consultation | Any |
| PATCH | /consultations/:id | Update SOAP fields | DOCTOR, NURSE |
| POST | /consultations/:id/vitals | Record vitals | DOCTOR, NURSE |
| POST | /consultations/:id/diagnoses | Add diagnosis | DOCTOR |
| GET | /consultations/templates | List templates | Any |
| POST | /consultations/templates | Create template | DOCTOR |
| GET | /icd10/search | Search ICD-10 codes | Any |
| GET | /medications/search | Search medications | Any |
| GET | /quick-texts | Get quick texts | DOCTOR |
| POST | /quick-texts | Create quick text | DOCTOR |

### Prescriptions

| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| POST | /prescriptions | Create prescription | DOCTOR |
| GET | /prescriptions/:id | Get detail | Any |
| GET | /prescriptions/patient/:patientId | Patient history | Any |
| GET | /prescriptions/:id/pdf | Generate PDF | Any |
| POST | /prescriptions/check-interactions | Check interactions | Any |

### Laboratory

| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| POST | /lab-orders | Create lab order | DOCTOR |
| GET | /lab-orders | List orders | Any |
| PATCH | /lab-orders/:id/status | Update status | LAB_TECH |
| POST | /lab-results | Enter results | LAB_TECH |
| GET | /lab-results/patient/:patientId/trends | Trend data | Any |
| GET | /lab-tests | List test definitions | Any |

### Billing

| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| POST | /invoices | Create invoice | SUPER_ADMIN, RECEPTIONIST |
| GET | /invoices | List invoices | Any |
| GET | /invoices/:id | Invoice detail | Any |
| GET | /invoices/:id/pdf | Generate PDF | Any |
| POST | /payments | Record payment | SUPER_ADMIN, RECEPTIONIST |
| GET | /service-prices | Price list | Any |
| POST | /service-prices | Create/update price | SUPER_ADMIN |

### Dashboard

| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | /dashboard/admin | Admin stats | SUPER_ADMIN |
| GET | /dashboard/doctor | Doctor stats | DOCTOR |
| GET | /dashboard/revenue | Revenue data | SUPER_ADMIN |
| GET | /dashboard/export | Export CSV data | SUPER_ADMIN |

### Documents

| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| POST | /documents/upload | Upload file | Any |
| GET | /documents/patient/:patientId | Patient documents | Any |
| GET | /documents/:id/download | Download file | Any |
| DELETE | /documents/:id | Delete document | Any |

### Settings

| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | /settings | Get all settings | Any |
| PATCH | /settings | Update settings | SUPER_ADMIN |
| GET | /audit-logs | Audit trail | SUPER_ADMIN |

### Notifications

| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | /notifications | User notifications | Any |
| GET | /notifications/unread-count | Unread count | Any |
| PATCH | /notifications/:id/read | Mark as read | Any |
| PATCH | /notifications/read-all | Mark all read | Any |

## WebSocket

Connect to `ws://localhost:3001` with Socket.IO client.

Authentication: Pass JWT token in `auth.token` handshake option.

Events:
- `notification` - New notification received
- `appointment_update` - Appointment status changed
