import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { SearchPatientDto } from './dto/search-patient.dto';
import { paginate, paginationMeta } from '../common/dto/pagination.dto';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: SearchPatientDto) {
    const { skip, take } = paginate(query);

    const where: Prisma.PatientWhereInput = {};

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { mrn: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.gender) {
      where.gender = query.gender;
    }

    const orderBy: Prisma.PatientOrderByWithRelationInput = query.sortBy
      ? { [query.sortBy]: query.sortOrder || 'desc' }
      : { createdAt: 'desc' };

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          mrn: true,
          firstName: true,
          lastName: true,
          dob: true,
          gender: true,
          phone: true,
          email: true,
          bloodType: true,
          status: true,
          photo: true,
          createdAt: true,
        },
        orderBy,
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      data: patients,
      meta: paginationMeta(total, query),
    };
  }

  async findOne(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        familyGroup: {
          include: {
            patients: {
              select: {
                id: true,
                mrn: true,
                firstName: true,
                lastName: true,
                dob: true,
                gender: true,
                phone: true,
              },
            },
          },
        },
        appointments: {
          orderBy: { dateTime: 'desc' },
          take: 10,
          select: {
            id: true,
            dateTime: true,
            endTime: true,
            visitType: true,
            status: true,
            doctor: {
              select: { id: true, firstName: true, lastName: true },
            },
            specialty: {
              select: { id: true, name: true },
            },
          },
        },
        consultations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            status: true,
            subjective: true,
            assessment: true,
            completedAt: true,
            createdAt: true,
            doctor: {
              select: { id: true, firstName: true, lastName: true },
            },
            specialty: {
              select: { id: true, name: true },
            },
          },
        },
        prescriptions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            status: true,
            validUntil: true,
            createdAt: true,
            doctor: {
              select: { id: true, firstName: true, lastName: true },
            },
            items: {
              select: {
                id: true,
                medicationName: true,
                dosage: true,
                frequency: true,
                duration: true,
              },
            },
          },
        },
        labResults: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            value: true,
            unit: true,
            normalRangeMin: true,
            normalRangeMax: true,
            normalRangeText: true,
            isAbnormal: true,
            resultedAt: true,
            labOrderItem: {
              select: { testName: true },
            },
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return patient;
  }

  async create(dto: CreatePatientDto) {
    if (dto.nationalId) {
      const existing = await this.prisma.patient.findUnique({
        where: { nationalId: dto.nationalId },
      });
      if (existing) {
        throw new ConflictException('A patient with this national ID already exists');
      }
    }

    const mrn = await this.generateMrn();

    return this.prisma.patient.create({
      data: {
        ...dto,
        dob: new Date(dto.dob),
        mrn,
      },
    });
  }

  async update(id: string, dto: UpdatePatientDto) {
    await this.findOneOrFail(id);

    if (dto.nationalId) {
      const existing = await this.prisma.patient.findFirst({
        where: { nationalId: dto.nationalId, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('A patient with this national ID already exists');
      }
    }

    const data: any = { ...dto };
    if (dto.dob) {
      data.dob = new Date(dto.dob);
    }

    return this.prisma.patient.update({
      where: { id },
      data,
    });
  }

  async getTimeline(id: string) {
    await this.findOneOrFail(id);

    const [appointments, consultations, labOrders, prescriptions] =
      await Promise.all([
        this.prisma.appointment.findMany({
          where: { patientId: id },
          orderBy: { dateTime: 'desc' },
          select: {
            id: true,
            dateTime: true,
            endTime: true,
            visitType: true,
            status: true,
            notes: true,
            doctor: {
              select: { id: true, firstName: true, lastName: true },
            },
            specialty: {
              select: { id: true, name: true },
            },
          },
        }),
        this.prisma.consultation.findMany({
          where: { patientId: id },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            subjective: true,
            assessment: true,
            plan: true,
            completedAt: true,
            createdAt: true,
            doctor: {
              select: { id: true, firstName: true, lastName: true },
            },
            specialty: {
              select: { id: true, name: true },
            },
            diagnoses: {
              select: {
                icd10Code: true,
                icd10Description: true,
                isPrimary: true,
              },
            },
          },
        }),
        this.prisma.labOrder.findMany({
          where: { patientId: id },
          orderBy: { orderedAt: 'desc' },
          select: {
            id: true,
            status: true,
            priority: true,
            orderedAt: true,
            items: {
              select: {
                testName: true,
                result: {
                  select: {
                    value: true,
                    unit: true,
                    isAbnormal: true,
                    resultedAt: true,
                  },
                },
              },
            },
          },
        }),
        this.prisma.prescription.findMany({
          where: { patientId: id },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            createdAt: true,
            doctor: {
              select: { id: true, firstName: true, lastName: true },
            },
            items: {
              select: {
                medicationName: true,
                dosage: true,
                frequency: true,
                duration: true,
              },
            },
          },
        }),
      ]);

    // Build a unified timeline sorted by date
    const timeline = [
      ...appointments.map((a) => ({
        type: 'appointment' as const,
        date: a.dateTime,
        data: a,
      })),
      ...consultations.map((c) => ({
        type: 'consultation' as const,
        date: c.createdAt,
        data: c,
      })),
      ...labOrders.map((l) => ({
        type: 'lab_order' as const,
        date: l.orderedAt,
        data: l,
      })),
      ...prescriptions.map((p) => ({
        type: 'prescription' as const,
        date: p.createdAt,
        data: p,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { data: timeline };
  }

  async linkFamily(
    patientId: string,
    body: { memberId: string; groupName?: string },
  ) {
    const [patient, member] = await Promise.all([
      this.findOneOrFail(patientId),
      this.findOneOrFail(body.memberId),
    ]);

    // If the initiating patient already belongs to a family group, add the member to it
    if (patient.familyGroupId) {
      await this.prisma.patient.update({
        where: { id: body.memberId },
        data: { familyGroupId: patient.familyGroupId },
      });

      return this.prisma.familyGroup.findUnique({
        where: { id: patient.familyGroupId },
        include: {
          patients: {
            select: {
              id: true,
              mrn: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    }

    // If the member already belongs to a family group, add the patient to it
    if (member.familyGroupId) {
      await this.prisma.patient.update({
        where: { id: patientId },
        data: { familyGroupId: member.familyGroupId },
      });

      return this.prisma.familyGroup.findUnique({
        where: { id: member.familyGroupId },
        include: {
          patients: {
            select: {
              id: true,
              mrn: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    }

    // Neither patient has a family group -- create one
    const groupName =
      body.groupName || `${patient.lastName} Family`;

    const familyGroup = await this.prisma.familyGroup.create({
      data: {
        name: groupName,
        patients: {
          connect: [{ id: patientId }, { id: body.memberId }],
        },
      },
      include: {
        patients: {
          select: {
            id: true,
            mrn: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return familyGroup;
  }

  // ------------------------------------------------------------------ helpers

  private async findOneOrFail(id: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    return patient;
  }

  private async generateMrn(): Promise<string> {
    const lastPatient = await this.prisma.patient.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { mrn: true },
    });

    let nextNumber = 1;
    if (lastPatient?.mrn) {
      const numericPart = lastPatient.mrn.replace('MRN-', '');
      const parsed = parseInt(numericPart, 10);
      if (!isNaN(parsed)) {
        nextNumber = parsed + 1;
      }
    }

    return `MRN-${String(nextNumber).padStart(7, '0')}`;
  }
}
