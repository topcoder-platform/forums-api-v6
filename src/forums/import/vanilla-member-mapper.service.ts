import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient as MemberPrismaClient } from '../../../../member-api-v6/packages/member-prisma-client';
import {
  VanillaLegacyActor,
  VanillaMemberMappingResult,
} from './vanilla-import.types';

type MemberLookupResult = {
  userId: bigint;
  handle: string;
};

/**
 * Importer-only mapper from Vanilla users to current Topcoder members.
 *
 * Mapping is cached per legacy user id and is intentionally handle-first. Email
 * fallback is used only when the normalized handle does not resolve a member,
 * matching the import recovery model where unresolved actors are skipped and
 * reported instead of creating partial forum rows.
 */
@Injectable()
export class VanillaMemberMapperService implements OnModuleDestroy {
  private client?: MemberPrismaClient;
  private initialized = false;
  private readonly cache = new Map<string, VanillaMemberMappingResult>();

  /**
   * Creates a Vanilla member mapper.
   *
   * @param configService Configuration service containing `database.memberUrl`.
   * @throws Does not throw directly; missing configuration fails on use.
   */
  constructor(private readonly configService: ConfigService) {}

  /**
   * Runs a lightweight members database connectivity check.
   *
   * @returns A promise that resolves when Members responds.
   * @throws Error when `MEMBER_DB_URL` is missing or the query fails.
   */
  async ping(): Promise<void> {
    await this.resolveClient().$queryRaw`SELECT 1`;
  }

  /**
   * Maps a legacy Vanilla actor to a Topcoder member id and current handle.
   *
   * @param actor Legacy user id, handle, and email projected from Vanilla.
   * @returns Matched member snapshot, or an unmatched result with a reason.
   * @throws Prisma errors when a configured Members lookup fails.
   */
  async mapActor(
    actor: VanillaLegacyActor,
  ): Promise<VanillaMemberMappingResult> {
    const legacyUserId = this.normalizeLegacyUserId(actor.legacyUserId);
    const cached = this.cache.get(legacyUserId);

    if (cached) {
      return cached;
    }

    const result = await this.resolveActor(legacyUserId, actor);
    this.cache.set(legacyUserId, result);
    return result;
  }

  /**
   * Disconnects the Members Prisma client during importer shutdown.
   *
   * @returns A promise that resolves after disconnecting or no-ops.
   * @throws Prisma disconnection errors from the generated client.
   */
  async onModuleDestroy(): Promise<void> {
    await this.client?.$disconnect();
  }

  /**
   * Resolves and normalizes a single actor mapping without consulting cache.
   *
   * @param legacyUserId Normalized legacy user id.
   * @param actor Legacy actor fields.
   * @returns Mapping result.
   * @throws Prisma errors when the member lookup fails.
   */
  private async resolveActor(
    legacyUserId: string,
    actor: VanillaLegacyActor,
  ): Promise<VanillaMemberMappingResult> {
    if (!legacyUserId) {
      return {
        status: 'unmatched',
        legacyUserId,
        reason: 'missing_legacy_user_id',
      };
    }

    const handle = this.normalizeHandle(actor.handle);

    if (handle) {
      const handleMember = await this.findByHandle(handle);

      if (handleMember) {
        return {
          status: 'matched',
          legacyUserId,
          memberId: handleMember.userId.toString(),
          handle: this.normalizeCurrentHandle(handleMember.handle),
          matchedBy: 'handle',
        };
      }
    }

    const email = this.normalizeEmail(actor.email);

    if (email) {
      const emailMember = await this.findByEmail(email);

      if (emailMember) {
        return {
          status: 'matched',
          legacyUserId,
          memberId: emailMember.userId.toString(),
          handle: this.normalizeCurrentHandle(emailMember.handle),
          matchedBy: 'email',
        };
      }
    }

    return {
      status: 'unmatched',
      legacyUserId,
      reason: handle || email ? 'member_not_found' : 'missing_handle_and_email',
    };
  }

  /**
   * Finds a member by normalized handle.
   *
   * @param handle Trimmed legacy handle.
   * @returns Member id and current handle, or null.
   * @throws Prisma errors when the lookup fails.
   */
  private async findByHandle(
    handle: string,
  ): Promise<MemberLookupResult | null> {
    return this.resolveClient().member.findUnique({
      where: { handleLower: handle.toLowerCase() },
      select: { userId: true, handle: true },
    });
  }

  /**
   * Finds a member by unique email fallback.
   *
   * @param email Trimmed lowercase legacy email.
   * @returns Member id and current handle, or null.
   * @throws Prisma errors when the lookup fails.
   */
  private async findByEmail(email: string): Promise<MemberLookupResult | null> {
    return this.resolveClient().member.findUnique({
      where: { email },
      select: { userId: true, handle: true },
    });
  }

  /**
   * Lazily creates the exported Members Prisma client.
   *
   * @returns Configured Members client.
   * @throws Error when `MEMBER_DB_URL` is missing.
   */
  private resolveClient(): MemberPrismaClient {
    if (this.client) {
      return this.client;
    }

    if (this.initialized) {
      throw new Error('MEMBER_DB_URL must be configured for Vanilla import.');
    }

    this.initialized = true;
    const databaseUrl = this.configService.get<string>('database.memberUrl');

    if (!databaseUrl) {
      throw new Error('MEMBER_DB_URL must be configured for Vanilla import.');
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
   * Normalizes the cache key for a legacy user id.
   *
   * @param legacyUserId Raw legacy user id.
   * @returns Trimmed id string.
   * @throws Does not throw.
   */
  private normalizeLegacyUserId(legacyUserId: string): string {
    return legacyUserId.trim();
  }

  /**
   * Normalizes a legacy handle for handle-first lookup.
   *
   * @param handle Raw legacy handle.
   * @returns Trimmed handle, or null.
   * @throws Does not throw.
   */
  private normalizeHandle(handle: string | null): string | null {
    const normalized = handle?.trim();
    return normalized ? normalized : null;
  }

  /**
   * Normalizes a legacy email for unique email fallback.
   *
   * @param email Raw legacy email.
   * @returns Lowercase email, or null.
   * @throws Does not throw.
   */
  private normalizeEmail(email: string | null): string | null {
    const normalized = email?.trim().toLowerCase();
    return normalized ? normalized : null;
  }

  /**
   * Normalizes the current Topcoder handle snapshot for forum persistence.
   *
   * @param handle Raw current handle from Members.
   * @returns Trimmed handle capped to the forum schema length.
   * @throws Does not throw.
   */
  private normalizeCurrentHandle(handle: string): string {
    return handle.trim().slice(0, 128);
  }
}
