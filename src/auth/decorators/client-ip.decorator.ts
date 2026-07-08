import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../request/authenticated-request.interface';

/**
 * Parameter decorator for reading the trusted resolved client IP.
 *
 * @param _data Unused decorator data.
 * @param context Nest execution context for the active HTTP request.
 * @returns Bare trusted IPv4/IPv6 host value, or `undefined` when unavailable.
 * @throws Does not throw.
 */
export const ClientIp = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | undefined => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    return request.resolvedClientIp;
  },
);
