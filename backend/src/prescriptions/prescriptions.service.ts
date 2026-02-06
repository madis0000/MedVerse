import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';

@Injectable()
export class PrescriptionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePrescriptionDto, doctorId: string) {
    return this.prisma.prescription.create({
      data: {
        consultationId: dto.consultationId,
        patientId: dto.patientId,
        doctorId,
        notes: dto.notes,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        items: {
          create: dto.items.map((item) => ({
            medicationId: item.medicationId,
            medicationName: item.medicationName,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            route: item.route,
            instructions: item.instructions,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: { include: { medication: true } },
        patient: true,
        doctor: { select: { id: true, firstName: true, lastName: true, specialty: true } },
      },
    });
  }

  async findOne(id: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        items: { include: { medication: true } },
        patient: true,
        doctor: { select: { id: true, firstName: true, lastName: true, specialty: true } },
        consultation: true,
      },
    });
    if (!prescription) throw new NotFoundException('Prescription not found');
    return prescription;
  }

  async findByPatient(patientId: string) {
    return this.prisma.prescription.findMany({
      where: { patientId },
      include: {
        items: { include: { medication: true } },
        doctor: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async checkDrugInteractions(medicationIds: string[]) {
    if (medicationIds.length < 2) return [];

    const interactions = await this.prisma.drugInteraction.findMany({
      where: {
        OR: [
          { medication1Id: { in: medicationIds }, medication2Id: { in: medicationIds } },
          { medication2Id: { in: medicationIds }, medication1Id: { in: medicationIds } },
        ],
      },
      include: {
        medication1: { select: { name: true } },
        medication2: { select: { name: true } },
      },
    });

    return interactions;
  }

  async cancel(id: string) {
    await this.findOne(id);
    return this.prisma.prescription.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}
