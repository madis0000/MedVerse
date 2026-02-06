export type Role = 'SUPER_ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'LAB_TECH';
export type PatientStatus = 'NEW' | 'ACTIVE' | 'INACTIVE' | 'REFERRED' | 'DISCHARGED';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type BloodType = 'A_POSITIVE' | 'A_NEGATIVE' | 'B_POSITIVE' | 'B_NEGATIVE' | 'AB_POSITIVE' | 'AB_NEGATIVE' | 'O_POSITIVE' | 'O_NEGATIVE' | 'UNKNOWN';
export type VisitType = 'FIRST_VISIT' | 'FOLLOW_UP' | 'EMERGENCY' | 'PROCEDURE' | 'TELECONSULTATION';
export type AppointmentStatus = 'SCHEDULED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
export type ConsultationStatus = 'IN_PROGRESS' | 'COMPLETED' | 'AMENDED';
export type PrescriptionStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type LabOrderStatus = 'PENDING' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'RESULTS_AVAILABLE' | 'CANCELLED';
export type LabPriority = 'ROUTINE' | 'URGENT' | 'STAT';
export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'CARD' | 'INSURANCE' | 'BANK_TRANSFER';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  specialtyId?: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  specialty?: Specialty;
  createdAt: string;
}

export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: Gender;
  nationalId?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  bloodType: BloodType;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  photo?: string;
  status: PatientStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Specialty {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  fields?: SpecialtyField[];
}

export interface SpecialtyField {
  id: string;
  specialtyId: string;
  fieldName: string;
  fieldType: string;
  options?: any;
  isRequired: boolean;
  sortOrder: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  specialtyId: string;
  dateTime: string;
  endTime: string;
  visitType: VisitType;
  status: AppointmentStatus;
  notes?: string;
  patient?: Patient;
  doctor?: User;
  specialty?: Specialty;
}

export interface Consultation {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  specialtyId: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  customFields?: any;
  status: ConsultationStatus;
  completedAt?: string;
  vitalSigns?: VitalSign[];
  diagnoses?: Diagnosis[];
  prescriptions?: Prescription[];
  patient?: Patient;
  doctor?: User;
}

export interface VitalSign {
  id: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  spO2?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  respiratoryRate?: number;
  notes?: string;
  createdAt: string;
}

export interface Diagnosis {
  id: string;
  icd10Code: string;
  icd10Description: string;
  isPrimary: boolean;
  notes?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  notes?: string;
  status: PrescriptionStatus;
  validUntil?: string;
  items?: PrescriptionItem[];
  patient?: Patient;
  doctor?: User;
  createdAt: string;
}

export interface PrescriptionItem {
  id: string;
  medicationId?: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions?: string;
  quantity?: number;
}

export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  category: string;
  form: string;
  strengths?: string[];
}

export interface LabOrder {
  id: string;
  patientId: string;
  status: LabOrderStatus;
  priority: LabPriority;
  notes?: string;
  items?: LabOrderItem[];
  patient?: Patient;
  orderedBy?: User;
  createdAt: string;
}

export interface LabOrderItem {
  id: string;
  labTestId: string;
  testName: string;
  result?: LabResult;
}

export interface LabResult {
  id: string;
  value: string;
  unit?: string;
  normalRangeMin?: number;
  normalRangeMax?: number;
  normalRangeText?: string;
  isAbnormal: boolean;
  resultedAt: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  invoiceNumber: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: InvoiceStatus;
  dueDate?: string;
  notes?: string;
  items?: InvoiceItem[];
  payments?: Payment[];
  patient?: Patient;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  paidAt: string;
  notes?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
