import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { auth } from 'tc-core-library-js';

const CHALLENGE_REQUEST_TIMEOUT_MS = 5_000;

/**
 * Resolves challenge titles and public links for forum notifications.
 * The shared M2M library reuses cached tokens for the bus publisher's credentials;
 * client initialization is lazy so missing outbound configuration does not block startup.
 */
@Injectable()
export class ChallengeApiService {
  private m2mClient?: ReturnType<typeof auth.m2m>;

  /**
   * Creates the notification challenge lookup adapter.
   *
   * @param configService Notification API and Auth0 M2M configuration.
   * @throws Does not throw; configuration is validated on lookup.
   */
  constructor(private readonly configService: ConfigService) {}

  /**
   * Fetches a challenge's name for the notification's `challengeTitle` field.
   *
   * @param challengeId Effective challenge id inherited by the notified topic.
   * @returns Non-empty challenge name from the Challenge API.
   * @throws Error for missing configuration, token failures, unsuccessful or invalid
   * API responses, and HTTP requests exceeding five seconds. The publisher catches
   * these errors and sends the notification without a challenge title.
   */
  async getChallengeTitle(challengeId: string): Promise<string> {
    const apiBase = this.resolveApiBase();
    const clientId = this.configService.get<string>(
      'notifications.m2mClientId',
    );
    const clientSecret = this.configService.get<string>(
      'notifications.m2mClientSecret',
    );

    if (!clientId || !clientSecret) {
      throw new Error(
        'M2M_CLIENT_ID and M2M_CLIENT_SECRET must configure Challenge API access.',
      );
    }

    if (!this.m2mClient) {
      const tokenCacheTime = Number(
        this.configService.get<string>('notifications.tokenCacheTime'),
      );
      this.m2mClient = auth.m2m({
        AUTH0_URL: this.configService.get<string>('notifications.auth0Url'),
        AUTH0_AUDIENCE: this.configService.get<string>(
          'notifications.auth0Audience',
        ),
        TOKEN_CACHE_TIME: Number.isFinite(tokenCacheTime)
          ? tokenCacheTime
          : undefined,
        AUTH0_PROXY_SERVER_URL: this.configService.get<string>(
          'notifications.auth0ProxyServerUrl',
        ),
      });
    }

    const token = await this.m2mClient.getMachineToken(clientId, clientSecret);
    const response = await fetch(
      `${apiBase}/${encodeURIComponent(challengeId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(CHALLENGE_REQUEST_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      throw new Error(`Challenge API returned HTTP ${response.status}.`);
    }

    const challenge: unknown = await response.json();

    if (
      !challenge ||
      typeof challenge !== 'object' ||
      !('name' in challenge) ||
      typeof challenge.name !== 'string' ||
      !challenge.name.trim()
    ) {
      throw new Error('Challenge API returned no usable challenge name.');
    }

    return challenge.name;
  }

  /**
   * Builds the public Opportunities URL for a challenge notification.
   *
   * `TOPCODER_URL` is authoritative when configured. Existing deployments can
   * fall back to `TOPCODER_API_URL_BASE`; its conventional `api.` host prefix
   * is changed to `www.` while preserving the environment domain.
   *
   * @param challengeId Effective challenge id inherited by the notified topic.
   * @returns Absolute public challenge-details URL.
   * @throws Error when neither web nor API base configuration is usable.
   */
  getChallengeUrl(challengeId: string): string {
    const configuredWebBase = this.configService
      .get<string>('notifications.topcoderUrl')
      ?.trim();
    const configuredApiBase = this.configService
      .get<string>('notifications.topcoderApiUrlBase')
      ?.trim();
    const configuredBase = configuredWebBase || configuredApiBase;

    if (!configuredBase) {
      throw new Error(
        'TOPCODER_URL or TOPCODER_API_URL_BASE must configure public challenge links.',
      );
    }

    let publicUrl: URL;

    try {
      publicUrl = new URL(configuredBase);
    } catch {
      throw new Error(
        `${configuredWebBase ? 'TOPCODER_URL' : 'TOPCODER_API_URL_BASE'} must be an absolute HTTP(S) URL.`,
      );
    }

    if (!['http:', 'https:'].includes(publicUrl.protocol)) {
      throw new Error(
        `${configuredWebBase ? 'TOPCODER_URL' : 'TOPCODER_API_URL_BASE'} must be an absolute HTTP(S) URL.`,
      );
    }

    if (!configuredWebBase && publicUrl.hostname.startsWith('api.')) {
      publicUrl.hostname = `www.${publicUrl.hostname.slice('api.'.length)}`;
    }

    publicUrl.pathname = `/opportunities/challenge/${encodeURIComponent(challengeId)}`;
    publicUrl.search = '';
    publicUrl.hash = '';
    return publicUrl.toString();
  }

  /**
   * Resolves the challenges collection URL from explicit or shared API settings.
   *
   * @returns API base without trailing slashes, ready for a challenge id suffix.
   * @throws Error when neither CHALLENGE_API_URL nor TOPCODER_API_URL_BASE is set.
   */
  private resolveApiBase(): string {
    const configured = this.configService
      .get<string>('notifications.challengeApiUrl')
      ?.trim();

    if (configured) {
      return configured.replace(/\/+$/, '');
    }

    const sharedBase = this.configService
      .get<string>('notifications.topcoderApiUrlBase')
      ?.trim();

    if (!sharedBase) {
      throw new Error(
        'CHALLENGE_API_URL or TOPCODER_API_URL_BASE must configure the Challenge API.',
      );
    }

    return `${sharedBase.replace(/\/+$/, '')}/v6/challenges`;
  }
}
