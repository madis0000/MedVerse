import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PhiAccessInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const patientId = request.params?.id || request.params?.patientId;
    const method = request.method;
    const path = request.path;

    return next.handle().pipe(
      tap(async () => {
        if (user && patientId && method === 'GET') {
          try {
            await this.prisma.auditLog.create({
              data: {
                userId: user.id || user.sub,
                action: 'PHI_ACCESS',
                entity: 'Patient',
                entityId: patientId,
                newValues: {
                  accessType: 'VIEW',
                  endpoint: path,
                  ipAddress: request.ip || request.connection?.remoteAddress,
                  userAgent: request.headers?.['user-agent']?.substring(0, 200),
                },
              },
            });
          } catch {
            // Don't fail the request if audit logging fails
          }
        }
      }),
    );
  }
}
