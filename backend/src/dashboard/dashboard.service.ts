import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getAdminStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    const [
      totalPatients,
      newPatientsThisMonth,
      todayAppointments,
      totalAppointments,
      monthlyRevenue,
      lastMonthRevenue,
      pendingLabs,
      recentPatients,
      appointmentsByStatus,
    ] = await Promise.all([
      this.prisma.patient.count(),
      this.prisma.patient.count({
        where: { createdAt: { gte: thisMonthStart } },
      }),
      this.prisma.appointment.count({
        where: { dateTime: { gte: today, lt: tomorrow } },
      }),
      this.prisma.appointment.count({
        where: { dateTime: { gte: thisMonthStart } },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { paidAt: { gte: thisMonthStart } },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { paidAt: { gte: lastMonthStart, lte: lastMonthEnd } },
      }),
      this.prisma.labOrder.count({ where: { status: 'PENDING' } }),
      this.prisma.patient.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, firstName: true, lastName: true, mrn: true, createdAt: true },
      }),
      this.prisma.appointment.groupBy({
        by: ['status'],
        _count: { id: true },
        where: { dateTime: { gte: thisMonthStart } },
      }),
    ]);

    return {
      totalPatients,
      newPatientsThisMonth,
      todayAppointments,
      totalAppointmentsThisMonth: totalAppointments,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      lastMonthRevenue: lastMonthRevenue._sum.amount || 0,
      pendingLabs,
      recentPatients,
      appointmentsByStatus,
    };
  }

  async getDoctorStats(doctorId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todaySchedule, pendingLabs, recentConsultations, totalPatientsToday] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          doctorId,
          dateTime: { gte: today, lt: tomorrow },
        },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
          specialty: { select: { name: true } },
        },
        orderBy: { dateTime: 'asc' },
      }),
      this.prisma.labOrder.count({
        where: {
          orderedById: doctorId,
          status: { in: ['PENDING', 'PROCESSING'] },
        },
      }),
      this.prisma.consultation.findMany({
        where: { doctorId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.appointment.count({
        where: {
          doctorId,
          dateTime: { gte: today, lt: tomorrow },
        },
      }),
    ]);

    return {
      todaySchedule,
      pendingLabs,
      recentConsultations,
      totalPatientsToday,
    };
  }

  async getRevenueBreakdown(period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
    const now = new Date();
    let startDate: Date;

    if (period === 'daily') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === 'weekly') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 84);
    } else {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 12);
    }

    const payments = await this.prisma.payment.findMany({
      where: { paidAt: { gte: startDate } },
      select: { amount: true, paidAt: true, method: true },
      orderBy: { paidAt: 'asc' },
    });

    return payments;
  }

  async exportData() {
    const [patients, invoices, appointments] = await Promise.all([
      this.prisma.patient.findMany({
        select: {
          mrn: true, firstName: true, lastName: true, phone: true, email: true,
          gender: true, dob: true, status: true, createdAt: true,
        },
      }),
      this.prisma.invoice.findMany({
        select: {
          invoiceNumber: true, total: true, status: true, createdAt: true,
          patient: { select: { firstName: true, lastName: true, mrn: true } },
        },
      }),
      this.prisma.appointment.findMany({
        select: {
          dateTime: true, visitType: true, status: true,
          patient: { select: { firstName: true, lastName: true } },
          doctor: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    return { patients, invoices, appointments };
  }
}
