import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { auth } from 'tc-core-library-js';

/** Domain adapter for the shared principal; member IDs remain strings and tokenPayload contains only normalized claims. */
export interface JwtUser {
  kind?: 'user' | 'service';
  clientId?: string;
  userId?: string;
  email?: string;
  handle?: string;
  roles?: string[];
  scopes?: string[];
  isMachine: boolean;
  tokenPayload?: Record<string, unknown>;
}

/** Validates every token through the shared core, with no decode-only or issuer fallback path. */
@Injectable()
export class JwtService implements OnModuleInit {
  /** Receives member trust settings; initialization validates all configured providers. */
  constructor(private readonly configService: ConfigService) {}

  private validator?: ReturnType<typeof auth.createValidator>;

  /**
   * Initializes machine trust (Keycloak and/or Auth0, as `USE_KEYCLOAK` and the core's
   * `KEYCLOAK_*`/`LEGACY_M2M_*` settings define) and member trust configuration.
   * Takes no arguments; throws on invalid settings, including an invalid `USE_KEYCLOAK`.
   */
  onModuleInit(): void {
    this.validator = auth.createValidator({
      AUTH_SECRET: this.configService.get<string>('auth.authSecret'),
      VALID_ISSUERS: this.configService.get<string>('auth.validIssuers'),
    });
  }

  /**
   * Verifies rawToken and adapts its member ID for domain code; used by the global guard.
   * @param rawToken Compact JWT or Bearer-prefixed header.
   * @returns Verified principal with authoritative kind/scopes and a string member ID.
   * @throws UnauthorizedException for invalid tokens or an unavailable validator.
   */
  async validateToken(rawToken: string): Promise<JwtUser> {
    try {
      if (!this.validator) throw new Error('Validator unavailable');
      const principal = await this.validator.verify(
        rawToken.replace(/^Bearer /, '').trim(),
      );
      return {
        ...principal,
        userId:
          principal.userId === undefined ? undefined : String(principal.userId),
        email: principal.email?.trim().toLowerCase(),
        tokenPayload: principal,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
