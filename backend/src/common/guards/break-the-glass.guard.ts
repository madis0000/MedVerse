import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class BreakTheGlassGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const patientId = request.params?.id || request.params?.patientId;
    const justification = request.headers?.['x-access-justification'];

    // If no patient ID, let through (not a patient-specific request)
    if (!patientId) return true;

    // Admins always have access
    if (user?.role === 'SUPER_ADMIN') return true;

    // If a justification header is provided, log it and allow
    if (justification) {
      // Justification will be logged by the PHI interceptor
      request.accessJustification = justification;
      return true;
    }

    // Default: allow access (the interceptor logs it regardless)
    // In production, you'd check if the patient is in the doctor's care
    return true;
  }
}
