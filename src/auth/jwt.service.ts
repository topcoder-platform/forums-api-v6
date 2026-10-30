import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createJwtVerifier, type JwtVerifier } from 'tc-core-library-js';
import { ALL_SCOPE_MAPPINGS } from './scope-mappings';

export interface JwtUser {
  userId?: string;
  handle?: string;
  roles?: string[];
  scopes?: string[];
  isMachine: boolean;
}

/** Uses the shared JWT verifier and adds Forums-specific scope expansion for its guards. */
@Injectable()
export class JwtService implements OnModuleInit {
  private verifier: JwtVerifier;

  /** Stores runtime configuration; initialization validates it in onModuleInit. No I/O occurs. */
  constructor(private readonly configService: ConfigService) {}

  /** Creates the shared verifier from configured issuers, audiences and secret; throws for invalid settings. */
  onModuleInit(): void {
    this.verifier = createJwtVerifier({
      AUTH_SECRET: this.configService.get<string>('auth.authSecret'),
      VALID_ISSUERS: this.configService.get<string>('auth.validIssuers'),
      AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
      JWT_AUDIENCE: process.env.JWT_AUDIENCE,
    });
  }

  /** Verifies a compact token (optionally prefixed with Bearer) and returns the Forums identity.
   * @param token Caller token. @returns Verified identity with expanded service scopes.
   * @throws UnauthorizedException for invalid or expired tokens.
   */
  async validateToken(token: string): Promise<JwtUser> {
    try {
      const user = await this.verifier.verify(token.replace(/^Bearer /i, ''));
      return {
        userId: user.userId === undefined ? undefined : String(user.userId),
        handle: user.handle,
        roles: user.roles,
        scopes: this.expandScopes(user.scopes),
        isMachine: user.isMachine,
      };
    } catch { throw new UnauthorizedException('Invalid or expired access token'); }
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

}
