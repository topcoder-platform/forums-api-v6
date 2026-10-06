import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as busApi from 'tc-bus-api-wrapper';

interface EventBusMessage<T> {
  topic: string;
  originator: string;
  timestamp: string;
  'mime-type': string;
  payload: T;
}

type BusApiClient = {
  postEvent: <T>(message: EventBusMessage<T>) => Promise<void>;
};

/**
 * Resolves the Bus API v6 base consumed by `tc-bus-api-wrapper`.
 *
 * The wrapper appends `/bus/events` itself. The canonical `BUSAPI_URL` and
 * backwards-compatible `BUS_API_URL` alias may therefore provide either the
 * v6 base or the complete event URL; complete URLs are reduced to the base.
 * When neither is configured, `TOPCODER_API_URL_BASE` supplies the API host.
 *
 * @param configService Nest configuration service containing notification settings.
 * @returns An absolute URL whose path ends in `/v6`.
 * @throws Error when configuration is missing, invalid, non-v6, or conflicting.
 */
export function resolveV6BusApiBase(configService: ConfigService): string {
  const canonical = configService
    .get<string>('notifications.busApiUrl')
    ?.trim();
  const alias = configService
    .get<string>('notifications.busApiUrlAlias')
    ?.trim();
  const canonicalBase = canonical
    ? normalizeV6BusApiBase(canonical, 'BUSAPI_URL')
    : undefined;
  const aliasBase = alias
    ? normalizeV6BusApiBase(alias, 'BUS_API_URL')
    : undefined;

  if (canonicalBase && aliasBase && canonicalBase !== aliasBase) {
    throw new Error(
      'BUSAPI_URL and BUS_API_URL resolve to different Bus API v6 bases.',
    );
  }

  if (canonicalBase) {
    return canonicalBase;
  }

  if (aliasBase) {
    return aliasBase;
  }

  const topcoderApiUrlBase = configService
    .get<string>('notifications.topcoderApiUrlBase')
    ?.trim();

  if (!topcoderApiUrlBase) {
    throw new Error(
      'BUSAPI_URL, BUS_API_URL, or TOPCODER_API_URL_BASE must configure the Bus API v6 base.',
    );
  }

  return normalizeV6BusApiBase(
    `${topcoderApiUrlBase.replace(/\/+$/, '')}/v6`,
    'TOPCODER_API_URL_BASE',
  );
}

/**
 * Normalizes a configured Bus API base or complete event URL.
 *
 * @param configured Configured URL value.
 * @param key Environment key represented by the value.
 * @returns Absolute v6 API base without a trailing slash.
 * @throws Error when the URL is invalid or does not target Bus API v6.
 */
function normalizeV6BusApiBase(configured: string, key: string): string {
  let parsed: URL;

  try {
    parsed = new URL(configured);
  } catch {
    throw new Error(`${key} must be an absolute Bus API v6 URL.`);
  }

  let pathname = parsed.pathname.replace(/\/+$/, '');

  if (pathname.endsWith('/bus/events')) {
    pathname = pathname.slice(0, -'/bus/events'.length);
  }

  if (!pathname.endsWith('/v6')) {
    throw new Error(
      `${key} must be the Bus API base ending in /v6 or its /bus/events endpoint.`,
    );
  }

  parsed.pathname = pathname;
  parsed.search = '';
  parsed.hash = '';
  return parsed.toString().replace(/\/$/, '');
}

/**
 * Local adapter for publishing forums events to the shared event bus.
 *
 * The adapter mirrors the v6 `postEvent` convention used by neighboring
 * services while keeping bus-client initialization behind one injectable
 * boundary. Forum command services do not call this adapter directly; they use
 * `ForumsWatchNotificationService` so notification publishing remains
 * best-effort at the command boundary.
 */
@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);
  private busApiClient?: BusApiClient;

  /**
   * Creates the event-bus adapter.
   *
   * @param configService Nest configuration service containing notification bus settings.
   * @throws Does not throw directly; client initialization is lazy.
   */
  constructor(private readonly configService: ConfigService) {}

  /**
   * Publishes a payload to a named event-bus topic.
   *
   * @param topic Event-bus topic name.
   * @param payload JSON payload delivered to the event bus.
   * @returns A promise that resolves after the event-bus client accepts the message.
   * @throws InternalServerErrorException when the bus client cannot publish.
   */
  async postEvent<T>(topic: string, payload: T): Promise<void> {
    const message: EventBusMessage<T> = {
      topic,
      originator: 'forums-api-v6',
      timestamp: new Date().toISOString(),
      'mime-type': 'application/json',
      payload,
    };

    try {
      await this.getBusApiClient().postEvent(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(`Event bus failed with error: ${message}`);
      throw new InternalServerErrorException(
        'Sending message to event bus failed.',
      );
    }
  }

  /**
   * Lazily creates the shared event-bus client.
   *
   * @returns Configured event-bus client.
   * @throws InternalServerErrorException when the wrapper returns no client.
   */
  private getBusApiClient(): BusApiClient {
    if (this.busApiClient) {
      return this.busApiClient;
    }

    const tokenCacheTime = Number(
      this.configService.get<string>('notifications.tokenCacheTime'),
    );

    try {
      this.busApiClient = busApi({
        AUTH0_URL: this.configService.get<string>('notifications.auth0Url'),
        AUTH0_AUDIENCE: this.configService.get<string>(
          'notifications.auth0Audience',
        ),
        TOKEN_CACHE_TIME: Number.isFinite(tokenCacheTime)
          ? tokenCacheTime
          : undefined,
        AUTH0_CLIENT_ID: this.configService.get<string>(
          'notifications.m2mClientId',
        ),
        AUTH0_CLIENT_SECRET: this.configService.get<string>(
          'notifications.m2mClientSecret',
        ),
        BUSAPI_URL: resolveV6BusApiBase(this.configService),
        KAFKA_ERROR_TOPIC:
          this.configService.get<string>('notifications.kafkaErrorTopic') ||
          'common.error.reporting',
        AUTH0_PROXY_SERVER_URL: this.configService.get<string>(
          'notifications.auth0ProxyServerUrl',
        ),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(`Event bus client initialization failed: ${message}`);
      throw error;
    }

    if (!this.busApiClient) {
      throw new InternalServerErrorException(
        'Event bus client initialization failed.',
      );
    }

    return this.busApiClient;
  }
}
