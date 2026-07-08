import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient as ChallengePrismaClient } from '../../../../challenge-api-v6/packages/challenge-prisma-client';

/**
 * Importer-only challenge existence cache for challenge-scoped discussions.
 */
@Injectable()
export class VanillaChallengeLookupService implements OnModuleDestroy {
  private client?: ChallengePrismaClient;
  private initialized = false;
  private readonly cache = new Map<string, boolean>();

  /**
   * Creates a challenge lookup adapter.
   *
   * @param configService Configuration service containing challenge DB URLs.
   * @throws Does not throw directly; missing configuration fails on use.
   */
  constructor(private readonly configService: ConfigService) {}

  /**
   * Runs a lightweight challenge database connectivity check.
   *
   * @returns A promise that resolves when the Challenge database responds.
   * @throws Error when a challenge DB URL is missing or the query fails.
   */
  async ping(): Promise<void> {
    await this.resolveClient().$queryRaw`SELECT 1`;
  }

  /**
   * Checks whether a challenge exists and is not deleted.
   *
   * @param challengeId Challenge id from a legacy discussion.
   * @returns True when the challenge exists and is not marked deleted.
   * @throws Prisma errors when the lookup fails.
   */
  async exists(challengeId: string): Promise<boolean> {
    const normalizedChallengeId = challengeId.trim();

    if (!normalizedChallengeId) {
      return false;
    }

    const cached = this.cache.get(normalizedChallengeId);

    if (cached !== undefined) {
      return cached;
    }

    const challenge = await this.resolveClient().challenge.findUnique({
      where: { id: normalizedChallengeId },
      select: { id: true, status: true },
    });
    const exists = Boolean(challenge && challenge.status !== 'DELETED');

    this.cache.set(normalizedChallengeId, exists);
    return exists;
  }

  /**
   * Disconnects the Challenge Prisma client during importer shutdown.
   *
   * @returns A promise that resolves after disconnecting or no-ops.
   * @throws Prisma disconnection errors from the generated client.
   */
  async onModuleDestroy(): Promise<void> {
    await this.client?.$disconnect();
  }

  /**
   * Lazily creates the exported Challenge Prisma client.
   *
   * @returns Configured Challenge client.
   * @throws Error when no challenge database URL is configured.
   */
  private resolveClient(): ChallengePrismaClient {
    if (this.client) {
      return this.client;
    }

    if (this.initialized) {
      throw new Error(
        'CHALLENGE_DB_URL or CHALLENGES_DB_URL must be configured for Vanilla import.',
      );
    }

    this.initialized = true;
    const databaseUrl = this.configService.get<string>('database.challengeUrl');

    if (!databaseUrl) {
      throw new Error(
        'CHALLENGE_DB_URL or CHALLENGES_DB_URL must be configured for Vanilla import.',
      );
    }

    this.client = new ChallengePrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    return this.client;
  }
}
