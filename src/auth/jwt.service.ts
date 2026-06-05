import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { middleware } from 'tc-core-library-js';
import { ALL_SCOPE_MAPPINGS } from './scope-mappings';

export interface JwtUser {
  userId?: string;
  handle?: string;
  roles?: string[];
  scopes?: string[];
  isMachine: boolean;
}

interface TokenRequest {
  headers: {
    authorization: string;
  };
  authUser?: Record<string, unknown>;
}

/**
 * JWT validation service backed by `tc-core-library-js`.
 *
 * The service mirrors the authentication path used by existing v6 APIs while
 * returning a normalized payload shape that future forums policies can consume.
 */
@Injectable()
export class JwtService implements OnModuleInit {
  private jwtAuthenticator: (
    req: TokenRequest,
    res: Record<string, unknown>,
    next: (error?: Error) => void,
  ) => void;

  /**
   * Creates a JWT service instance.
   *
   * @param configService Nest configuration service that provides auth settings.
   * @throws Does not throw directly; authenticator setup happens in `onModuleInit`.
   */
  constructor(private readonly configService: ConfigService) {}

  /**
   * Initializes the tc-core JWT authenticator.
   *
   * @returns Nothing. The authenticator function is cached on the service.
   * @throws Error when the required `AUTH_SECRET` configuration is missing.
   */
  onModuleInit(): void {
    const authSecret = this.configService.get<string>('auth.authSecret');

    if (!authSecret || authSecret.trim().length === 0) {
      throw new Error('AUTH_SECRET is required for JWT authentication.');
    }

    this.jwtAuthenticator = middleware.jwtAuthenticator({
      AUTH_SECRET: authSecret,
      VALID_ISSUERS: this.normalizeValidIssuers(
        this.configService.get<string>('auth.validIssuers'),
      ),
    });
  }

  /**
   * Validates a bearer token and returns normalized user information.
   *
   * @param token Raw JWT string, with or without a `Bearer ` prefix.
   * @returns Normalized user and machine-token claims from the validated token.
   * @throws UnauthorizedException when the token cannot be validated.
   */
  async validateToken(token: string): Promise<JwtUser> {
    const bearerToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    const request: TokenRequest = {
      headers: {
        authorization: bearerToken,
      },
    };

    const authUser = await new Promise<Record<string, unknown>>(
      (resolve, reject) => {
        const rejectUnauthorized = (detail?: unknown) => {
          reject(
            new UnauthorizedException(
              this.extractErrorMessage(detail) ?? 'Invalid token.',
            ),
          );
        };

        const response = {
          status: () => ({
            json: (body?: unknown) => rejectUnauthorized(body),
          }),
          json: (body?: unknown) => rejectUnauthorized(body),
          send: (body?: unknown) => rejectUnauthorized(body),
        };

        try {
          this.jwtAuthenticator(request, response, (error?: Error) => {
            if (error) {
              reject(new UnauthorizedException(error.message));
              return;
            }

            if (!request.authUser) {
              reject(new UnauthorizedException('Invalid token.'));
              return;
            }

            resolve(request.authUser);
          });
        } catch (error) {
          reject(
            new UnauthorizedException(
              error instanceof Error ? error.message : 'Invalid token.',
            ),
          );
        }
      },
    );

    return this.normalizeUser(authUser);
  }

  /**
   * Normalizes valid issuer configuration for tc-core-library-js.
   *
   * @param validIssuers Configured issuer JSON array or comma-separated list.
   * @returns A JSON array string accepted by the tc-core authenticator.
   * @throws Does not throw; malformed values are passed through for authenticator handling.
   */
  private normalizeValidIssuers(validIssuers?: string): string {
    if (!validIssuers) {
      return '[]';
    }

    if (validIssuers.trim().startsWith('[')) {
      return validIssuers;
    }

    return JSON.stringify(
      validIssuers
        .split(',')
        .map((issuer) => issuer.trim())
        .filter((issuer) => issuer.length > 0),
    );
  }

  /**
   * Converts tc-core auth payloads into the forums auth payload shape.
   *
   * Roles are read from `roles`, `role`, and supported namespaced fallback
   * claims ending in `roles` or `role`. Role claim values may be arrays, JSON
   * array strings, single strings, or comma-delimited strings.
   *
   * @param authUser Raw auth payload attached by tc-core-library-js.
   * @returns Normalized JWT user payload for request and guard usage.
   * @throws Does not throw.
   */
  private normalizeUser(authUser: Record<string, unknown>): JwtUser {
    const scopes = this.expandScopes(
      this.normalizeScopesClaim(authUser.scopes ?? authUser.scope),
    );
    let roles = Array.from(
      new Set([
        ...this.normalizeRolesClaim(authUser.roles),
        ...this.normalizeRolesClaim(authUser.role),
      ]),
    );
    let userId = this.normalizeScalarClaim(authUser.userId);
    let handle = this.normalizeScalarClaim(authUser.handle);

    for (const [key, value] of Object.entries(authUser)) {
      if (!handle && key.endsWith('handle')) {
        handle = this.normalizeScalarClaim(value);
      }

      if (!userId && key.endsWith('userId')) {
        userId = this.normalizeScalarClaim(value);
      }

      if (roles.length === 0 && this.isRoleClaimKey(key)) {
        roles = this.normalizeRolesClaim(value);
      }
    }

    userId =
      userId ??
      this.normalizeScalarClaim(
        authUser.sub ?? authUser.id ?? authUser.user_id,
      );

    return {
      userId,
      handle,
      roles,
      scopes,
      isMachine:
        Boolean(authUser.isMachine) ||
        (scopes.length > 0 && roles.length === 0),
    };
  }

  /**
   * Converts primitive token claims into string values.
   *
   * @param value Claim value from the authenticated token payload.
   * @returns String value for primitive claims, otherwise `undefined`.
   * @throws Does not throw.
   */
  private normalizeScalarClaim(value: unknown): string | undefined {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'bigint' ||
      typeof value === 'boolean'
    ) {
      return String(value);
    }

    return undefined;
  }

  /**
   * Normalizes scope claims into individual scope strings.
   *
   * @param value Scope claim that may be an array or whitespace-delimited string.
   * @returns Clean scope array with empty values removed.
   * @throws Does not throw.
   */
  private normalizeScopesClaim(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value
        .flatMap((entry) => String(entry ?? '').split(/\s+/))
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    }

    if (typeof value === 'string') {
      return value
        .split(/\s+/)
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    }

    return [];
  }

  /**
   * Normalizes role claims without splitting multi-word role names.
   *
   * @param value Role claim that may be an array, JSON-array string, single string, or comma-delimited string.
   * @returns Clean role array with whole role names preserved.
   * @throws Does not throw.
   */
  private normalizeRolesClaim(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value
        .flatMap((entry) => String(entry ?? '').split(','))
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    }

    if (typeof value === 'string') {
      const trimmedValue = value.trim();

      if (trimmedValue.length === 0) {
        return [];
      }

      if (trimmedValue.startsWith('[')) {
        try {
          const parsedValue: unknown = JSON.parse(trimmedValue);

          if (Array.isArray(parsedValue)) {
            return this.normalizeRolesClaim(parsedValue);
          }
        } catch {
          // Fall through to handle the value as a literal role string.
        }
      }

      return value
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    }

    return [];
  }

  /**
   * Identifies supported direct and namespaced role claim keys.
   *
   * @param key Raw claim key from the authenticated token payload.
   * @returns `true` when the claim key represents a plural or singular role claim.
   * @throws Does not throw.
   */
  private isRoleClaimKey(key: string): boolean {
    const normalizedKey = key.toLowerCase();

    return normalizedKey.endsWith('roles') || normalizedKey.endsWith('role');
  }

  /**
   * Expands configured scope aliases into approved granular forums scopes before
   * guard checks. Mark-read authorization is covered by `update:forums-topics`;
   * there is no dedicated mark-read scope.
   *
   * @param scopes Normalized token scopes.
   * @returns Scope list containing original scopes plus mapped plural granular scopes.
   * @throws Does not throw.
   */
  private expandScopes(scopes: string[]): string[] {
    const expandedScopes = new Set<string>();

    const addScope = (scope: string) => {
      if (expandedScopes.has(scope)) {
        return;
      }

      expandedScopes.add(scope);
      ALL_SCOPE_MAPPINGS[scope]?.forEach((mappedScope) =>
        addScope(mappedScope),
      );
    };

    scopes.forEach((scope) => addScope(scope));

    return Array.from(expandedScopes);
  }

  /**
   * Extracts a readable error message from authenticator error payloads.
   *
   * @param detail Raw response body or error object from the authenticator.
   * @returns A message string when one is available.
   * @throws Does not throw.
   */
  private extractErrorMessage(detail: unknown): string | undefined {
    if (!detail) {
      return undefined;
    }

    if (typeof detail === 'string') {
      return detail;
    }

    if (detail instanceof Error) {
      return detail.message;
    }

    if (typeof detail === 'object' && 'message' in detail) {
      const message = (detail as { message?: unknown }).message;
      return typeof message === 'string' ? message : undefined;
    }

    return undefined;
  }
}
