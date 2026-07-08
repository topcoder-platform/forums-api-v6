import { TrustedClientIpResolverService } from './trusted-client-ip-resolver.service';
import { AuthenticatedRequest } from './authenticated-request.interface';

/**
 * Builds a minimal request carrying raw headers for client-IP resolver tests.
 *
 * @param headers Raw HTTP headers keyed by lowercase header name.
 * @returns Authenticated request test double.
 * @throws Does not throw.
 */
function makeRequest(
  headers: Record<string, string | string[]>,
): AuthenticatedRequest {
  return { headers } as AuthenticatedRequest;
}

/**
 * Creates a resolver with the requested forwarding trust flag.
 *
 * @param trusted Whether forwarded client-IP headers should be trusted.
 * @returns Trusted client-IP resolver instance.
 * @throws Does not throw.
 */
function createResolver(trusted: boolean): TrustedClientIpResolverService {
  return new TrustedClientIpResolverService({
    get: jest.fn((_key: string, fallback: boolean) => trusted ?? fallback),
  } as any);
}

describe('TrustedClientIpResolverService', () => {
  it('does not resolve forwarded client IPs when trust is disabled', () => {
    const resolver = createResolver(false);

    expect(
      resolver.resolve(
        makeRequest({ 'x-forwarded-for': '203.0.113.10, 198.51.100.2' }),
      ),
    ).toBeUndefined();
  });

  it('resolves only the first trusted forwarded client IP', () => {
    const resolver = createResolver(true);

    expect(
      resolver.resolve(
        makeRequest({ 'x-forwarded-for': '203.0.113.10, 198.51.100.2' }),
      ),
    ).toBe('203.0.113.10');
  });

  it.each([
    ['CIDR', '203.0.113.10/32'],
    ['wildcard', '203.0.113.*'],
    ['unknown', 'unknown'],
    ['invalid text', 'not-an-ip'],
    [
      'multiple exact values in a single-host header',
      '203.0.113.10, 198.51.100.2',
    ],
  ])('discards malformed or non-exact %s values', (_name, value) => {
    const resolver = createResolver(true);

    expect(
      resolver.resolve(makeRequest({ 'x-real-ip': value })),
    ).toBeUndefined();
  });
});
