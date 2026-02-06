import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll(specialtyId?: string, doctorId?: string) {
    const where: any = { isActive: true };

    if (specialtyId) {
      where.specialtyId = specialtyId;
    }

    // Show specialty-level templates (doctorId is null) plus the doctor's own templates
    if (doctorId) {
      where.OR = [{ doctorId: null }, { doctorId }];
    }

    return this.prisma.consultationTemplate.findMany({
      where,
      include: {
        specialty: {
          select: { id: true, name: true },
        },
        doctor: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async create(data: {
    name: string;
    specialtyId: string;
    doctorId?: string;
    fields: Record<string, any>;
    isDefault?: boolean;
  }) {
    return this.prisma.consultationTemplate.create({
      data: {
        name: data.name,
        specialtyId: data.specialtyId,
        doctorId: data.doctorId,
        fields: data.fields,
        isDefault: data.isDefault ?? false,
      },
      include: {
        specialty: {
          select: { id: true, name: true },
        },
        doctor: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      fields?: Record<string, any>;
      isDefault?: boolean;
      isActive?: boolean;
    },
  ) {
    const template = await this.prisma.consultationTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return this.prisma.consultationTemplate.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.fields !== undefined && { fields: data.fields }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        specialty: {
          select: { id: true, name: true },
        },
        doctor: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }
}
