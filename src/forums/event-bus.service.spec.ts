import { ConfigService } from '@nestjs/config';
import { resolveV6BusApiBase } from './event-bus.service';

/**
 * Creates a nested notification configuration test double.
 *
 * @param values Configuration values keyed by their resolved Nest paths.
 * @returns ConfigService-compatible lookup object.
 * @throws Does not throw.
 */
function configWith(values: Record<string, string>): ConfigService {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

describe('resolveV6BusApiBase', () => {
  it('normalizes the canonical v6 base and the legacy full-endpoint alias', () => {
    expect(
      resolveV6BusApiBase(
        configWith({
          'notifications.busApiUrl': 'https://api.topcoder-dev.com/v6/',
          'notifications.busApiUrlAlias':
            'https://api.topcoder-dev.com/v6/bus/events',
        }),
      ),
    ).toBe('https://api.topcoder-dev.com/v6');
  });

  it('derives the v6 Bus base from the shared Topcoder API host', () => {
    expect(
      resolveV6BusApiBase(
        configWith({
          'notifications.topcoderApiUrlBase':
            'https://api.topcoder-dev.com/',
        }),
      ),
    ).toBe('https://api.topcoder-dev.com/v6');
  });

  it.each([
    ['http://localhost:4000/eventBus', 'Bus API base ending in /v6'],
    ['https://api.topcoder-dev.com/v5', 'Bus API base ending in /v6'],
    ['not-a-url', 'absolute Bus API v6 URL'],
  ])('rejects an invalid configured Bus URL %s', (configured, message) => {
    expect(() =>
      resolveV6BusApiBase(
        configWith({ 'notifications.busApiUrl': configured }),
      ),
    ).toThrow(message);
  });

  it('rejects conflicting canonical and alias bases', () => {
    expect(() =>
      resolveV6BusApiBase(
        configWith({
          'notifications.busApiUrl': 'https://api.topcoder-dev.com/v6',
          'notifications.busApiUrlAlias': 'https://api.topcoder.com/v6',
        }),
      ),
    ).toThrow('resolve to different Bus API v6 bases');
  });

  it('rejects missing Bus and shared API configuration', () => {
    expect(() => resolveV6BusApiBase(configWith({}))).toThrow(
      'BUSAPI_URL, BUS_API_URL, or TOPCODER_API_URL_BASE',
    );
  });
});
