/* Synthetic local authentication boundary checks; no real secrets or network calls. */
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const { test } = require('node:test');
const { JwtService } = require('../dist/auth/jwt.service');

Object.assign(process.env, {
  M2M_PROVIDER: 'keycloak',
  KEYCLOAK_ISSUER: 'https://keycloak.example.test/realms/test',
  KEYCLOAK_AUDIENCE: 'https://api.example.test',
  KEYCLOAK_TOKEN_URL: 'https://keycloak.example.test/m2m/token',
  VALID_ISSUERS: '["https://members.example.test"]',
  AUTH_SECRET: 'synthetic-unit-test-key',
  ALLOW_LEGACY_USER_AUDIENCE: 'true',
});

/** Signs supplied synthetic claims with a test HMAC key; returns a JWT; throws for invalid JSON data. */
function signed(claims, secret = process.env.AUTH_SECRET) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ iss: 'https://members.example.test', sub: '42',
    userId: 42, roles: ['Member'], iat: now, exp: now + 120, ...claims })).toString('base64url');
  const value = `${header}.${body}`;
  return `${value}.${createHmac('sha256', secret).update(value).digest('base64url')}`;
}

/** Runs the compiled HTTP adapter with a supplied token; returns the principal or rejects on authentication failure. */
function authenticate(token) {
  const service = new JwtService({get: key => key === 'auth.authSecret' ? process.env.AUTH_SECRET : process.env.VALID_ISSUERS});
  service.onModuleInit();
  return service.validateToken(token);
}

test('member OAuth scopes cannot create a service identity', async () => {
  const user = await authenticate(signed({ scope: 'read:groups write:bus_api' }));
  assert.equal(user.kind, 'user');
  assert.equal(user.isMachine, false);
  assert.equal(user.userId, '42');
  assert.deepEqual(user.scopes, []);
});

test('invalid signatures and machine-like member claims are rejected', async () => {
  await assert.rejects(authenticate(signed({}, 'wrong-key')));
  await assert.rejects(authenticate(signed({ gty: 'client-credentials', azp: 'm2m-test' })));
  await assert.rejects(authenticate(signed({ isMachine: true })));
});

test('Keycloak issuer cannot authenticate using the member HMAC key', async () => {
  await assert.rejects(authenticate(signed({ iss: process.env.KEYCLOAK_ISSUER,
    gty: 'client-credentials', azp: 'm2m-test', scope: 'read:groups',
    aud: process.env.KEYCLOAK_AUDIENCE, userId: undefined, roles: undefined })));
});

const { TokenRolesGuard } = require('../dist/auth/guards/token-roles.guard');
/** Builds a forums route fixture from a principal and scopes; returns context and never throws. */
function check(user, scopes) {
  const guard = new TokenRolesGuard({getAllAndOverride: key => key === 'scopes' ? scopes : []});
  return guard.canActivate({getHandler: () => check, getClass: () => TokenRolesGuard,
    switchToHttp: () => ({getRequest: () => ({user})})});
}
test('forums aliases are one-way, exact, and exclude moderation', () => {
  const service = {kind:'service', isMachine:true, roles:[], scopes:['all:forums']};
  assert.equal(check(service, ['read:forums-topics']), true);
  assert.throws(() => check(service, ['moderate:forums']));
  assert.throws(() => check({...service, scopes:['read:forums-topics']}, ['all:forums']));
  assert.throws(() => check({...service, scopes:['READ:FORUMS']}, ['read:forums-topics']));
  assert.throws(() => check({...service, kind:'user', isMachine:false}, ['read:forums-topics']));
});
