import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient as MemberPrismaClient } from '../../../member-api-v6/packages/member-prisma-client';

/**
 * Member-domain record used by forum notifications and command validation.
 */
export interface ForumsNotificationMember {
  memberId: string;
  email: string | null;
  handle: string | null;
}

/**
 * Batch adapter for member email, handle, and existence lookups.
 *
 * This service is intentionally separate from `MemberHandleService`: command
 * content writes use author snapshot resolution, while notification publishing
 * needs a best-effort batch directory lookup after content has already
 * committed. Member-owned state writes also use this adapter to validate
 * scoped M2M target members before policy evaluation or persistence.
 */
@Injectable()
export class ForumsMemberDirectoryService implements OnModuleDestroy {
  private client?: MemberPrismaClient;
  private initialized = false;

  /**
   * Creates a member directory adapter.
   *
   * @param configService Nest configuration service containing `MEMBER_DB_URL`.
   * @throws Does not throw directly; missing configuration returns no records.
   */
  constructor(private readonly configService: ConfigService) {}

  /**
   * Resolves member-domain records for a batch of forum member ids.
   *
   * @param memberIds Forum member ids to resolve for notification delivery or M2M target validation.
   * @returns Member records found in the Members service database.
   * @throws Prisma errors when a configured member database lookup fails.
   */
  async getMembersByIds(
    memberIds: readonly string[],
  ): Promise<ForumsNotificationMember[]> {
    const client = this.resolveClient();

    if (!client) {
      return [];
    }

    const userIds = this.normalizeMemberIds(memberIds);

    if (userIds.length === 0) {
      return [];
    }

    const members = await client.member.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, email: true, handle: true },
    });

    return members.map((member) => ({
      memberId: member.userId.toString(),
      email: this.normalizeOptionalText(member.email),
      handle: this.normalizeOptionalText(member.handle),
    }));
  }

  /**
   * Disconnects the member Prisma client during Nest module shutdown.
   *
   * @returns A promise that resolves after the client disconnects or no-ops.
   * @throws Prisma disconnection errors from the generated member client.
   */
  async onModuleDestroy(): Promise<void> {
    await this.client?.$disconnect();
  }

  /**
   * Lazily creates the exported member Prisma client.
   *
   * @returns Configured member Prisma client, or `undefined` without `MEMBER_DB_URL`.
   * @throws Does not throw for missing configuration.
   */
  private resolveClient(): MemberPrismaClient | undefined {
    if (this.initialized) {
      return this.client;
    }

    this.initialized = true;
    const databaseUrl = this.configService.get<string>('database.memberUrl');

    if (!databaseUrl) {
      return undefined;
    }

    this.client = new MemberPrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    return this.client;
  }

  /**
   * Converts forum member ids into unique numeric Members user ids.
   *
   * @param memberIds Raw forum member id strings.
   * @returns Unique BigInt user ids accepted by the Members Prisma client.
   * @throws Does not throw; invalid member ids are skipped.
   */
  private normalizeMemberIds(memberIds: readonly string[]): bigint[] {
    const normalized = new Set<bigint>();

    for (const memberId of memberIds) {
      const value = memberId.trim();

      if (!/^\d+$/.test(value)) {
        continue;
      }

      try {
        normalized.add(BigInt(value));
      } catch {
        continue;
      }
    }

    return Array.from(normalized);
  }

  /**
   * Normalizes an optional persisted member string.
   *
   * @param value Raw member field value.
   * @returns Trimmed string, or `null` when no value remains.
   * @throws Does not throw.
   */
  private normalizeOptionalText(
    value: string | null | undefined,
  ): string | null {
    const normalized = value?.trim();
    return normalized && normalized.length > 0 ? normalized : null;
  }
}
