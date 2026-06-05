import { SetMetadata } from '@nestjs/common';

export const SCOPES_KEY = 'scopes';

/**
 * Decorator used by future forums controllers to require M2M scopes.
 *
 * @param scopes Scope strings expected in the authenticated token.
 * @returns Nest metadata decorator consumed by `TokenRolesGuard`.
 * @throws Does not throw; invalid scope values are handled during guard checks.
 */
export const Scopes = (...scopes: string[]) => SetMetadata(SCOPES_KEY, scopes);
