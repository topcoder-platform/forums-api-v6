import { Request } from 'express';
import { JwtUser } from '../jwt.service';

/**
 * Express request shape used after optional token validation.
 *
 * Forums controllers can read `user` after bearer-token validation and
 * `resolvedClientIp` after trusted forwarded-header normalization. The resolved
 * client IP is intentionally optional because forwarding headers are ignored
 * unless explicitly trusted for the runtime environment.
 */
export interface AuthenticatedRequest extends Request {
  user?: JwtUser;
  idTokenVerified?: boolean;
  resolvedClientIp?: string;
}
