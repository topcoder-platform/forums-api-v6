import { ConfigService } from '@nestjs/config';
import * as busApi from 'tc-bus-api-wrapper';
import {
  EventBusService,
  resolveM2mSettings,
  resolveV6BusApiBase,
} from './event-bus.service';

jest.mock('tc-bus-api-wrapper', () =>
  jest.fn(() => ({ postEvent: jest.fn().mockResolvedValue(undefined) })),
);

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
          'notifications.topcoderApiUrlBase': 'https://api.topcoder-dev.com/',
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

/** Notification settings for both M2M providers; values are synthetic. */
const m2mValues = {
  'notifications.busApiUrl': 'https://api.example.com/v6',
  'notifications.tokenCacheTime': '86400',
  'notifications.keycloakTokenUrl': 'https://keycloak.example.com/m2m/token',
  'notifications.keycloakAudience': 'https://api.example.com',
  'notifications.keycloakClientId': 'keycloak-client-id',
  'notifications.keycloakClientSecret': 'keycloak-client-secret',
  'notifications.auth0Url': 'https://auth.example.com/oauth/token',
  'notifications.auth0Audience': 'https://m2m.example.com/',
  'notifications.auth0ProxyServerUrl': 'https://proxy.example.com/token',
  'notifications.m2mClientId': 'auth0-client-id',
  'notifications.m2mClientSecret': 'auth0-client-secret',
};

describe('USE_KEYCLOAK M2M provider selection', () => {
  const saved = process.env.USE_KEYCLOAK;
  const busApiMock = busApi as unknown as jest.Mock;

  afterEach(() => {
    busApiMock.mockClear();
    if (saved === undefined) delete process.env.USE_KEYCLOAK;
    else process.env.USE_KEYCLOAK = saved;
  });

  it('gives the Bus client the pre-migration Auth0 settings when USE_KEYCLOAK=false', async () => {
    process.env.USE_KEYCLOAK = 'false';
    expect(resolveM2mSettings(configWith(m2mValues))).toEqual({
      AUTH0_URL: 'https://auth.example.com/oauth/token',
      AUTH0_AUDIENCE: 'https://m2m.example.com/',
      AUTH0_PROXY_SERVER_URL: 'https://proxy.example.com/token',
      AUTH0_CLIENT_ID: 'auth0-client-id',
      AUTH0_CLIENT_SECRET: 'auth0-client-secret',
    });

    await new EventBusService(configWith(m2mValues)).postEvent('topic', {});
    expect(busApiMock).toHaveBeenCalledWith({
      AUTH0_URL: 'https://auth.example.com/oauth/token',
      AUTH0_AUDIENCE: 'https://m2m.example.com/',
      AUTH0_PROXY_SERVER_URL: 'https://proxy.example.com/token',
      AUTH0_CLIENT_ID: 'auth0-client-id',
      AUTH0_CLIENT_SECRET: 'auth0-client-secret',
      TOKEN_CACHE_TIME: 86400,
      BUSAPI_URL: 'https://api.example.com/v6',
      KAFKA_ERROR_TOPIC: 'common.error.reporting',
    });
  });

  it('uses Auth0 when USE_KEYCLOAK is unset', () => {
    delete process.env.USE_KEYCLOAK;
    expect(resolveM2mSettings(configWith(m2mValues)).AUTH0_CLIENT_ID).toBe(
      'auth0-client-id',
    );
  });

  it('gives the Bus client the Keycloak settings when USE_KEYCLOAK=true', async () => {
    process.env.USE_KEYCLOAK = 'true';
    await new EventBusService(configWith(m2mValues)).postEvent('topic', {});
    expect(busApiMock).toHaveBeenCalledWith(
      expect.objectContaining({
        AUTH0_URL: 'https://keycloak.example.com/m2m/token',
        AUTH0_AUDIENCE: 'https://api.example.com',
        AUTH0_CLIENT_ID: 'keycloak-client-id',
        AUTH0_CLIENT_SECRET: 'keycloak-client-secret',
        TOKEN_CACHE_TIME: 86400,
      }),
    );
  });

  it('rejects a USE_KEYCLOAK value other than true/false', () => {
    process.env.USE_KEYCLOAK = 'yes';
    expect(() => resolveM2mSettings(configWith(m2mValues))).toThrow(
      'USE_KEYCLOAK must be true or false',
    );
  });
});
