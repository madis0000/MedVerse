import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    if (['GET', 'OPTIONS', 'HEAD'].includes(method)) {
      return next.handle();
    }

    const userId = request.user?.id;
    const action = `${method} ${request.route?.path || request.url}`;
    const ipAddress = request.ip || request.connection?.remoteAddress;

    return next.handle().pipe(
      tap(async (responseData) => {
        try {
          const entity = context.getClass().name.replace('Controller', '');
          const entityId = request.params?.id || responseData?.data?.id;

          await this.prisma.auditLog.create({
            data: {
              userId,
              action,
              entity,
              entityId: entityId?.toString(),
              newValues: request.body ? JSON.parse(JSON.stringify(request.body)) : undefined,
              ipAddress,
            },
          });
        } catch {
          // Silently fail audit logging
        }
      }),
    );
  }
}
