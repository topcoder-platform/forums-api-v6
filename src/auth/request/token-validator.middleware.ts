import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { NextFunction, Response } from 'express';
import { JwtService } from '../jwt.service';
import { AuthenticatedRequest } from './authenticated-request.interface';

/**
 * Optional bearer-token validation middleware.
 *
 * The middleware follows the review API pattern: missing tokens are allowed so
 * public endpoints can exist, while malformed or invalid bearer tokens fail
 * early and valid tokens are attached to the request.
 */
@Injectable()
export class TokenValidatorMiddleware implements NestMiddleware {
  /**
   * Creates the token validator middleware.
   *
   * @param jwtService Service that validates JWT and M2M bearer tokens.
   * @throws Does not throw directly; dependencies are resolved by Nest.
   */
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Validates an optional bearer token and attaches the normalized user payload.
   *
   * @param request Express request that may contain an authorization header.
   * @param _response Express response, unused by this middleware.
   * @param next Callback used to continue the middleware chain.
   * @returns A promise that resolves after validation or request continuation.
   * @throws UnauthorizedException when a bearer token is malformed or invalid.
   */
  async use(
    request: AuthenticatedRequest,
    _response: Response,
    next: NextFunction,
  ): Promise<void> {
    const authHeader = this.resolveAuthorizationHeader(request);

    if (!authHeader) {
      next();
      return;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer') {
      next();
      return;
    }

    if (!token) {
      throw new UnauthorizedException('Invalid or missing JWT.');
    }

    try {
      request.user = await this.jwtService.validateToken(token);
      request.idTokenVerified = true;
      next();
    } catch (error) {
      const tokenHash = this.anonymizeToken(token);
      const message =
        error instanceof Error
          ? `${error.message} tokenHash=${tokenHash}`
          : `Invalid or expired JWT. tokenHash=${tokenHash}`;
      throw new UnauthorizedException(message);
    }
  }

  /**
   * Reads the first usable authorization header from the request.
   *
   * @param request Express request containing incoming headers.
   * @returns A bearer header string when present.
   * @throws Does not throw.
   */
  private resolveAuthorizationHeader(
    request: AuthenticatedRequest,
  ): string | undefined {
    const header = request.headers.authorization;

    if (Array.isArray(header)) {
      return header[0];
    }

    return header;
  }

  /**
   * Builds a short non-reversible hash for token-related diagnostics.
   *
   * @param token Raw bearer token value.
   * @returns A short SHA-256 hash prefix.
   * @throws Does not throw.
   */
  private anonymizeToken(token: string): string {
    return createHash('sha256').update(token).digest('hex').slice(0, 16);
  }
}
