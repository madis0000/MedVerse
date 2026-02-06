import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginate, paginationMeta } from '../common/dto/pagination.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    const settings = await this.prisma.clinicSetting.findMany({
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });

    const grouped: Record<string, Record<string, string>> = {};
    settings.forEach((s) => {
      if (!grouped[s.group]) grouped[s.group] = {};
      grouped[s.group][s.key] = s.value;
    });

    return grouped;
  }

  async update(settings: Record<string, string>) {
    const updates = Object.entries(settings).map(([key, value]) =>
      this.prisma.clinicSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value, group: 'general' },
      }),
    );

    await Promise.all(updates);
    return this.getAll();
  }

  async getAuditLogs(query: PaginationDto & { entity?: string; userId?: string }) {
    const { skip, take } = paginate(query);
    const where: any = {};
    if (query.entity) where.entity = query.entity;
    if (query.userId) where.userId = query.userId;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data: logs, meta: paginationMeta(total, query) };
  }
}
