import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient as ResourcePrismaClient } from '../../../resource-api-v6/packages/resources-prisma-client';
import { normalizeForumRoleName } from './forums-access.types';

/**
 * Resource-domain challenge assignment facts normalized for forum policy checks.
 */
export interface ResourceAccessFacts {
  configured: boolean;
  hasChallengeResource: boolean;
  isChallengeCopilot: boolean;
  hasFullReadAccess: boolean;
  hasFullWriteAccess: boolean;
  roleNames: readonly string[];
}

/**
 * Adapter for challenge resource roles and copilot detection.
 *
 * The service owns all direct reads from the Resources Prisma client and
 * exposes only normalized facts needed by forums authorization.
 */
@Injectable()
export class ResourceAccessService implements OnModuleDestroy {
  private client?: ResourcePrismaClient;
  private initialized = false;

  /**
   * Creates a resource access adapter.
   *
   * @param configService Nest configuration service containing resource DB URLs.
   * @throws Does not throw directly; missing configuration is handled per lookup.
   */
  constructor(private readonly configService: ConfigService) {}

  /**
   * Resolves resource assignments for a member on a challenge.
   *
   * @param challengeId Challenge id inherited by a forum topic.
   * @param memberId Optional acting member id.
   * @returns Normalized challenge resource facts for policy evaluation.
   * @throws Prisma errors when a configured resource database lookup fails.
   */
  async getResourceAccessFacts(
    challengeId: string,
    memberId: string | null,
  ): Promise<ResourceAccessFacts> {
    const client = this.resolveClient();

    if (!client || !memberId) {
      return this.emptyFacts(Boolean(client));
    }

    const resources = await client.resource.findMany({
      where: { challengeId, memberId },
      include: { resourceRole: true },
    });
    const roleNames = Array.from(
      new Set(
        resources
          .map((resource) =>
            normalizeForumRoleName(
              resource.resourceRole.nameLower || resource.resourceRole.name,
            ),
          )
          .filter((roleName): roleName is string => Boolean(roleName)),
      ),
    );

    return {
      configured: true,
      hasChallengeResource: resources.length > 0,
      isChallengeCopilot: roleNames.some((roleName) =>
        roleName.includes('copilot'),
      ),
      hasFullReadAccess: resources.some(
        (resource) => resource.resourceRole.fullReadAccess,
      ),
      hasFullWriteAccess: resources.some(
        (resource) => resource.resourceRole.fullWriteAccess,
      ),
      roleNames,
    };
  }

  /**
   * Disconnects the resource Prisma client during Nest module shutdown.
   *
   * @returns A promise that resolves after the client disconnects or no-ops.
   * @throws Prisma disconnection errors from the generated resource client.
   */
  async onModuleDestroy(): Promise<void> {
    await this.client?.$disconnect();
  }

  /**
   * Creates default facts when no resource assignment can be checked.
   *
   * @param configured Whether a usable database URL was configured.
   * @returns Empty resource facts.
   * @throws Does not throw.
   */
  private emptyFacts(configured: boolean): ResourceAccessFacts {
    return {
      configured,
      hasChallengeResource: false,
      isChallengeCopilot: false,
      hasFullReadAccess: false,
      hasFullWriteAccess: false,
      roleNames: [],
    };
  }

  /**
   * Lazily creates the exported resource Prisma client.
   *
   * @returns Configured resource Prisma client, or `undefined` without a DB URL.
   * @throws Does not throw for missing configuration.
   */
  private resolveClient(): ResourcePrismaClient | undefined {
    if (this.initialized) {
      return this.client;
    }

    this.initialized = true;
    const databaseUrl = this.configService.get<string>('database.resourceUrl');

    if (!databaseUrl) {
      return undefined;
    }

    this.client = new ResourcePrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    return this.client;
  }
}
