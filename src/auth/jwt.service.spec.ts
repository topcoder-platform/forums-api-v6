import { createHmac } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from './jwt.service';

const secret = 'test-only-secret-with-at-least-32-bytes-long';
/** Signs isolated test claims for the shared verifier; returns a compact JWT without any network I/O. */
function token(claims: Record<string, unknown> = {}): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      emailVerified: true,
      iss: 'https://issuer.test/',
      sub: '42',
      userId: '42',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300,
      ...claims,
    }),
  ).toString('base64url');
  return `${header}.${body}.${createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')}`;
}

describe('shared Forums JWT identity', () => {
  const originalPolicy = process.env.JWT_ISSUER_POLICIES;
  beforeEach(() => {
    process.env.JWT_ISSUER_POLICIES = JSON.stringify([
      {
        issuer: 'https://issuer.test/',
        algorithm: 'HS256',
        allowMissingAudience: true,
        legacyHs256Until: new Date(Date.now() + 3_600_000).toISOString(),
      },
    ]);
  });
  afterEach(() => {
    if (originalPolicy === undefined) delete process.env.JWT_ISSUER_POLICIES;
    else process.env.JWT_ISSUER_POLICIES = originalPolicy;
  });
  it('does not elevate a human with scopes or read arbitrary role namespaces', async () => {
    const service = new JwtService(
      new ConfigService({
        auth: { authSecret: secret, validIssuers: '["https://issuer.test/"]' },
      }),
    );
    service.onModuleInit();
    const user = await service.validateToken(
      token({
        scope: 'all:forums',
        'https://untrusted.test/roles': ['administrator'],
      }),
    );
    expect(user.isMachine).toBe(false);
    expect(user.roles).toEqual([]);
    expect(user.userId).toBe('42');
    for (const emailVerified of [undefined, false, 'true']) {
      await expect(
        service.validateToken(token({ emailVerified })),
      ).rejects.toThrow('Invalid or expired access token');
    }
  });
});
