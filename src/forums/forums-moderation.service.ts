import { isIP } from 'net';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { IpBan, MemberBan, Prisma, Topic } from '../../prisma/generated/client';
import { JwtUser } from '../auth/jwt.service';
import { DbService } from '../db/db.service';
import {
  IpBanStateDto,
  MemberBanStateDto,
  TopicLockStateDto,
} from './dto/forums-moderation-response.dto';
import {
  buildForumsPrincipal,
  ForumsAccessDecision,
  ForumsPrincipal,
  ForumsTopicContext,
  normalizeForumsOptionalText,
} from './forums-access.types';
import { ForumsTopicContextService } from './forums-topic-context.service';
import { ResourceAccessService } from './resource-access.service';

const FORUMS_BAN_DENY_REASON = 'Forums access is restricted.';
const FORUMS_LOCK_DENY_REASON = 'Topic is locked.';
const PRISMA_UNIQUE_CONSTRAINT_CODE = 'P2002';
const MEMBER_BAN_ACTIVE_UNIQUE_INDEX = 'MemberBan_memberId_active_key';
const IP_BAN_ACTIVE_UNIQUE_INDEX = 'IpBan_ipAddress_active_key';

/**
 * Shared runtime moderation gate and management service for forum bans and
 * topic locks.
 *
 * Controllers pass only the authenticated actor and the trusted resolved client
 * IP into read and command services. This service keeps ban and lock checks
 * centralized above the raw query layer and returns the same decision contract
 * used by the forums access policy so service-level exception mapping remains
 * consistent. The moderation controller also uses this service to manage topic
 * lock state and active member/IP ban rows with audit metadata.
 */
@Injectable()
export class ForumsModerationService {
  /**
   * Creates a forums moderation service.
   *
   * @param db Prisma-backed forums database service.
   * @param resourceAccessService Adapter for challenge-copilot lock bypass facts.
   * @param topicContextService Loader for topic ancestry and deleted-ancestor state.
   * @throws Does not throw directly; dependencies are resolved by Nest.
   */
  constructor(
    private readonly db: DbService,
    private readonly resourceAccessService: ResourceAccessService,
    private readonly topicContextService: ForumsTopicContextService,
  ) {}

  /**
   * Locks an active topic for future discussion mutations.
   *
   * Moderation management intentionally bypasses visibility policy checks so
   * administrators and scoped M2M callers can manage otherwise hidden topics.
   * The topic must still exist and not be soft-deleted or hidden by a deleted
   * ancestor.
   *
   * @param topicId Topic id to lock.
   * @param user Authenticated moderator token payload used for audit metadata.
   * @returns Current topic lock state after the operation.
   * @throws UnauthorizedException when no authenticated moderator token is present.
   * @throws NotFoundException when the topic is missing, deleted, or hidden by a deleted ancestor.
   */
  async lockTopic(
    topicId: string,
    user: JwtUser | undefined,
  ): Promise<TopicLockStateDto> {
    const principal = this.requirePrincipal(user);
    const context = await this.topicContextService.loadTopicContext(
      topicId,
      principal,
    );

    this.assertManageableTopic(context);

    if (context.topic.locked) {
      return this.mapTopicLockState(context.topic);
    }

    const topic = await this.db.topic.update({
      where: { id: topicId },
      data: {
        locked: true,
        lockedAt: new Date(),
        lockedByMemberId: this.resolveAuditMemberId(user),
      },
    });

    return this.mapTopicLockState(topic);
  }

  /**
   * Unlocks an active topic for future discussion mutations.
   *
   * The topic must exist and not be soft-deleted or hidden by a deleted
   * ancestor. Unlocking an already unlocked topic is idempotent and returns the
   * current state without writing.
   *
   * @param topicId Topic id to unlock.
   * @param user Authenticated moderator token payload used for audit metadata.
   * @returns Current topic lock state after the operation.
   * @throws UnauthorizedException when no authenticated moderator token is present.
   * @throws NotFoundException when the topic is missing, deleted, or hidden by a deleted ancestor.
   */
  async unlockTopic(
    topicId: string,
    user: JwtUser | undefined,
  ): Promise<TopicLockStateDto> {
    const principal = this.requirePrincipal(user);
    const context = await this.topicContextService.loadTopicContext(
      topicId,
      principal,
    );

    this.assertManageableTopic(context);

    if (!context.topic.locked) {
      return this.mapTopicLockState(context.topic);
    }

    const topic = await this.db.topic.update({
      where: { id: topicId },
      data: {
        locked: false,
        lockedAt: null,
        lockedByMemberId: null,
      },
    });

    return this.mapTopicLockState(topic);
  }

  /**
   * Creates an active member ban when one does not already exist.
   *
   * The method pre-reads the active row for ordinary repeated PUT requests and
   * recovers active-row unique conflicts from concurrent duplicate creates by
   * re-reading the row created by the winning request. Human administrators
   * are captured in `createdByMemberId`; M2M moderation writes `null`.
   *
   * @param memberId Member id to ban.
   * @param user Authenticated moderator token payload used for audit metadata.
   * @returns Active member ban state after the operation.
   * @throws UnauthorizedException when no authenticated moderator token is present.
   * @throws BadRequestException when memberId is empty or too long.
   * @throws Prisma errors when persistence fails for reasons other than a concurrent active-row conflict.
   */
  async banMember(
    memberId: string,
    user: JwtUser | undefined,
  ): Promise<MemberBanStateDto> {
    this.requirePrincipal(user);
    const normalizedMemberId = this.normalizeMemberId(memberId);
    const activeBan = await this.findActiveMemberBan(normalizedMemberId);

    if (activeBan) {
      return this.mapMemberBanState(activeBan);
    }

    const ban = await this.db.memberBan
      .create({
        data: {
          memberId: normalizedMemberId,
          createdByMemberId: this.resolveAuditMemberId(user),
        },
      })
      .catch(async (error: unknown) => {
        if (
          this.isActiveBanUniqueConflict(
            error,
            MEMBER_BAN_ACTIVE_UNIQUE_INDEX,
            'memberId',
          )
        ) {
          const conflictingBan =
            await this.findActiveMemberBan(normalizedMemberId);

          if (conflictingBan) {
            return conflictingBan;
          }
        }

        throw error;
      });

    return this.mapMemberBanState(ban);
  }

  /**
   * Removes the active member ban for a member when present.
   *
   * The method pre-reads the active row and only persists a removal when a row
   * exists. If the member has only historical bans, the latest inactive state is
   * returned; if no ban row has ever existed, a not-found response is raised.
   *
   * @param memberId Member id to unban.
   * @param user Authenticated moderator token payload used for audit metadata.
   * @returns Member ban state after the operation.
   * @throws UnauthorizedException when no authenticated moderator token is present.
   * @throws BadRequestException when memberId is empty or too long.
   * @throws NotFoundException when the member has no ban row to report.
   */
  async unbanMember(
    memberId: string,
    user: JwtUser | undefined,
  ): Promise<MemberBanStateDto> {
    this.requirePrincipal(user);
    const normalizedMemberId = this.normalizeMemberId(memberId);
    const activeBan = await this.findActiveMemberBan(normalizedMemberId);

    if (activeBan) {
      const ban = await this.db.memberBan.update({
        where: { id: activeBan.id },
        data: {
          removedAt: new Date(),
          removedByMemberId: this.resolveAuditMemberId(user),
        },
      });

      return this.mapMemberBanState(ban);
    }

    const latestBan = await this.findLatestMemberBan(normalizedMemberId);

    if (latestBan) {
      return this.mapMemberBanState(latestBan);
    }

    throw new NotFoundException('Member ban not found.');
  }

  /**
   * Creates an active exact-IP ban when one does not already exist.
   *
   * The IP target must be a bare IPv4 or IPv6 host value. Proxy-style
   * bracket/port syntax, CIDR, wildcards, comma-delimited values, quotes, and
   * invalid text are rejected before the canonical host value is stored. If a
   * concurrent duplicate create wins the active-row unique race, the service
   * re-reads and returns that active row instead of surfacing the constraint.
   *
   * @param ipAddress Exact bare IPv4 or IPv6 host value to ban.
   * @param user Authenticated moderator token payload used for audit metadata.
   * @returns Active IP ban state after the operation.
   * @throws UnauthorizedException when no authenticated moderator token is present.
   * @throws BadRequestException when the IP target is not an exact bare host.
   * @throws Prisma errors when persistence fails for reasons other than a concurrent active-row conflict.
   */
  async banIpAddress(
    ipAddress: string,
    user: JwtUser | undefined,
  ): Promise<IpBanStateDto> {
    this.requirePrincipal(user);
    const normalizedIpAddress = await this.normalizeBareIpAddress(ipAddress);
    const activeBan = await this.findActiveIpBan(normalizedIpAddress);

    if (activeBan) {
      return this.mapIpBanState(activeBan);
    }

    const ban = await this.db.ipBan
      .create({
        data: {
          ipAddress: normalizedIpAddress,
          createdByMemberId: this.resolveAuditMemberId(user),
        },
      })
      .catch(async (error: unknown) => {
        if (
          this.isActiveBanUniqueConflict(
            error,
            IP_BAN_ACTIVE_UNIQUE_INDEX,
            'ipAddress',
          )
        ) {
          const conflictingBan =
            await this.findActiveIpBan(normalizedIpAddress);

          if (conflictingBan) {
            return conflictingBan;
          }
        }

        throw error;
      });

    return this.mapIpBanState(ban);
  }

  /**
   * Removes the active exact-IP ban for a host when present.
   *
   * The method pre-reads the active row and only persists a removal when a row
   * exists. If the IP has only historical bans, the latest inactive state is
   * returned; if no ban row has ever existed, a not-found response is raised.
   *
   * @param ipAddress Exact bare IPv4 or IPv6 host value to unban.
   * @param user Authenticated moderator token payload used for audit metadata.
   * @returns IP ban state after the operation.
   * @throws UnauthorizedException when no authenticated moderator token is present.
   * @throws BadRequestException when the IP target is not an exact bare host.
   * @throws NotFoundException when the IP has no ban row to report.
   */
  async unbanIpAddress(
    ipAddress: string,
    user: JwtUser | undefined,
  ): Promise<IpBanStateDto> {
    this.requirePrincipal(user);
    const normalizedIpAddress = await this.normalizeBareIpAddress(ipAddress);
    const activeBan = await this.findActiveIpBan(normalizedIpAddress);

    if (activeBan) {
      const ban = await this.db.ipBan.update({
        where: { id: activeBan.id },
        data: {
          removedAt: new Date(),
          removedByMemberId: this.resolveAuditMemberId(user),
        },
      });

      return this.mapIpBanState(ban);
    }

    const latestBan = await this.findLatestIpBan(normalizedIpAddress);

    if (latestBan) {
      return this.mapIpBanState(latestBan);
    }

    throw new NotFoundException('IP ban not found.');
  }

  /**
   * Evaluates request-actor member and trusted client-IP bans.
   *
   * @param principal Normalized forums principal for the acting request.
   * @param trustedClientIp Optional trusted forwarded client IP resolved at the HTTP boundary.
   * @returns Allow/deny decision for the acting request.
   * @throws Prisma errors when moderation rows cannot be queried.
   */
  async decideForRequestActorBan(
    principal: ForumsPrincipal,
    trustedClientIp: string | undefined,
  ): Promise<ForumsAccessDecision> {
    if (
      principal.memberId &&
      (await this.hasActiveMemberBan(principal.memberId))
    ) {
      return this.deny();
    }

    if (
      !principal.isMachine &&
      trustedClientIp &&
      (await this.hasActiveIpBan(trustedClientIp))
    ) {
      return this.deny();
    }

    return this.allow();
  }

  /**
   * Evaluates member-only bans for a target member.
   *
   * @param memberId Target member id for on-behalf commands or notifications.
   * @returns Allow/deny decision for the target member.
   * @throws Prisma errors when moderation rows cannot be queried.
   */
  async decideForTargetMemberBan(
    memberId: string,
  ): Promise<ForumsAccessDecision> {
    if (await this.hasActiveMemberBan(memberId)) {
      return this.deny();
    }

    return this.allow();
  }

  /**
   * Evaluates locked-topic mutation restrictions after normal policy allows.
   *
   * @param principal Normalized forums principal for the acting request.
   * @param context Loaded topic context for the affected topic.
   * @returns Allow/deny decision for a mutation against the topic.
   * @throws Prisma errors when challenge-copilot facts cannot be queried.
   */
  async decideForLockedTopicMutation(
    principal: ForumsPrincipal,
    context: ForumsTopicContext,
  ): Promise<ForumsAccessDecision> {
    if (!context.topic.locked) {
      return this.allow();
    }

    if (principal.isAdmin) {
      return this.allow();
    }

    if (
      !principal.isMachine &&
      principal.memberId &&
      context.effectiveChallengeId
    ) {
      const facts = await this.resourceAccessService.getResourceAccessFacts(
        context.effectiveChallengeId,
        principal.memberId,
      );

      if (facts.isChallengeCopilot) {
        return this.allow();
      }
    }

    return this.deny(FORUMS_LOCK_DENY_REASON);
  }

  /**
   * Checks whether a member has an active global forums ban.
   *
   * @param memberId Member id to check.
   * @returns True when an active ban row exists.
   * @throws Prisma errors when the query fails.
   */
  private async hasActiveMemberBan(memberId: string): Promise<boolean> {
    const ban = await this.db.memberBan.findFirst({
      where: {
        memberId,
        removedAt: null,
      },
      select: { id: true },
    });

    return Boolean(ban);
  }

  /**
   * Checks whether a trusted client IP has an active exact host ban.
   *
   * @param trustedClientIp Bare IPv4/IPv6 host resolved from trusted headers.
   * @returns True when an active IP ban row matches the canonical host string.
   * @throws Prisma errors when the raw query fails.
   */
  private async hasActiveIpBan(trustedClientIp: string): Promise<boolean> {
    const rows = await this.db.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT id
      FROM "IpBan"
      WHERE "removedAt" IS NULL
        AND "ipAddress" = host(${trustedClientIp}::inet)
      LIMIT 1
    `);

    return rows.length > 0;
  }

  /**
   * Builds the reusable forums principal required by topic context loading.
   *
   * @param user Authenticated token payload from request middleware.
   * @returns Normalized forums principal.
   * @throws UnauthorizedException when no authenticated token is present.
   */
  private requirePrincipal(user: JwtUser | undefined): ForumsPrincipal {
    const principal = buildForumsPrincipal(user);

    if (!principal) {
      throw new UnauthorizedException('Authenticated token required.');
    }

    return principal;
  }

  /**
   * Ensures a loaded topic can be managed by moderation endpoints.
   *
   * @param context Loaded topic context including deleted-ancestor state.
   * @returns Nothing when the topic can be managed.
   * @throws NotFoundException when the topic is deleted or hidden by a deleted ancestor.
   */
  private assertManageableTopic(context: ForumsTopicContext): void {
    if (context.topic.deletedAt || context.hasDeletedAncestor) {
      throw new NotFoundException('Topic not found.');
    }
  }

  /**
   * Normalizes the audit member id for moderation persistence.
   *
   * Human administrator tokens contribute their member id when present. M2M
   * tokens intentionally persist `null` audit member ids because no human
   * moderator acted directly.
   *
   * @param user Authenticated moderator token payload.
   * @returns Human member id for audit columns, or null for M2M/missing ids.
   * @throws Does not throw.
   */
  private resolveAuditMemberId(user: JwtUser | undefined): string | null {
    if (!user || user.isMachine) {
      return null;
    }

    return normalizeForumsOptionalText(user.userId) ?? null;
  }

  /**
   * Normalizes a member id path parameter.
   *
   * @param memberId Raw member id from the moderation route.
   * @returns Trimmed member id.
   * @throws BadRequestException when the value is empty or too long for storage.
   */
  private normalizeMemberId(memberId: string): string {
    const normalizedMemberId = normalizeForumsOptionalText(memberId);

    if (!normalizedMemberId || normalizedMemberId.length > 64) {
      throw new BadRequestException('memberId must be a non-empty value.');
    }

    return normalizedMemberId;
  }

  /**
   * Validates and canonicalizes a moderation IP-ban route parameter.
   *
   * The validation is intentionally stricter than trusted forwarded-header
   * parsing: only exact bare IPv4 or IPv6 literals are accepted. PostgreSQL
   * `inet` host formatting is used after validation to match the schema check
   * constraint and exact-match runtime enforcement.
   *
   * @param ipAddress Raw IP address from the moderation route.
   * @returns Canonical host string accepted by the `IpBan` schema.
   * @throws BadRequestException when the value is not an exact bare IP host.
   */
  private async normalizeBareIpAddress(ipAddress: string): Promise<string> {
    const normalizedIpAddress = ipAddress.trim();

    if (
      !normalizedIpAddress ||
      normalizedIpAddress !== ipAddress ||
      normalizedIpAddress.length > 45 ||
      /["',/*[\]\s]/.test(normalizedIpAddress) ||
      isIP(normalizedIpAddress) === 0
    ) {
      throw new BadRequestException(
        'ipAddress must be an exact bare IPv4 or IPv6 host value.',
      );
    }

    const rows = await this.db.$queryRaw<{ ipAddress: string }[]>(Prisma.sql`
      SELECT host(${normalizedIpAddress}::inet) AS "ipAddress"
    `);
    const canonicalIpAddress = rows[0]?.ipAddress;

    if (!canonicalIpAddress || isIP(canonicalIpAddress) === 0) {
      throw new BadRequestException(
        'ipAddress must be an exact bare IPv4 or IPv6 host value.',
      );
    }

    return canonicalIpAddress;
  }

  /**
   * Reads the active member ban row for a member.
   *
   * @param memberId Normalized member id.
   * @returns Active member ban row, or null when the member is not banned.
   * @throws Prisma errors when the query fails.
   */
  private findActiveMemberBan(memberId: string): Promise<MemberBan | null> {
    return this.db.memberBan.findFirst({
      where: {
        memberId,
        removedAt: null,
      },
    });
  }

  /**
   * Reads the latest member ban row for a member.
   *
   * @param memberId Normalized member id.
   * @returns Latest member ban row, or null when the member has never been banned.
   * @throws Prisma errors when the query fails.
   */
  private findLatestMemberBan(memberId: string): Promise<MemberBan | null> {
    return this.db.memberBan.findFirst({
      where: { memberId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  /**
   * Reads the active IP ban row for a canonical host value.
   *
   * @param ipAddress Canonical exact IPv4 or IPv6 host value.
   * @returns Active IP ban row, or null when the IP is not banned.
   * @throws Prisma errors when the query fails.
   */
  private findActiveIpBan(ipAddress: string): Promise<IpBan | null> {
    return this.db.ipBan.findFirst({
      where: {
        ipAddress,
        removedAt: null,
      },
    });
  }

  /**
   * Reads the latest IP ban row for a canonical host value.
   *
   * @param ipAddress Canonical exact IPv4 or IPv6 host value.
   * @returns Latest IP ban row, or null when the IP has never been banned.
   * @throws Prisma errors when the query fails.
   */
  private findLatestIpBan(ipAddress: string): Promise<IpBan | null> {
    return this.db.ipBan.findFirst({
      where: { ipAddress },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  /**
   * Detects Prisma unique errors raised by active ban partial indexes.
   *
   * Prisma can report database partial-index violations by index name, by the
   * indexed field list, or without target metadata depending on the engine
   * response. Missing target metadata is treated as recoverable because callers
   * re-read the active row and rethrow when no concurrent row exists.
   *
   * @param error Unknown create error raised by Prisma.
   * @param activeIndexName Database partial unique index that guards active rows.
   * @param indexedFieldName Prisma field covered by the active-row index.
   * @returns True when the error is a recoverable active-ban unique conflict.
   * @throws Does not throw.
   */
  private isActiveBanUniqueConflict(
    error: unknown,
    activeIndexName: string,
    indexedFieldName: string,
  ): error is Prisma.PrismaClientKnownRequestError {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
      return false;
    }

    const prismaError = error as Prisma.PrismaClientKnownRequestError;

    if (prismaError.code !== PRISMA_UNIQUE_CONSTRAINT_CODE) {
      return false;
    }

    const target = prismaError.meta?.target;

    if (Array.isArray(target)) {
      return target.some(
        (entry) =>
          typeof entry === 'string' &&
          (entry === indexedFieldName || entry.includes(activeIndexName)),
      );
    }

    if (typeof target === 'string') {
      return target === indexedFieldName || target.includes(activeIndexName);
    }

    const constraint = prismaError.meta?.constraint;

    if (typeof constraint === 'string') {
      return constraint.includes(activeIndexName);
    }

    return true;
  }

  /**
   * Maps a topic row into the public moderation lock response.
   *
   * @param topic Persisted topic row.
   * @returns Topic lock state DTO.
   * @throws Does not throw.
   */
  private mapTopicLockState(topic: Topic): TopicLockStateDto {
    return {
      topicId: topic.id,
      locked: topic.locked,
      lockedBy: topic.lockedByMemberId,
      lockedAt: topic.lockedAt,
      updatedAt: topic.updatedAt,
    };
  }

  /**
   * Maps a member ban row into the public moderation response.
   *
   * @param ban Persisted member ban row.
   * @returns Member ban state DTO.
   * @throws Does not throw.
   */
  private mapMemberBanState(ban: MemberBan): MemberBanStateDto {
    return {
      id: ban.id,
      memberId: ban.memberId,
      active: !ban.removedAt,
      createdAt: ban.createdAt,
      createdByMemberId: ban.createdByMemberId,
      removedAt: ban.removedAt,
      removedByMemberId: ban.removedByMemberId,
    };
  }

  /**
   * Maps an IP ban row into the public moderation response.
   *
   * @param ban Persisted IP ban row.
   * @returns IP ban state DTO.
   * @throws Does not throw.
   */
  private mapIpBanState(ban: IpBan): IpBanStateDto {
    return {
      id: ban.id,
      ipAddress: ban.ipAddress,
      active: !ban.removedAt,
      createdAt: ban.createdAt,
      createdByMemberId: ban.createdByMemberId,
      removedAt: ban.removedAt,
      removedByMemberId: ban.removedByMemberId,
    };
  }

  /**
   * Builds an allow decision.
   *
   * @returns A forums access decision that allows the action.
   * @throws Does not throw.
   */
  private allow(): ForumsAccessDecision {
    return { allowed: true };
  }

  /**
   * Builds a moderation denial decision.
   *
   * @param reason Optional denial reason, defaulting to a generic ban message.
   * @returns A forums access decision that denies the action with a 403-safe reason.
   * @throws Does not throw.
   */
  private deny(reason = FORUMS_BAN_DENY_REASON): ForumsAccessDecision {
    return { allowed: false, reason };
  }
}
