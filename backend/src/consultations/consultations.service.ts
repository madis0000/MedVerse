import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { AppointmentStatus, ConsultationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';

@Injectable()
export class ConsultationsService {
  constructor(private prisma: PrismaService) {}

  // ─── Consultation CRUD ──────────────────────────────────────────────

  async create(dto: CreateConsultationDto, doctorId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      include: {
        consultation: { select: { id: true } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.consultation) {
      throw new ConflictException(
        'A consultation already exists for this appointment',
      );
    }

    // Create consultation and update appointment status in a transaction
    const consultation = await this.prisma.$transaction(async (tx) => {
      const created = await tx.consultation.create({
        data: {
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          doctorId,
          specialtyId: appointment.specialtyId,
          status: ConsultationStatus.IN_PROGRESS,
        },
        include: {
          appointment: {
            select: { id: true, dateTime: true, visitType: true },
          },
          patient: {
            select: {
              id: true,
              mrn: true,
              firstName: true,
              lastName: true,
            },
          },
          doctor: {
            select: { id: true, firstName: true, lastName: true },
          },
          specialty: {
            select: { id: true, name: true },
          },
        },
      });

      await tx.appointment.update({
        where: { id: appointment.id },
        data: { status: AppointmentStatus.IN_PROGRESS },
      });

      return created;
    });

    return consultation;
  }

  async findOne(id: string) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: {
        appointment: {
          select: { id: true, dateTime: true, endTime: true, visitType: true },
        },
        patient: {
          select: {
            id: true,
            mrn: true,
            firstName: true,
            lastName: true,
            dob: true,
            gender: true,
            bloodType: true,
            phone: true,
          },
        },
        doctor: {
          select: { id: true, firstName: true, lastName: true },
        },
        specialty: {
          select: { id: true, name: true },
        },
        vitalSigns: {
          orderBy: { createdAt: 'desc' },
        },
        diagnoses: {
          orderBy: { createdAt: 'asc' },
        },
        prescriptions: {
          include: {
            items: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        labOrders: {
          include: {
            items: {
              include: {
                result: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    return consultation;
  }

  async update(id: string, dto: UpdateConsultationDto) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
    });

    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    const data: any = {};

    if (dto.subjective !== undefined) data.subjective = dto.subjective;
    if (dto.objective !== undefined) data.objective = dto.objective;
    if (dto.assessment !== undefined) data.assessment = dto.assessment;
    if (dto.plan !== undefined) data.plan = dto.plan;
    if (dto.customFields !== undefined) data.customFields = dto.customFields;

    if (dto.status !== undefined) {
      this.validateStatusTransition(consultation.status, dto.status);
      data.status = dto.status;
      if (dto.status === ConsultationStatus.COMPLETED) {
        data.completedAt = new Date();
      }
    }

    return this.prisma.consultation.update({
      where: { id },
      data,
      include: {
        appointment: {
          select: { id: true, dateTime: true, visitType: true },
        },
        patient: {
          select: {
            id: true,
            mrn: true,
            firstName: true,
            lastName: true,
          },
        },
        doctor: {
          select: { id: true, firstName: true, lastName: true },
        },
        specialty: {
          select: { id: true, name: true },
        },
      },
    });
  }

  // ─── Vital Signs ────────────────────────────────────────────────────

  async recordVitals(
    consultationId: string,
    data: {
      bloodPressureSystolic?: number;
      bloodPressureDiastolic?: number;
      heartRate?: number;
      temperature?: number;
      spO2?: number;
      weight?: number;
      height?: number;
      respiratoryRate?: number;
      notes?: string;
    },
    recordedById: string,
  ) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    // Auto-calculate BMI from weight (kg) and height (cm)
    let bmi: number | undefined;
    if (data.weight && data.height) {
      const heightInMeters = data.height / 100;
      bmi = parseFloat(
        (data.weight / (heightInMeters * heightInMeters)).toFixed(2),
      );
    }

    return this.prisma.vitalSign.create({
      data: {
        consultationId,
        patientId: consultation.patientId,
        bloodPressureSystolic: data.bloodPressureSystolic,
        bloodPressureDiastolic: data.bloodPressureDiastolic,
        heartRate: data.heartRate,
        temperature: data.temperature,
        spO2: data.spO2,
        weight: data.weight,
        height: data.height,
        bmi,
        respiratoryRate: data.respiratoryRate,
        notes: data.notes,
        recordedById,
      },
    });
  }

  // ─── Diagnoses ──────────────────────────────────────────────────────

  async addDiagnosis(
    consultationId: string,
    data: {
      icd10Code: string;
      icd10Description: string;
      isPrimary?: boolean;
      notes?: string;
    },
  ) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    // If marking as primary, unset any existing primary diagnosis
    if (data.isPrimary) {
      await this.prisma.diagnosis.updateMany({
        where: { consultationId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.prisma.diagnosis.create({
      data: {
        consultationId,
        icd10Code: data.icd10Code,
        icd10Description: data.icd10Description,
        isPrimary: data.isPrimary ?? false,
        notes: data.notes,
      },
    });
  }

  async removeDiagnosis(consultationId: string, diagnosisId: string) {
    const diagnosis = await this.prisma.diagnosis.findFirst({
      where: { id: diagnosisId, consultationId },
    });

    if (!diagnosis) {
      throw new NotFoundException('Diagnosis not found in this consultation');
    }

    return this.prisma.diagnosis.delete({
      where: { id: diagnosisId },
    });
  }

  // ─── ICD-10 Search ──────────────────────────────────────────────────

  async searchICD10(query: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    return this.prisma.iCD10Code.findMany({
      where: {
        OR: [
          { code: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });
  }

  // ─── Medication Search ──────────────────────────────────────────────

  async searchMedications(query: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    return this.prisma.medication.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { genericName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });
  }

  // ─── Quick Texts ────────────────────────────────────────────────────

  async getQuickTexts(doctorId: string) {
    return this.prisma.quickText.findMany({
      where: { doctorId },
      orderBy: { category: 'asc' },
    });
  }

  async createQuickText(
    doctorId: string,
    data: { title: string; content: string; category: string },
  ) {
    return this.prisma.quickText.create({
      data: {
        doctorId,
        title: data.title,
        content: data.content,
        category: data.category,
      },
    });
  }

  // ─── Private helpers ────────────────────────────────────────────────

  /**
   * Validate consultation status transitions.
   * Allowed transitions:
   *   IN_PROGRESS -> COMPLETED
   *   COMPLETED   -> AMENDED
   *   AMENDED     -> COMPLETED
   */
  private validateStatusTransition(
    current: ConsultationStatus,
    next: ConsultationStatus,
  ) {
    const allowedTransitions: Record<
      ConsultationStatus,
      ConsultationStatus[]
    > = {
      [ConsultationStatus.IN_PROGRESS]: [ConsultationStatus.COMPLETED],
      [ConsultationStatus.COMPLETED]: [ConsultationStatus.AMENDED],
      [ConsultationStatus.AMENDED]: [ConsultationStatus.COMPLETED],
    };

    const allowed = allowedTransitions[current];
    if (!allowed || !allowed.includes(next)) {
      throw new BadRequestException(
        `Cannot transition from ${current} to ${next}`,
      );
    }
  }
}
