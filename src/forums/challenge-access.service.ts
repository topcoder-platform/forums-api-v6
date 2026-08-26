import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createChallengePrismaClient,
  PrismaClient as ChallengePrismaClient,
} from '../../../challenge-api-v6/packages/challenge-prisma-client';

/**
 * Challenge-domain access facts normalized for forum authorization.
 */
export interface ChallengeAccessFacts {
  configured: boolean;
  challengeExists: boolean;
  memberHasChallengeAccess: boolean;
  memberIsWhitelisted: boolean;
}

/**
 * Adapter for challenge existence and member challenge-access facts.
 *
 * The forums policy consumes this service instead of depending on challenge
 * Prisma models directly. The generated challenge client is initialized lazily
 * so forums startup does not require every cross-service database URL.
 */
@Injectable()
export class ChallengeAccessService implements OnModuleDestroy {
  private client?: ChallengePrismaClient;
  private initialized = false;

  /**
   * Creates a challenge access adapter.
   *
   * @param configService Nest configuration service containing challenge DB URLs.
   * @throws Does not throw directly; missing configuration is handled per lookup.
   */
  constructor(private readonly configService: ConfigService) {}

  /**
   * Resolves challenge existence and member access facts.
   *
   * @param challengeId Challenge id inherited by a forum topic.
   * @param memberId Optional acting member id for member-specific checks.
   * @returns Normalized challenge access facts for policy evaluation.
   * @throws Prisma errors when a configured challenge database lookup fails.
   */
  async getChallengeAccessFacts(
    challengeId: string,
    memberId: string | null,
  ): Promise<ChallengeAccessFacts> {
    const client = this.resolveClient();

    if (!client) {
      return this.emptyFacts(false);
    }

    const challenge = await client.challenge.findUnique({
      where: { id: challengeId },
      select: { id: true, status: true },
    });
    const challengeExists = Boolean(
      challenge && challenge.status !== 'DELETED',
    );

    if (!challengeExists || !memberId) {
      return {
        configured: true,
        challengeExists,
        memberHasChallengeAccess: false,
        memberIsWhitelisted: false,
      };
    }

    const [memberAccess, whitelistAccess] = await Promise.all([
      client.memberChallengeAccess.findFirst({
        where: { challengeId, memberId },
        select: { challengeId: true },
      }),
      client.challengeUserWhitelist.findFirst({
        where: { challengeId, userId: memberId },
        select: { challengeId: true },
      }),
    ]);

    return {
      configured: true,
      challengeExists,
      memberHasChallengeAccess: Boolean(memberAccess || whitelistAccess),
      memberIsWhitelisted: Boolean(whitelistAccess),
    };
  }

  /**
   * Disconnects the challenge Prisma client during Nest module shutdown.
   *
   * @returns A promise that resolves after the client disconnects or no-ops.
   * @throws Prisma disconnection errors from the generated challenge client.
   */
  async onModuleDestroy(): Promise<void> {
    await this.client?.$disconnect();
  }

  /**
   * Creates default facts for missing adapter configuration.
   *
   * @param configured Whether a usable database URL was configured.
   * @returns Empty challenge facts.
   * @throws Does not throw.
   */
  private emptyFacts(configured: boolean): ChallengeAccessFacts {
    return {
      configured,
      challengeExists: false,
      memberHasChallengeAccess: false,
      memberIsWhitelisted: false,
    };
  }

  /**
   * Lazily creates the exported challenge Prisma client.
   *
   * @returns Configured challenge Prisma client, or `undefined` without a DB URL.
   * @throws Does not throw for missing configuration.
   */
  private resolveClient(): ChallengePrismaClient | undefined {
    if (this.initialized) {
      return this.client;
    }

    this.initialized = true;
    const databaseUrl = this.configService.get<string>('database.challengeUrl');

    if (!databaseUrl) {
      return undefined;
    }

    this.client = createChallengePrismaClient(databaseUrl);

    return this.client;
  }
}
