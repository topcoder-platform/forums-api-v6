import { createHmac } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from './jwt.service';

const secret = 'test-only-secret-with-at-least-32-bytes-long';
/** Signs isolated test claims for the shared verifier; returns a compact JWT without any network I/O. */
function token(claims: Record<string, unknown> = {}): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ iss: 'https://issuer.test/', sub: '42', userId: '42', exp: Math.floor(Date.now() / 1000) + 300, ...claims })).toString('base64url');
    return `${header}.${body}.${createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')}`;
}

describe('shared Forums JWT identity', () => {
  it('does not elevate a human with scopes or read arbitrary role namespaces', async () => {
    const service = new JwtService(new ConfigService({ auth: { authSecret: secret, validIssuers: '["https://issuer.test/"]' } }));
    service.onModuleInit();
    const user = await service.validateToken(token({ scope: 'all:forums', 'https://untrusted.test/roles': ['administrator'] }));
    expect(user.isMachine).toBe(false);
    expect(user.roles).toEqual([]);
    expect(user.userId).toBe('42');
  });
});
