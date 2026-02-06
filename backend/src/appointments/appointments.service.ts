import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';
import { paginate, paginationMeta } from '../common/dto/pagination.dto';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryAppointmentDto) {
    const { skip, take } = paginate(query);
    const where = this.buildWhereClause(query);

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        skip,
        take,
        where,
        include: {
          patient: {
            select: {
              id: true,
              mrn: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          specialty: {
            select: { id: true, name: true },
          },
        },
        orderBy: { dateTime: query.sortOrder || 'asc' },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      data: appointments,
      meta: paginationMeta(total, query),
    };
  }

  async findCalendar(query: QueryAppointmentDto) {
    const where = this.buildWhereClause(query);

    const appointments = await this.prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            firstName: true,
            lastName: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        specialty: {
          select: { id: true, name: true },
        },
      },
      orderBy: { dateTime: 'asc' },
    });

    // Group appointments by date (YYYY-MM-DD)
    const grouped: Record<string, typeof appointments> = {};
    for (const appointment of appointments) {
      const dateKey = appointment.dateTime.toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(appointment);
    }

    return grouped;
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            firstName: true,
            lastName: true,
            phone: true,
            dob: true,
            gender: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        specialty: {
          select: { id: true, name: true },
        },
        consultation: {
          select: { id: true, status: true },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  async create(dto: CreateAppointmentDto) {
    const startTime = new Date(dto.dateTime);
    const endTime = new Date(dto.endTime);

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Conflict detection: check for overlapping appointments for the same doctor
    await this.checkForConflicts(dto.doctorId, startTime, endTime);

    return this.prisma.appointment.create({
      data: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        specialtyId: dto.specialtyId,
        dateTime: startTime,
        endTime: endTime,
        visitType: dto.visitType,
        notes: dto.notes,
        isRecurring: dto.isRecurring ?? false,
        recurringPattern: dto.recurringPattern ?? undefined,
      },
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            firstName: true,
            lastName: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        specialty: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    const existing = await this.findOne(id);

    // If time or doctor is being changed, re-check for conflicts
    const doctorId = dto.doctorId || existing.doctorId;
    const startTime = dto.dateTime ? new Date(dto.dateTime) : existing.dateTime;
    const endTime = dto.endTime ? new Date(dto.endTime) : existing.endTime;

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    if (dto.doctorId || dto.dateTime || dto.endTime) {
      await this.checkForConflicts(doctorId, startTime, endTime, id);
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        ...(dto.patientId && { patientId: dto.patientId }),
        ...(dto.doctorId && { doctorId: dto.doctorId }),
        ...(dto.specialtyId && { specialtyId: dto.specialtyId }),
        ...(dto.dateTime && { dateTime: new Date(dto.dateTime) }),
        ...(dto.endTime && { endTime: new Date(dto.endTime) }),
        ...(dto.visitType && { visitType: dto.visitType }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.isRecurring !== undefined && { isRecurring: dto.isRecurring }),
        ...(dto.recurringPattern !== undefined && { recurringPattern: dto.recurringPattern }),
      },
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            firstName: true,
            lastName: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        specialty: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async updateStatus(id: string, status: AppointmentStatus) {
    const appointment = await this.findOne(id);

    this.validateStatusTransition(appointment.status, status);

    return this.prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            firstName: true,
            lastName: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        specialty: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async checkIn(id: string) {
    return this.updateStatus(id, AppointmentStatus.CHECKED_IN);
  }

  async getWaitingQueue() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.CHECKED_IN,
        dateTime: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        specialty: {
          select: { id: true, name: true },
        },
      },
      orderBy: { dateTime: 'asc' },
    });
  }

  // ─── Private helpers ───────────────────────────────────────────────

  private buildWhereClause(query: QueryAppointmentDto) {
    const where: any = {};

    if (query.startDate || query.endDate) {
      where.dateTime = {};
      if (query.startDate) {
        where.dateTime.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.dateTime.lte = new Date(query.endDate);
      }
    }

    if (query.doctorId) {
      where.doctorId = query.doctorId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.specialtyId) {
      where.specialtyId = query.specialtyId;
    }

    return where;
  }

  /**
   * Check for overlapping appointments for the same doctor.
   * An overlap exists when:
   *   existing.start < newEnd  AND  existing.end > newStart
   * Optionally exclude a specific appointment (for updates).
   */
  private async checkForConflicts(
    doctorId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ) {
    const conflicting = await this.prisma.appointment.findFirst({
      where: {
        doctorId,
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
        ...(excludeId && { id: { not: excludeId } }),
        dateTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (conflicting) {
      throw new ConflictException(
        'Doctor already has an appointment during the requested time slot',
      );
    }
  }

  /**
   * Validate that a status transition is allowed.
   * Allowed transitions:
   *   SCHEDULED   -> CHECKED_IN, CANCELLED, NO_SHOW
   *   CHECKED_IN  -> IN_PROGRESS, CANCELLED
   *   IN_PROGRESS -> COMPLETED, CANCELLED
   */
  private validateStatusTransition(
    current: AppointmentStatus,
    next: AppointmentStatus,
  ) {
    const allowedTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      [AppointmentStatus.SCHEDULED]: [
        AppointmentStatus.CHECKED_IN,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.NO_SHOW,
      ],
      [AppointmentStatus.CHECKED_IN]: [
        AppointmentStatus.IN_PROGRESS,
        AppointmentStatus.CANCELLED,
      ],
      [AppointmentStatus.IN_PROGRESS]: [
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
      ],
      [AppointmentStatus.COMPLETED]: [],
      [AppointmentStatus.NO_SHOW]: [],
      [AppointmentStatus.CANCELLED]: [],
    };

    const allowed = allowedTransitions[current];
    if (!allowed || !allowed.includes(next)) {
      throw new BadRequestException(
        `Cannot transition from ${current} to ${next}`,
      );
    }
  }
}
