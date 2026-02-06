import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { EnterResultDto } from './dto/enter-result.dto';
import { LabOrderStatus } from '@prisma/client';
import { PaginationDto, paginate, paginationMeta } from '../common/dto/pagination.dto';

@Injectable()
export class LaboratoryService {
  constructor(private prisma: PrismaService) {}

  async createOrder(dto: CreateLabOrderDto, orderedById: string) {
    return this.prisma.labOrder.create({
      data: {
        consultationId: dto.consultationId,
        patientId: dto.patientId,
        orderedById,
        priority: dto.priority || 'ROUTINE',
        notes: dto.notes,
        items: {
          create: dto.items.map((item) => ({
            labTestId: item.labTestId,
            testName: item.testName,
          })),
        },
      },
      include: {
        items: { include: { labTest: true } },
        patient: true,
        orderedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findAll(query: PaginationDto & { status?: LabOrderStatus; patientId?: string }) {
    const { skip, take } = paginate(query);
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.patientId) where.patientId = query.patientId;

    const [orders, total] = await Promise.all([
      this.prisma.labOrder.findMany({
        where,
        skip,
        take,
        include: {
          items: { include: { labTest: true, result: true } },
          patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
          orderedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.labOrder.count({ where }),
    ]);

    return { data: orders, meta: paginationMeta(total, query) };
  }

  async findOne(id: string) {
    const order = await this.prisma.labOrder.findUnique({
      where: { id },
      include: {
        items: { include: { labTest: true, result: true } },
        patient: true,
        orderedBy: { select: { id: true, firstName: true, lastName: true } },
        consultation: true,
      },
    });
    if (!order) throw new NotFoundException('Lab order not found');
    return order;
  }

  async updateStatus(id: string, status: LabOrderStatus) {
    await this.findOne(id);
    return this.prisma.labOrder.update({
      where: { id },
      data: { status },
    });
  }

  async enterResult(dto: EnterResultDto, resultedById: string) {
    const orderItem = await this.prisma.labOrderItem.findUnique({
      where: { id: dto.labOrderItemId },
      include: { labOrder: true, labTest: true },
    });

    if (!orderItem) throw new NotFoundException('Lab order item not found');

    const existingResult = await this.prisma.labResult.findUnique({
      where: { labOrderItemId: dto.labOrderItemId },
    });
    if (existingResult) throw new BadRequestException('Result already entered for this item');

    const numericValue = parseFloat(dto.value);
    const rangeMin = dto.normalRangeMin ?? orderItem.labTest.normalRangeMin;
    const rangeMax = dto.normalRangeMax ?? orderItem.labTest.normalRangeMax;

    let isAbnormal = false;
    if (!isNaN(numericValue) && rangeMin != null && rangeMax != null) {
      isAbnormal = numericValue < rangeMin || numericValue > rangeMax;
    }

    const result = await this.prisma.labResult.create({
      data: {
        labOrderItemId: dto.labOrderItemId,
        labOrderId: orderItem.labOrderId,
        patientId: orderItem.labOrder.patientId,
        value: dto.value,
        unit: dto.unit || orderItem.labTest.unit,
        normalRangeMin: rangeMin,
        normalRangeMax: rangeMax,
        normalRangeText: dto.normalRangeText || orderItem.labTest.normalRangeText,
        isAbnormal,
        resultedById,
        notes: dto.notes,
      },
    });

    // Check if all items have results, update order status
    const allItems = await this.prisma.labOrderItem.findMany({
      where: { labOrderId: orderItem.labOrderId },
      include: { result: true },
    });
    const allHaveResults = allItems.every((item) => item.result);
    if (allHaveResults) {
      await this.prisma.labOrder.update({
        where: { id: orderItem.labOrderId },
        data: { status: 'RESULTS_AVAILABLE' },
      });
    }

    return result;
  }

  async getPatientTrends(patientId: string) {
    const results = await this.prisma.labResult.findMany({
      where: { patientId },
      include: { labOrderItem: { include: { labTest: true } } },
      orderBy: { resultedAt: 'asc' },
    });

    const grouped: Record<string, any[]> = {};
    results.forEach((r) => {
      const testName = r.labOrderItem.labTest.name;
      if (!grouped[testName]) grouped[testName] = [];
      grouped[testName].push({
        date: r.resultedAt,
        value: parseFloat(r.value) || 0,
        unit: r.unit,
        isAbnormal: r.isAbnormal,
        normalRangeMin: r.normalRangeMin,
        normalRangeMax: r.normalRangeMax,
      });
    });

    return grouped;
  }

  async getTestDefinitions() {
    return this.prisma.labTestDefinition.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }
}
