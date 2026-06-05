import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../request/authenticated-request.interface';
import { JwtUser } from '../jwt.service';

/**
 * Parameter decorator for reading the validated token payload.
 *
 * @param data Optional key from the user payload to return.
 * @param context Nest execution context for the active HTTP request.
 * @returns The full authenticated user payload or one selected property.
 * @throws Does not throw; missing users or properties return `undefined`.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtUser | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!data) {
      return request.user;
    }

    return request.user?.[data];
  },
);
