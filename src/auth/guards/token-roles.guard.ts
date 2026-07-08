import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AUTHENTICATED_USER_ROLE,
  ROLES_KEY,
} from '../decorators/roles.decorator';
import { SCOPES_KEY } from '../decorators/scopes.decorator';
import { AuthenticatedRequest } from '../request/authenticated-request.interface';

/**
 * Global role and scope guard for authenticated forums routes.
 *
 * The guard follows the v6 role/scope split: routes without metadata are
 * public, human tokens satisfy `@Roles(...)`, and M2M tokens satisfy
 * `@Scopes(...)`. Human callers do not gain route access from scopes alone,
 * and machine callers do not gain route access from roles alone. The
 * authenticated-user role marker allows controllers to express user-only
 * routes without deferring that decision to service-layer failures.
 */
@Injectable()
export class TokenRolesGuard implements CanActivate {
  /**
   * Creates a token role guard instance.
   *
   * @param reflector Nest reflector used to read route/class metadata.
   * @throws Does not throw directly; dependencies are resolved by Nest.
   */
  constructor(private readonly reflector: Reflector) {}

  /**
   * Determines whether the current request can access the route.
   *
   * @param context Nest execution context for the active request.
   * @returns `true` when no roles/scopes are required, a human token satisfies roles, or an M2M token satisfies scopes.
   * @throws UnauthorizedException when a protected route has no validated user.
   * @throws ForbiddenException when the token type cannot satisfy the required route metadata.
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    const requiredScopes =
      this.reflector.getAllAndOverride<string[]>(SCOPES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredRoles.length === 0 && requiredScopes.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Missing or invalid token.');
    }

    if (user.isMachine) {
      if (this.hasRequiredScope(user.scopes, requiredScopes)) {
        return true;
      }

      if (requiredRoles.length > 0 && requiredScopes.length === 0) {
        throw new ForbiddenException(
          'M2M token not allowed for this endpoint.',
        );
      }

      throw new ForbiddenException('Insufficient permissions.');
    }

    if (this.hasRequiredRole(user, requiredRoles)) {
      return true;
    }

    throw new ForbiddenException('Insufficient permissions.');
  }

  /**
   * Checks whether a token contains at least one required scope.
   *
   * @param tokenScopes Scopes present in the authenticated token.
   * @param requiredScopes Scopes required by route metadata.
   * @returns `true` when at least one required scope is present.
   * @throws Does not throw.
   */
  private hasRequiredScope(
    tokenScopes: string[] | undefined,
    requiredScopes: string[],
  ): boolean {
    if (requiredScopes.length === 0) {
      return false;
    }

    if (!Array.isArray(tokenScopes)) {
      return false;
    }

    return requiredScopes.some((scope) => tokenScopes.includes(scope));
  }

  /**
   * Checks whether a token contains at least one required role.
   *
   * @param user Normalized authenticated token payload.
   * @param requiredRoles Roles required by route metadata.
   * @returns `true` when the user marker is satisfied or one required role matches.
   * @throws Does not throw.
   */
  private hasRequiredRole(
    user: AuthenticatedRequest['user'],
    requiredRoles: string[],
  ): boolean {
    if (requiredRoles.length === 0 || !user) {
      return false;
    }

    const normalizedRequiredRoles = requiredRoles.map((role) =>
      this.normalizeRole(role),
    );

    if (
      normalizedRequiredRoles.includes(AUTHENTICATED_USER_ROLE) &&
      !user.isMachine
    ) {
      return true;
    }

    const claimRoles = normalizedRequiredRoles.filter(
      (role) => role !== AUTHENTICATED_USER_ROLE,
    );

    if (claimRoles.length === 0 || !Array.isArray(user.roles)) {
      return false;
    }

    const normalizedTokenRoles = user.roles.map((role) =>
      this.normalizeRole(role),
    );

    return claimRoles.some((role) => normalizedTokenRoles.includes(role));
  }

  /**
   * Normalizes role strings for case-insensitive matching.
   *
   * @param role Role value from metadata or token claims.
   * @returns Trimmed lowercase role string.
   * @throws Does not throw.
   */
  private normalizeRole(role: string): string {
    return String(role ?? '')
      .trim()
      .toLowerCase();
  }
}
