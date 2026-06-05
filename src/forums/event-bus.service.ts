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
        BUSAPI_URL:
          this.configService.get<string>('notifications.busApiUrl') ||
          'http://localhost:4000/eventBus',
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
