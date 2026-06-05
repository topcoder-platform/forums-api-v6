import { Request } from 'express';
import { JwtUser } from '../jwt.service';

/**
 * Express request shape used after optional token validation.
 *
 * Future forums controllers and policies can read `user` when a bearer token
 * has been successfully validated by `TokenValidatorMiddleware`.
 */
export interface AuthenticatedRequest extends Request {
  user?: JwtUser;
  idTokenVerified?: boolean;
}
