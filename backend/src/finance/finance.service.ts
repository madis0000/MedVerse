import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InvoiceStatus, PaymentMethod, ExpenseStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto';
import { CloseDayDto } from './dto/close-day.dto';
import { CreateWriteOffDto } from './dto/create-write-off.dto';
import { MonthlyDataEntryDto } from './dto/data-entry.dto';
import { QueryExpenseDto, QueryRevenueDto, QueryReportDto } from './dto/query-finance.dto';
import { paginate, paginationMeta } from '../common/dto/pagination.dto';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  // ─── Dashboard ────────────────────────────────────────────────────

  async getDashboard(startDate?: string, endDate?: string) {
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(endDate) : now;

    const prevStart = new Date(start);
    prevStart.setMonth(prevStart.getMonth() - 1);
    const prevEnd = new Date(end);
    prevEnd.setMonth(prevEnd.getMonth() - 1);

    const [
      currentRevenue,
      previousRevenue,
      currentExpenses,
      previousExpenses,
      outstandingInvoices,
      paidInvoices,
      allPayments,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { paidAt: { gte: start, lte: end } },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { paidAt: { gte: prevStart, lte: prevEnd } },
      }),
      this.prisma.expense.aggregate({
        _sum: { amount: true },
        where: {
          expenseDate: { gte: start, lte: end },
          status: { in: ['APPROVED', 'PAID'] },
        },
      }),
      this.prisma.expense.aggregate({
        _sum: { amount: true },
        where: {
          expenseDate: { gte: prevStart, lte: prevEnd },
          status: { in: ['APPROVED', 'PAID'] },
        },
      }),
      this.prisma.invoice.aggregate({
        _sum: { total: true },
        _count: true,
        where: { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
      }),
      this.prisma.invoice.findMany({
        where: {
          status: 'PAID',
          updatedAt: { gte: start, lte: end },
        },
        include: { payments: true },
      }),
      this.prisma.payment.findMany({
        where: { paidAt: { gte: start, lte: end } },
      }),
    ]);

    const totalRevenue = currentRevenue._sum.amount || 0;
    const prevTotalRevenue = previousRevenue._sum.amount || 0;
    const totalExpenses = currentExpenses._sum.amount || 0;
    const prevTotalExpenses = previousExpenses._sum.amount || 0;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const outstandingAR = outstandingInvoices._sum.total || 0;

    // Collection rate: payments received / total invoiced in period
    const totalInvoiced = await this.prisma.invoice.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: start, lte: end }, status: { not: 'CANCELLED' } },
    });
    const totalInvoicedAmount = totalInvoiced._sum.total || 0;
    const collectionRate = totalInvoicedAmount > 0 ? (totalRevenue / totalInvoicedAmount) * 100 : 0;

    // Avg days to payment
    let avgDaysToPayment = 0;
    if (paidInvoices.length > 0) {
      const totalDays = paidInvoices.reduce((sum, inv) => {
        const lastPayment = inv.payments.sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime())[0];
        if (lastPayment) {
          const days = (lastPayment.paidAt.getTime() - inv.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }
        return sum;
      }, 0);
      avgDaysToPayment = Math.round(totalDays / paidInvoices.length);
    }

    const revenueMoM = prevTotalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 : 0;
    const expenseMoM = prevTotalExpenses > 0 ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 : 0;

    // Today's totals
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const [todayRevenue, todayExpenses] = await Promise.all([
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { paidAt: { gte: todayStart, lt: todayEnd } },
      }),
      this.prisma.expense.aggregate({
        _sum: { amount: true },
        where: {
          expenseDate: { gte: todayStart, lt: todayEnd },
          status: { in: ['APPROVED', 'PAID'] },
        },
      }),
    ]);

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin: Math.round(profitMargin * 100) / 100,
      outstandingAR,
      outstandingCount: outstandingInvoices._count,
      collectionRate: Math.round(collectionRate * 100) / 100,
      avgDaysToPayment,
      revenueMoM: Math.round(revenueMoM * 100) / 100,
      expenseMoM: Math.round(expenseMoM * 100) / 100,
      todayRevenue: todayRevenue._sum.amount || 0,
      todayExpenses: todayExpenses._sum.amount || 0,
    };
  }

  async getDashboardCashflow(months: number = 6) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    const [payments, expenses] = await Promise.all([
      this.prisma.payment.findMany({
        where: { paidAt: { gte: start } },
        select: { amount: true, paidAt: true },
        orderBy: { paidAt: 'asc' },
      }),
      this.prisma.expense.findMany({
        where: {
          expenseDate: { gte: start },
          status: { in: ['APPROVED', 'PAID'] },
        },
        select: { amount: true, expenseDate: true },
        orderBy: { expenseDate: 'asc' },
      }),
    ]);

    // Group by month
    const monthlyData: Record<string, { inflows: number; outflows: number }> = {};
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = { inflows: 0, outflows: 0 };
    }

    for (const p of payments) {
      const key = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key]) monthlyData[key].inflows += p.amount;
    }

    for (const e of expenses) {
      const key = `${e.expenseDate.getFullYear()}-${String(e.expenseDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key]) monthlyData[key].outflows += e.amount;
    }

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data,
      net: data.inflows - data.outflows,
    }));
  }

  async getDashboardSparklines() {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 13); // 14 days including today
    start.setHours(0, 0, 0, 0);

    const [payments, expenses] = await Promise.all([
      this.prisma.payment.findMany({
        where: { paidAt: { gte: start } },
        select: { amount: true, paidAt: true },
      }),
      this.prisma.expense.findMany({
        where: {
          expenseDate: { gte: start },
          status: { in: ['APPROVED', 'PAID'] },
        },
        select: { amount: true, expenseDate: true },
      }),
    ]);

    const revenue: number[] = [];
    const expenseData: number[] = [];

    for (let i = 0; i < 14; i++) {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayRevenue = payments
        .filter((p) => p.paidAt >= day && p.paidAt < nextDay)
        .reduce((sum, p) => sum + p.amount, 0);
      revenue.push(dayRevenue);

      const dayExpense = expenses
        .filter((e) => e.expenseDate >= day && e.expenseDate < nextDay)
        .reduce((sum, e) => sum + e.amount, 0);
      expenseData.push(dayExpense);
    }

    return { revenue, expenses: expenseData };
  }

  // ─── Daily Operations ────────────────────────────────────────────

  async getDailySummary(date: string) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const [payments, invoices, consultations, expenses, closing] = await Promise.all([
      this.prisma.payment.findMany({
        where: { paidAt: { gte: dayStart, lt: dayEnd } },
        include: {
          invoice: {
            include: {
              patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
            },
          },
          receivedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { paidAt: 'desc' },
      }),
      this.prisma.invoice.findMany({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
      }),
      this.prisma.consultation.findMany({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
          doctor: { select: { id: true, firstName: true, lastName: true } },
          appointment: { select: { dateTime: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.expense.findMany({
        where: { expenseDate: { gte: dayStart, lt: dayEnd } },
        include: {
          category: { select: { id: true, name: true, color: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.dailyClosing.findUnique({
        where: { date: dayStart },
      }),
    ]);

    // Calculate totals by payment method
    const byMethod = { CASH: 0, CARD: 0, INSURANCE: 0, BANK_TRANSFER: 0 };
    for (const p of payments) {
      byMethod[p.method] += p.amount;
    }

    return {
      date: dayStart.toISOString(),
      status: closing?.status || 'OPEN',
      closing,
      payments,
      invoices,
      consultations,
      expenses,
      totals: {
        cash: byMethod.CASH,
        card: byMethod.CARD,
        insurance: byMethod.INSURANCE,
        bankTransfer: byMethod.BANK_TRANSFER,
        total: Object.values(byMethod).reduce((a, b) => a + b, 0),
      },
      counts: {
        payments: payments.length,
        invoices: invoices.length,
        consultations: consultations.length,
        expenses: expenses.length,
      },
    };
  }

  async closeDay(dto: CloseDayDto, userId: string) {
    const dayStart = new Date(dto.date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    // Check if already closed
    const existing = await this.prisma.dailyClosing.findUnique({
      where: { date: dayStart },
    });
    if (existing && existing.status !== 'OPEN') {
      throw new BadRequestException('This day has already been closed');
    }

    // Calculate expected totals from payments
    const payments = await this.prisma.payment.findMany({
      where: { paidAt: { gte: dayStart, lt: dayEnd } },
    });

    const expected = { CASH: 0, CARD: 0, INSURANCE: 0, BANK_TRANSFER: 0 };
    for (const p of payments) {
      expected[p.method] += p.amount;
    }

    const invoiceCount = await this.prisma.invoice.count({
      where: { createdAt: { gte: dayStart, lt: dayEnd } },
    });
    const consultationCount = await this.prisma.consultation.count({
      where: { createdAt: { gte: dayStart, lt: dayEnd } },
    });

    const varianceCash = dto.actualCash - expected.CASH;
    const expectedTotal = expected.CASH + expected.CARD + expected.INSURANCE + expected.BANK_TRANSFER;
    const actualTotal = dto.actualCash + dto.actualCard + dto.actualInsurance + dto.actualBankTransfer;
    const varianceTotal = actualTotal - expectedTotal;

    const data = {
      date: dayStart,
      status: 'CLOSED' as const,
      expectedCash: expected.CASH,
      actualCash: dto.actualCash,
      expectedCard: expected.CARD,
      actualCard: dto.actualCard,
      expectedInsurance: expected.INSURANCE,
      actualInsurance: dto.actualInsurance,
      expectedBankTransfer: expected.BANK_TRANSFER,
      actualBankTransfer: dto.actualBankTransfer,
      varianceCash,
      varianceTotal,
      invoiceCount,
      paymentCount: payments.length,
      consultationCount,
      notes: dto.notes,
      closedById: userId,
      closedAt: new Date(),
    };

    if (existing) {
      return this.prisma.dailyClosing.update({
        where: { id: existing.id },
        data,
      });
    }

    return this.prisma.dailyClosing.create({ data });
  }

  async getDailyHistory(limit: number = 30) {
    return this.prisma.dailyClosing.findMany({
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        closedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  // ─── Revenue Analytics ──────────────────────────────────────────

  async getRevenueAnalytics(query: QueryRevenueDto) {
    const now = new Date();
    const start = query.startDate ? new Date(query.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = query.endDate ? new Date(query.endDate) : now;

    const payments = await this.prisma.payment.findMany({
      where: { paidAt: { gte: start, lte: end } },
      include: {
        invoice: {
          include: {
            items: true,
            consultation: {
              include: {
                doctor: { select: { id: true, firstName: true, lastName: true } },
                specialty: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalRevenue,
      paymentCount: payments.length,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }

  async getRevenueByDoctor(query: QueryRevenueDto) {
    const start = query.startDate ? new Date(query.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = query.endDate ? new Date(query.endDate) : new Date();

    const consultations = await this.prisma.consultation.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: {
        doctor: { select: { id: true, firstName: true, lastName: true } },
        invoices: {
          include: { payments: true },
        },
      },
    });

    const byDoctor: Record<string, { doctorId: string; doctorName: string; revenue: number; consultationCount: number }> = {};
    for (const c of consultations) {
      const key = c.doctorId;
      if (!byDoctor[key]) {
        byDoctor[key] = {
          doctorId: c.doctorId,
          doctorName: `Dr. ${c.doctor.firstName} ${c.doctor.lastName}`,
          revenue: 0,
          consultationCount: 0,
        };
      }
      byDoctor[key].consultationCount++;
      for (const inv of c.invoices) {
        for (const pay of inv.payments) {
          if (pay.paidAt >= start && pay.paidAt <= end) {
            byDoctor[key].revenue += pay.amount;
          }
        }
      }
    }

    return Object.values(byDoctor).sort((a, b) => b.revenue - a.revenue);
  }

  async getRevenueBySpecialty(query: QueryRevenueDto) {
    const start = query.startDate ? new Date(query.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = query.endDate ? new Date(query.endDate) : new Date();

    const consultations = await this.prisma.consultation.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: {
        specialty: { select: { id: true, name: true } },
        invoices: {
          include: { payments: true },
        },
      },
    });

    const bySpecialty: Record<string, { specialtyId: string; specialtyName: string; revenue: number; count: number }> = {};
    for (const c of consultations) {
      const key = c.specialtyId;
      if (!bySpecialty[key]) {
        bySpecialty[key] = {
          specialtyId: c.specialtyId,
          specialtyName: c.specialty.name,
          revenue: 0,
          count: 0,
        };
      }
      bySpecialty[key].count++;
      for (const inv of c.invoices) {
        for (const pay of inv.payments) {
          if (pay.paidAt >= start && pay.paidAt <= end) {
            bySpecialty[key].revenue += pay.amount;
          }
        }
      }
    }

    return Object.values(bySpecialty).sort((a, b) => b.revenue - a.revenue);
  }

  async getRevenueByService(query: QueryRevenueDto) {
    const start = query.startDate ? new Date(query.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = query.endDate ? new Date(query.endDate) : new Date();

    const invoiceItems = await this.prisma.invoiceItem.findMany({
      where: {
        invoice: {
          status: { in: ['PAID', 'PARTIAL'] },
          createdAt: { gte: start, lte: end },
        },
      },
      include: {
        invoice: { select: { status: true } },
      },
    });

    const byCategory: Record<string, { category: string; revenue: number; count: number }> = {};
    for (const item of invoiceItems) {
      if (!byCategory[item.category]) {
        byCategory[item.category] = { category: item.category, revenue: 0, count: 0 };
      }
      byCategory[item.category].revenue += item.total;
      byCategory[item.category].count += item.quantity;
    }

    return Object.values(byCategory).sort((a, b) => b.revenue - a.revenue);
  }

  async getRevenueByPaymentMethod(query: QueryRevenueDto) {
    const start = query.startDate ? new Date(query.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = query.endDate ? new Date(query.endDate) : new Date();

    const payments = await this.prisma.payment.findMany({
      where: { paidAt: { gte: start, lte: end } },
    });

    const byMethod: Record<string, number> = { CASH: 0, CARD: 0, INSURANCE: 0, BANK_TRANSFER: 0 };
    for (const p of payments) {
      byMethod[p.method] += p.amount;
    }

    return Object.entries(byMethod).map(([method, amount]) => ({ method, amount }));
  }

  async getRevenueTrends(query: QueryRevenueDto) {
    const now = new Date();
    const monthsBack = 12;
    const start = query.startDate ? new Date(query.startDate) : new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1);
    const end = query.endDate ? new Date(query.endDate) : now;

    const payments = await this.prisma.payment.findMany({
      where: { paidAt: { gte: start, lte: end } },
      select: { amount: true, paidAt: true },
      orderBy: { paidAt: 'asc' },
    });

    const monthly: Record<string, number> = {};
    let d = new Date(start.getFullYear(), start.getMonth(), 1);
    while (d <= end) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthly[key] = 0;
      d.setMonth(d.getMonth() + 1);
    }

    for (const p of payments) {
      const key = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, '0')}`;
      if (monthly[key] !== undefined) monthly[key] += p.amount;
    }

    return Object.entries(monthly).map(([month, revenue]) => ({ month, revenue }));
  }

  async getRevenueForecast() {
    // Simple linear regression on 12 months of data
    const now = new Date();
    const start = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    const payments = await this.prisma.payment.findMany({
      where: { paidAt: { gte: start } },
      select: { amount: true, paidAt: true },
    });

    const monthly: number[] = [];
    for (let i = 0; i < 12; i++) {
      const mStart = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const mEnd = new Date(start.getFullYear(), start.getMonth() + i + 1, 1);
      const total = payments
        .filter((p) => p.paidAt >= mStart && p.paidAt < mEnd)
        .reduce((sum, p) => sum + p.amount, 0);
      monthly.push(total);
    }

    // Linear regression
    const n = monthly.length;
    const xMean = (n - 1) / 2;
    const yMean = monthly.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (i - xMean) * (monthly[i] - yMean);
      den += (i - xMean) * (i - xMean);
    }
    const slope = den !== 0 ? num / den : 0;
    const intercept = yMean - slope * xMean;

    const historical = monthly.map((value, i) => {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      return {
        month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        actual: value,
        forecast: null as number | null,
      };
    });

    const forecast: Array<{ month: string; actual: number | null; forecast: number | null }> = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + 1 + i, 1);
      forecast.push({
        month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        actual: null as number | null,
        forecast: Math.max(0, Math.round(slope * (n + i) + intercept)),
      });
    }

    return [...historical, ...forecast];
  }

  // ─── Expenses ──────────────────────────────────────────────────

  async createExpense(dto: CreateExpenseDto, userId: string) {
    return this.prisma.expense.create({
      data: {
        categoryId: dto.categoryId,
        description: dto.description,
        amount: dto.amount,
        vendor: dto.vendor,
        reference: dto.reference,
        expenseDate: new Date(dto.expenseDate),
        notes: dto.notes,
        isRecurring: dto.isRecurring || false,
        recurrenceId: dto.recurrenceId,
        createdById: userId,
      },
      include: {
        category: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findAllExpenses(query: QueryExpenseDto) {
    const { skip, take } = paginate(query);
    const where: any = {};

    if (query.status) where.status = query.status;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.startDate || query.endDate) {
      where.expenseDate = {};
      if (query.startDate) where.expenseDate.gte = new Date(query.startDate);
      if (query.endDate) where.expenseDate.lte = new Date(query.endDate);
    }

    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        skip,
        take,
        where,
        include: {
          category: true,
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { expenseDate: 'desc' },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return { data: expenses, meta: paginationMeta(total, query) };
  }

  async updateExpense(id: string, dto: UpdateExpenseDto, userId: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');

    const data: any = { ...dto };
    if (dto.expenseDate) data.expenseDate = new Date(dto.expenseDate);
    if (dto.status === 'APPROVED' || dto.status === 'REJECTED') {
      data.approvedById = userId;
    }

    return this.prisma.expense.update({
      where: { id },
      data,
      include: {
        category: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async deleteExpense(id: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');
    return this.prisma.expense.delete({ where: { id } });
  }

  // ─── Expense Categories ────────────────────────────────────────

  async findAllExpenseCategories() {
    return this.prisma.expenseCategory.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { expenses: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createExpenseCategory(dto: CreateExpenseCategoryDto) {
    return this.prisma.expenseCategory.create({
      data: dto,
    });
  }

  // ─── Recurring Expenses ────────────────────────────────────────

  async findAllRecurringExpenses() {
    return this.prisma.recurringExpense.findMany({
      include: {
        category: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { expenses: true } },
      },
      orderBy: { nextDueDate: 'asc' },
    });
  }

  async createRecurringExpense(dto: CreateRecurringExpenseDto, userId: string) {
    return this.prisma.recurringExpense.create({
      data: {
        categoryId: dto.categoryId,
        description: dto.description,
        amount: dto.amount,
        vendor: dto.vendor,
        frequency: dto.frequency,
        dayOfMonth: dto.dayOfMonth,
        dayOfWeek: dto.dayOfWeek,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        nextDueDate: new Date(dto.startDate),
        createdById: userId,
      },
      include: {
        category: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  // ─── Reports ──────────────────────────────────────────────────

  async getProfitLossReport(query: QueryReportDto) {
    const now = new Date();
    const start = query.startDate ? new Date(query.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = query.endDate ? new Date(query.endDate) : now;

    // Revenue from paid invoices by item category
    const paidInvoiceItems = await this.prisma.invoiceItem.findMany({
      where: {
        invoice: {
          status: { in: ['PAID', 'PARTIAL'] },
          updatedAt: { gte: start, lte: end },
        },
      },
    });

    const revenueByCategory: Record<string, number> = {};
    for (const item of paidInvoiceItems) {
      revenueByCategory[item.category] = (revenueByCategory[item.category] || 0) + item.total;
    }

    // Expenses by category
    const expenses = await this.prisma.expense.findMany({
      where: {
        expenseDate: { gte: start, lte: end },
        status: { in: ['APPROVED', 'PAID'] },
      },
      include: { category: { select: { name: true } } },
    });

    const expenseByCategory: Record<string, number> = {};
    for (const e of expenses) {
      const cat = e.category.name;
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + e.amount;
    }

    const totalRevenue = Object.values(revenueByCategory).reduce((a, b) => a + b, 0);
    const totalExpenses = Object.values(expenseByCategory).reduce((a, b) => a + b, 0);
    const netIncome = totalRevenue - totalExpenses;

    return {
      period: { start: start.toISOString(), end: end.toISOString() },
      revenue: {
        items: Object.entries(revenueByCategory).map(([category, amount]) => ({ category, amount })),
        total: totalRevenue,
      },
      expenses: {
        items: Object.entries(expenseByCategory).map(([category, amount]) => ({ category, amount })),
        total: totalExpenses,
      },
      netIncome,
      profitMargin: totalRevenue > 0 ? Math.round((netIncome / totalRevenue) * 10000) / 100 : 0,
    };
  }

  async getAccountsReceivable() {
    const now = new Date();
    const unpaidInvoices = await this.prisma.invoice.findMany({
      where: { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
        payments: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    const buckets = [
      { label: 'Current (0-30)', min: 0, max: 30, total: 0, count: 0, invoices: [] as any[] },
      { label: '31-60 days', min: 31, max: 60, total: 0, count: 0, invoices: [] as any[] },
      { label: '61-90 days', min: 61, max: 90, total: 0, count: 0, invoices: [] as any[] },
      { label: '91-120 days', min: 91, max: 120, total: 0, count: 0, invoices: [] as any[] },
      { label: '120+ days', min: 121, max: Infinity, total: 0, count: 0, invoices: [] as any[] },
    ];

    for (const inv of unpaidInvoices) {
      const paidAmount = inv.payments.reduce((s, p) => s + p.amount, 0);
      const outstanding = inv.total - paidAmount;
      const daysOld = Math.floor((now.getTime() - inv.createdAt.getTime()) / (1000 * 60 * 60 * 24));

      const bucket = buckets.find((b) => daysOld >= b.min && daysOld <= b.max);
      if (bucket) {
        bucket.total += outstanding;
        bucket.count++;
        bucket.invoices.push({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          patient: inv.patient,
          total: inv.total,
          outstanding,
          daysOld,
          dueDate: inv.dueDate,
        });
      }
    }

    const totalOutstanding = buckets.reduce((s, b) => s + b.total, 0);

    return { totalOutstanding, buckets };
  }

  async getCashFlowReport(query: QueryReportDto) {
    const now = new Date();
    const start = query.startDate ? new Date(query.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = query.endDate ? new Date(query.endDate) : now;

    const [payments, expenses] = await Promise.all([
      this.prisma.payment.findMany({
        where: { paidAt: { gte: start, lte: end } },
        select: { amount: true, method: true, paidAt: true },
      }),
      this.prisma.expense.findMany({
        where: {
          expenseDate: { gte: start, lte: end },
          status: { in: ['APPROVED', 'PAID'] },
        },
        include: { category: { select: { name: true } } },
      }),
    ]);

    const cashFromPatients = payments.reduce((s, p) => s + p.amount, 0);
    const cashToSuppliers = expenses.reduce((s, e) => s + e.amount, 0);
    const netOperating = cashFromPatients - cashToSuppliers;

    return {
      period: { start: start.toISOString(), end: end.toISOString() },
      operating: {
        cashFromPatients,
        cashToSuppliers,
        net: netOperating,
      },
      closingBalance: netOperating,
    };
  }

  // ─── Write-offs ────────────────────────────────────────────────

  async createWriteOff(dto: CreateWriteOffDto, userId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
      include: { payments: true, writeOffs: true },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0);
    const totalWrittenOff = invoice.writeOffs.reduce((s, w) => s + w.amount, 0);
    const remaining = invoice.total - totalPaid - totalWrittenOff;

    if (dto.amount > remaining) {
      throw new BadRequestException(
        `Write-off amount exceeds remaining balance. Remaining: ${remaining.toFixed(2)}`,
      );
    }

    const newTotalResolved = totalPaid + totalWrittenOff + dto.amount;
    const newStatus = newTotalResolved >= invoice.total ? InvoiceStatus.PAID : invoice.status;

    return this.prisma.$transaction(async (tx) => {
      const writeOff = await tx.writeOff.create({
        data: {
          invoiceId: dto.invoiceId,
          amount: dto.amount,
          reason: dto.reason,
          description: dto.description,
          approvedById: userId,
        },
        include: {
          invoice: { select: { id: true, invoiceNumber: true, total: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      if (newStatus !== invoice.status) {
        await tx.invoice.update({
          where: { id: dto.invoiceId },
          data: { status: newStatus },
        });
      }

      return writeOff;
    });
  }

  async findAllWriteOffs(query: QueryReportDto) {
    const where: any = {};
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const writeOffs = await this.prisma.writeOff.findMany({
      where,
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            patient: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalWrittenOff = writeOffs.reduce((s, w) => s + w.amount, 0);

    return { data: writeOffs, totalWrittenOff };
  }

  // ─── Data Entry ──────────────────────────────────────────────

  async submitMonthlyData(dto: MonthlyDataEntryDto, userId: string) {
    const results = { invoices: 0, payments: 0, closings: 0, expenses: 0 };

    // Ensure a legacy patient exists for attaching invoices
    let legacyPatient = await this.prisma.patient.findFirst({
      where: { mrn: 'LEGACY-001' },
    });
    if (!legacyPatient) {
      legacyPatient = await this.prisma.patient.create({
        data: {
          mrn: 'LEGACY-001',
          firstName: 'Legacy',
          lastName: 'Walk-In',
          dob: new Date('1990-01-01'),
          gender: 'OTHER',
          status: 'ACTIVE',
          notes: 'Aggregate patient record for legacy/historical data entry',
        },
      });
    }

    // Process each day's revenue
    for (const day of dto.days) {
      if (day.revenue <= 0) continue;

      const date = new Date(dto.year, dto.month - 1, day.day);
      date.setHours(12, 0, 0, 0); // Noon to avoid timezone issues
      const dayStart = new Date(dto.year, dto.month - 1, day.day);
      dayStart.setHours(0, 0, 0, 0);

      // Check if data already exists for this day (skip if so)
      const existingClosing = await this.prisma.dailyClosing.findUnique({
        where: { date: dayStart },
      });
      if (existingClosing) continue;

      // Create invoice
      const invoiceNumber = `LEG-${dto.year}${String(dto.month).padStart(2, '0')}${String(day.day).padStart(2, '0')}`;

      const existingInvoice = await this.prisma.invoice.findUnique({
        where: { invoiceNumber },
      });
      if (existingInvoice) continue;

      await this.prisma.$transaction(async (tx) => {
        // Create invoice
        const invoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            patientId: legacyPatient.id,
            subtotal: day.revenue,
            total: day.revenue,
            status: 'PAID',
            notes: `Legacy data entry: ${day.patientsEffective || 0} patients seen, ${day.newPatients || 0} new, ${day.fullPricePatients || 0} full price`,
            createdAt: date,
            items: {
              create: [{
                description: `Daily consultations - ${day.patientsEffective || 0} patients`,
                category: 'CONSULTATION',
                quantity: day.patientsEffective || 1,
                unitPrice: day.patientsEffective ? day.revenue / day.patientsEffective : day.revenue,
                total: day.revenue,
              }],
            },
          },
        });
        results.invoices++;

        // Create payment
        await tx.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: day.revenue,
            method: 'CASH',
            receivedById: userId,
            paidAt: date,
            notes: 'Legacy data entry',
          },
        });
        results.payments++;

        // Create daily closing
        await tx.dailyClosing.create({
          data: {
            date: dayStart,
            status: 'CLOSED',
            expectedCash: day.revenue,
            actualCash: day.revenue,
            expectedCard: 0,
            actualCard: 0,
            expectedInsurance: 0,
            actualInsurance: 0,
            expectedBankTransfer: 0,
            actualBankTransfer: 0,
            varianceCash: 0,
            varianceTotal: 0,
            invoiceCount: 1,
            paymentCount: 1,
            consultationCount: day.patientsEffective || 0,
            closedById: userId,
            closedAt: date,
            notes: `Legacy: ${day.patientsEffective || 0} effective, ${day.newPatients || 0} new, ${day.totalPatients || 0} total, ${day.fullPricePatients || 0} fullPrice`,
          },
        });
        results.closings++;
      });
    }

    // Process monthly expenses
    if (dto.expenses?.length) {
      const monthStart = new Date(dto.year, dto.month - 1, 1);
      monthStart.setHours(12, 0, 0, 0);

      for (const expense of dto.expenses) {
        // Find or create category
        let category = await this.prisma.expenseCategory.findFirst({
          where: { name: expense.categoryName },
        });
        if (!category) {
          category = await this.prisma.expenseCategory.create({
            data: { name: expense.categoryName },
          });
        }

        // Check for existing expense with same category + date + description
        const existing = await this.prisma.expense.findFirst({
          where: {
            categoryId: category.id,
            expenseDate: monthStart,
            description: expense.description || expense.categoryName,
          },
        });

        if (existing) {
          // Update if amount changed
          if (existing.amount !== expense.amount) {
            await this.prisma.expense.update({
              where: { id: existing.id },
              data: { amount: expense.amount },
            });
            results.expenses++;
          }
          continue;
        }

        await this.prisma.expense.create({
          data: {
            categoryId: category.id,
            description: expense.description || expense.categoryName,
            amount: expense.amount,
            expenseDate: monthStart,
            status: 'PAID',
            createdById: userId,
            notes: 'Data entry',
          },
        });
        results.expenses++;
      }
    }

    return results;
  }

  async getMonthlyData(year: number, month: number) {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    // Get daily closings for this month
    const closings = await this.prisma.dailyClosing.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
      orderBy: { date: 'asc' },
    });

    // Get payments for this month (for revenue data)
    const payments = await this.prisma.payment.findMany({
      where: { paidAt: { gte: monthStart, lte: monthEnd } },
      include: {
        invoice: { select: { invoiceNumber: true, notes: true } },
      },
      orderBy: { paidAt: 'asc' },
    });

    // Get expenses for this month
    const expenses = await this.prisma.expense.findMany({
      where: { expenseDate: { gte: monthStart, lte: monthEnd } },
      include: { category: true },
      orderBy: { expenseDate: 'asc' },
    });

    // Build days array from closings
    const days = closings.map((c) => {
      const dayPayments = payments.filter((p) => {
        const pDay = p.paidAt.getDate();
        const cDay = c.date.getDate();
        return pDay === cDay;
      });
      const revenue = dayPayments.reduce((sum, p) => sum + p.amount, 0);

      // Parse patient counts from notes
      const notesMatch = c.notes?.match(/(\d+) effective, (\d+) new, (\d+) total, (\d+) fullPrice/);
      const legacyMatch = !notesMatch ? c.notes?.match(/(\d+) effective, (\d+) new, (\d+) total/) : null;

      return {
        day: c.date.getDate(),
        revenue: revenue || (c.expectedCash + c.expectedCard + c.expectedInsurance + c.expectedBankTransfer),
        patientsEffective: notesMatch ? parseInt(notesMatch[1]) : legacyMatch ? parseInt(legacyMatch[1]) : c.consultationCount,
        newPatients: notesMatch ? parseInt(notesMatch[2]) : legacyMatch ? parseInt(legacyMatch[2]) : 0,
        totalPatients: notesMatch ? parseInt(notesMatch[3]) : legacyMatch ? parseInt(legacyMatch[3]) : 0,
        fullPricePatients: notesMatch ? parseInt(notesMatch[4]) : 0,
        status: c.status,
      };
    });

    return {
      year,
      month,
      days,
      expenses: expenses.map((e) => ({
        categoryName: e.category.name,
        amount: e.amount,
        description: e.description,
      })),
    };
  }
}
