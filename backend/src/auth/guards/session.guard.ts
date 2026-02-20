import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user, let the JWT guard handle it
    if (!user) return true;

    // Session validation is handled at login time via SessionService
    // This guard can be extended to check active session status
    return true;
  }
}
