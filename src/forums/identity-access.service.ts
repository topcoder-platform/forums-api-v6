import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient as IdentityPrismaClient } from '../../../identity-api-v6/packages/identity-prisma-client';
import { normalizeForumsRoles } from './forums-access.types';

/**
 * Strict identity-directory result for command-time member target validation.
 */
export interface IdentityMemberAccessProfile {
  memberId: string;
  roles: string[];
}

/**
 * Adapter for identity-directory facts needed by forums policies.
 *
 * Human command role matching uses JWT claims. Scoped M2M on-behalf watch and
 * read-state commands use this service to evaluate the target member's roles
 * without importing raw identity Prisma models elsewhere.
 */
@Injectable()
export class IdentityAccessService implements OnModuleDestroy {
  private client?: IdentityPrismaClient;
  private initialized = false;

  /**
   * Creates an identity access adapter.
   *
   * @param configService Nest configuration service containing `IDENTITY_DB_URL`.
   * @throws Does not throw directly; missing configuration is handled per lookup.
   */
  constructor(private readonly configService: ConfigService) {}

  /**
   * Resolves normalized security-group descriptions for a member.
   *
   * @param memberId Topcoder member user id.
   * @returns Lowercase role-like group descriptions for policy evaluation, or an empty array when unavailable.
   * @throws Prisma errors when a configured identity database lookup fails.
   */
  async getMemberRoleNames(memberId: string): Promise<string[]> {
    const profile = await this.resolveMemberAccessProfile(memberId);
    return profile?.roles ?? [];
  }

  /**
   * Resolves a member identity row and normalized role descriptions for command validation.
   *
   * @param memberId Topcoder member user id supplied by a scoped M2M command.
   * @returns The resolved member identity profile, or `undefined` when no identity row exists or identity lookup is unavailable.
   * @throws Prisma errors when a configured identity database lookup fails.
   */
  async resolveMemberAccessProfile(
    memberId: string,
  ): Promise<IdentityMemberAccessProfile | undefined> {
    const client = this.resolveClient();
    const normalizedMemberId = memberId.trim();

    if (!client || !normalizedMemberId) {
      return undefined;
    }

    const securityUser = await client.security_user.findUnique({
      where: { user_id: normalizedMemberId },
      select: { login_id: true },
    });

    if (!securityUser) {
      return undefined;
    }

    const groupRows = await client.user_group_xref.findMany({
      where: { login_id: securityUser.login_id },
      include: {
        security_groups: {
          select: { description: true },
        },
      },
    });

    return {
      memberId: normalizedMemberId,
      roles: normalizeForumsRoles(
        groupRows.map(
          (groupRow) => groupRow.security_groups?.description ?? '',
        ),
      ),
    };
  }

  /**
   * Disconnects the identity Prisma client during Nest module shutdown.
   *
   * @returns A promise that resolves after the client disconnects or no-ops.
   * @throws Prisma disconnection errors from the generated identity client.
   */
  async onModuleDestroy(): Promise<void> {
    await this.client?.$disconnect();
  }

  /**
   * Lazily creates the exported identity Prisma client.
   *
   * @returns Configured identity Prisma client, or `undefined` without `IDENTITY_DB_URL`.
   * @throws Does not throw for missing configuration.
   */
  private resolveClient(): IdentityPrismaClient | undefined {
    if (this.initialized) {
      return this.client;
    }

    this.initialized = true;
    const databaseUrl = this.configService.get<string>('database.identityUrl');

    if (!databaseUrl) {
      return undefined;
    }

    this.client = new IdentityPrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    return this.client;
  }
}
