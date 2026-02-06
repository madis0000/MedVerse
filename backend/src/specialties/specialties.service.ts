import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpecialtyDto, CreateSpecialtyFieldDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';

@Injectable()
export class SpecialtiesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.specialty.findMany({
      where: { isActive: true },
      include: { fields: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const specialty = await this.prisma.specialty.findUnique({
      where: { id },
      include: { fields: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!specialty) throw new NotFoundException('Specialty not found');
    return specialty;
  }

  async create(dto: CreateSpecialtyDto) {
    return this.prisma.specialty.create({ data: dto });
  }

  async update(id: string, dto: UpdateSpecialtyDto) {
    await this.findOne(id);
    return this.prisma.specialty.update({ where: { id }, data: dto });
  }

  async getFields(id: string) {
    await this.findOne(id);
    return this.prisma.specialtyField.findMany({
      where: { specialtyId: id },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async addField(id: string, dto: CreateSpecialtyFieldDto) {
    await this.findOne(id);
    return this.prisma.specialtyField.create({
      data: { specialtyId: id, ...dto },
    });
  }

  async removeField(fieldId: string) {
    return this.prisma.specialtyField.delete({ where: { id: fieldId } });
  }
}
