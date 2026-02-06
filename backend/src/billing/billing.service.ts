import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { PaginationDto, paginate, paginationMeta } from '../common/dto/pagination.dto';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  // ─── Invoices ────────────────────────────────────────────────────────

  async createInvoice(dto: CreateInvoiceDto) {
    const invoiceNumber = await this.generateInvoiceNumber();

    const subtotal = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const tax = dto.tax ?? 0;
    const discount = dto.discount ?? 0;
    const total = subtotal + tax - discount;

    return this.prisma.invoice.create({
      data: {
        invoiceNumber,
        patientId: dto.patientId,
        consultationId: dto.consultationId,
        subtotal,
        tax,
        discount,
        total,
        status: InvoiceStatus.PENDING,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        notes: dto.notes,
        items: {
          create: dto.items.map((item) => ({
            description: item.description,
            category: item.category,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        items: true,
        patient: {
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

  async findAllInvoices(
    query: PaginationDto & {
      status?: InvoiceStatus;
      patientId?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const { skip, take } = paginate(query);
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.patientId) {
      where.patientId = query.patientId;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
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
            },
          },
          _count: {
            select: { items: true, payments: true },
          },
        },
        orderBy: { createdAt: query.sortOrder || 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices,
      meta: paginationMeta(total, query),
    };
  }

  async findOneInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            insuranceProvider: true,
            insuranceNumber: true,
          },
        },
        consultation: {
          select: {
            id: true,
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
        },
        items: true,
        payments: {
          include: {
            receivedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { paidAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  // ─── Payments ────────────────────────────────────────────────────────

  async recordPayment(dto: RecordPaymentDto, receivedById: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
      include: { payments: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (
      invoice.status === InvoiceStatus.PAID ||
      invoice.status === InvoiceStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot record payment for an invoice with status ${invoice.status}`,
      );
    }

    const totalPaidBefore = invoice.payments.reduce(
      (sum, p) => sum + p.amount,
      0,
    );
    const totalPaidAfter = totalPaidBefore + dto.amount;

    if (totalPaidAfter > invoice.total) {
      throw new BadRequestException(
        `Payment amount exceeds the remaining balance. Remaining: ${(invoice.total - totalPaidBefore).toFixed(2)}`,
      );
    }

    const newStatus: InvoiceStatus =
      totalPaidAfter >= invoice.total
        ? InvoiceStatus.PAID
        : InvoiceStatus.PARTIAL;

    const [payment] = await this.prisma.$transaction([
      this.prisma.payment.create({
        data: {
          invoiceId: dto.invoiceId,
          amount: dto.amount,
          method: dto.method,
          reference: dto.reference,
          notes: dto.notes,
          receivedById,
        },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              total: true,
              status: true,
            },
          },
          receivedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.invoice.update({
        where: { id: dto.invoiceId },
        data: { status: newStatus },
      }),
    ]);

    return {
      ...payment,
      invoice: {
        ...payment.invoice,
        status: newStatus,
      },
    };
  }

  // ─── Service Prices ──────────────────────────────────────────────────

  async findAllServicePrices(query?: {
    category?: string;
    specialtyId?: string;
  }) {
    const where: any = { isActive: true };

    if (query?.category) {
      where.category = query.category;
    }

    if (query?.specialtyId) {
      where.specialtyId = query.specialtyId;
    }

    return this.prisma.servicePrice.findMany({
      where,
      include: {
        specialty: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async upsertServicePrice(data: {
    id?: string;
    name: string;
    category: string;
    price: number;
    specialtyId?: string;
  }) {
    if (data.id) {
      return this.prisma.servicePrice.update({
        where: { id: data.id },
        data: {
          name: data.name,
          category: data.category,
          price: data.price,
          specialtyId: data.specialtyId,
        },
        include: {
          specialty: {
            select: { id: true, name: true },
          },
        },
      });
    }

    return this.prisma.servicePrice.create({
      data: {
        name: data.name,
        category: data.category,
        price: data.price,
        specialtyId: data.specialtyId,
      },
      include: {
        specialty: {
          select: { id: true, name: true },
        },
      },
    });
  }

  // ─── Private Helpers ─────────────────────────────────────────────────

  private async generateInvoiceNumber(): Promise<string> {
    const lastInvoice = await this.prisma.invoice.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true },
    });

    let nextNumber = 1;
    if (lastInvoice?.invoiceNumber) {
      const match = lastInvoice.invoiceNumber.match(/INV-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `INV-${nextNumber.toString().padStart(6, '0')}`;
  }
}
