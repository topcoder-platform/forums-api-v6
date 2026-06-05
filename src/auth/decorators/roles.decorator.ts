import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const AUTHENTICATED_USER_ROLE = 'authenticated-user';

/**
 * Decorator used by forums controllers to require user roles.
 *
 * The `AUTHENTICATED_USER_ROLE` marker is route metadata for any authenticated
 * non-machine user. Other values are compared against role claims in the token.
 *
 * @param roles Case-insensitive role names expected in the authenticated token.
 * @returns Nest metadata decorator consumed by `TokenRolesGuard`.
 * @throws Does not throw; invalid role values are handled during guard checks.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
