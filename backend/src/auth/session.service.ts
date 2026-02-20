import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SessionInfo {
  id: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  lastActiveAt: Date;
  createdAt: Date;
  isActive: boolean;
}

@Injectable()
export class SessionService {
  private readonly MAX_CONCURRENT_SESSIONS = 2;

  constructor(private prisma: PrismaService) {}

  async createSession(
    userId: string,
    tokenHash: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    // Count active sessions
    const activeSessions = await this.prisma.auditLog.findMany({
      where: {
        userId,
        action: 'SESSION_ACTIVE',
        createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'asc' },
    });

    // If at limit, invalidate oldest session
    if (activeSessions.length >= this.MAX_CONCURRENT_SESSIONS) {
      const oldest = activeSessions[0];
      if (oldest) {
        await this.prisma.auditLog.update({
          where: { id: oldest.id },
          data: { action: 'SESSION_TERMINATED' },
        });
      }
    }

    // Log new session
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'SESSION_ACTIVE',
        entity: 'Session',
        entityId: tokenHash.substring(0, 16),
        newValues: {
          ipAddress,
          userAgent: userAgent?.substring(0, 200),
        },
      },
    });
  }

  async getActiveSessions(userId: string): Promise<any[]> {
    const sessions = await this.prisma.auditLog.findMany({
      where: {
        userId,
        action: 'SESSION_ACTIVE',
        createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        entityId: true,
        newValues: true,
        createdAt: true,
      },
    });

    return sessions.map((s) => ({
      id: s.id,
      sessionId: s.entityId,
      ...(typeof s.newValues === 'object' ? s.newValues as Record<string, unknown> : {}),
      createdAt: s.createdAt,
    }));
  }

  async terminateSession(sessionId: string, userId: string): Promise<void> {
    await this.prisma.auditLog.updateMany({
      where: {
        id: sessionId,
        userId,
        action: 'SESSION_ACTIVE',
      },
      data: { action: 'SESSION_TERMINATED' },
    });
  }

  async terminateAllSessions(userId: string): Promise<void> {
    await this.prisma.auditLog.updateMany({
      where: {
        userId,
        action: 'SESSION_ACTIVE',
      },
      data: { action: 'SESSION_TERMINATED' },
    });
  }

  async recordActivity(userId: string): Promise<void> {
    // Update the most recent active session's timestamp
    const session = await this.prisma.auditLog.findFirst({
      where: {
        userId,
        action: 'SESSION_ACTIVE',
        createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (session) {
      // Update via creating a new entry (audit logs are append-only)
      await this.prisma.auditLog.update({
        where: { id: session.id },
        data: {
          newValues: {
            ...(typeof session.newValues === 'object' ? session.newValues as Record<string, unknown> : {}),
            lastActiveAt: new Date().toISOString(),
          },
        },
      });
    }
  }
}
