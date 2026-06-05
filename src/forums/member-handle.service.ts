import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient as MemberPrismaClient } from '../../../member-api-v6/packages/member-prisma-client';

/**
 * Adapter for resolving forum author handle snapshots from the Members domain.
 *
 * The service lazily opens the exported member Prisma client only when a token
 * needs a handle lookup. Forum mutations use it to avoid persisting member IDs
 * as durable `authorHandle` snapshots when a valid JWT omits the handle claim.
 */
@Injectable()
export class MemberHandleService implements OnModuleDestroy {
  private client?: MemberPrismaClient;
  private initialized = false;

  /**
   * Creates a member handle lookup service.
   *
   * @param configService Nest configuration service containing `MEMBER_DB_URL`.
   * @throws Does not throw directly; missing configuration is handled per lookup.
   */
  constructor(private readonly configService: ConfigService) {}

  /**
   * Resolves a member handle by Topcoder member user id.
   *
   * @param memberId Forum actor member id from the authenticated token.
   * @returns The trimmed member handle snapshot, or `undefined` when not resolvable.
   * @throws Prisma errors when the configured member database lookup fails.
   */
  async resolveHandleByMemberId(memberId: string): Promise<string | undefined> {
    const userId = this.normalizeUserId(memberId);

    if (!userId) {
      return undefined;
    }

    const client = this.resolveClient();

    if (!client) {
      return undefined;
    }

    const member = await client.member.findUnique({
      where: { userId },
      select: { handle: true },
    });

    return this.normalizeHandle(member?.handle);
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
   * Lazily creates the exported member Prisma client for handle lookups.
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
   * Converts a forum member id string into the BigInt id used by Members.
   *
   * @param memberId Raw member id string from the token.
   * @returns BigInt user id when the value is numeric, otherwise `undefined`.
   * @throws Does not throw; invalid values return `undefined`.
   */
  private normalizeUserId(memberId: string): bigint | undefined {
    const normalized = memberId.trim();

    if (!/^\d+$/.test(normalized)) {
      return undefined;
    }

    try {
      return BigInt(normalized);
    } catch {
      return undefined;
    }
  }

  /**
   * Normalizes a member handle for persistence in forum snapshot fields.
   *
   * @param handle Raw handle from the Members database.
   * @returns Trimmed handle capped to the forum snapshot column length.
   * @throws Does not throw.
   */
  private normalizeHandle(
    handle: string | null | undefined,
  ): string | undefined {
    const normalized = handle?.trim();
    return normalized ? normalized.slice(0, 128) : undefined;
  }
}
