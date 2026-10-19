import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtUser } from '../auth/jwt.service';
import { DbService } from '../db/db.service';
import { buildForumsPrincipal } from './forums-access.types';
import { ForumsAccessPolicyService } from './forums-access-policy.service';
import { ForumsModerationService } from './forums-moderation.service';
import { ResourceAccessService } from './resource-access.service';

/** Current member's effective challenge-wide watch preference. */
export interface ChallengeForumWatchState {
  challengeId: string;
  memberId: string;
  watching: boolean;
}

/**
 * Resolves challenge-wide watches from resource assignments and persisted choices.
 * Registrants and copilots default to watching; explicit opt-outs survive later
 * reads and resource changes. Topic-specific watches remain independent.
 */
@Injectable()
export class ChallengeForumWatchService {
  /**
   * Wires persistence and the existing resource, visibility, and ban policies.
   * @param db Forums preference storage.
   * @param resourceAccessService Challenge assignment lookup.
   * @param accessPolicyService Shared challenge visibility policy.
   * @param moderationService Shared member and trusted-IP ban policy.
   * @throws Does not throw; Nest resolves dependencies.
   */
  constructor(
    private readonly db: DbService,
    private readonly resourceAccessService: ResourceAccessService,
    private readonly accessPolicyService: ForumsAccessPolicyService,
    private readonly moderationService: ForumsModerationService,
  ) {}

  /**
   * Reads or updates the authenticated member's forum-wide watch preference.
   * Works before the first topic exists and never accepts a target member id.
   * @param challengeId Challenge whose forum is watched.
   * @param user Validated human token.
   * @param trustedClientIp Trusted request IP for ban enforcement.
   * @param watching Explicit choice to persist, or undefined for a read.
   * @returns Effective watch state for this member and challenge.
   * @throws UnauthorizedException for missing or machine identities; ForbiddenException
   * for bans or denied challenge access; propagates database lookup/write errors.
   */
  async watchState(
    challengeId: string,
    user: JwtUser | undefined,
    trustedClientIp?: string,
    watching?: boolean,
  ): Promise<ChallengeForumWatchState> {
    const principal = buildForumsPrincipal(user);
    if (!principal?.memberId || principal.isMachine) {
      throw new UnauthorizedException('An authenticated member is required.');
    }
    const ban = await this.moderationService.decideForRequestActorBan(
      principal,
      trustedClientIp,
    );
    if (!ban.allowed) throw new ForbiddenException(ban.reason);
    const visibility =
      await this.accessPolicyService.decideForRestrictionVisibility(principal, {
        challengeId,
        roleName: null,
        hasRestrictionConflict: false,
      });
    if (!visibility.allowed) throw new ForbiddenException(visibility.reason);

    const memberId = principal.memberId;
    const where = { challengeId_memberId: { challengeId, memberId } };
    if (watching !== undefined) {
      await this.db.challengeForumWatch.upsert({
        where,
        create: { challengeId, memberId, watching },
        update: { watching },
      });
    } else {
      watching = await this.isWatching(challengeId, memberId);
    }
    return { challengeId, memberId, watching };
  }

  /**
   * Resolves a member's forum preference for already-authorized topic reads.
   * @param challengeId Effective challenge scope of the visible topics.
   * @param memberId Authenticated member whose inherited preference is needed.
   * @returns Saved forum preference, or the current resource-based default.
   * @throws Propagates preference database and resource lookup errors.
   */
  async isWatching(challengeId: string, memberId: string): Promise<boolean> {
    const preference = await this.db.challengeForumWatch.findUnique({
      where: { challengeId_memberId: { challengeId, memberId } },
    });
    return (
      preference?.watching ??
      (
        await this.resourceAccessService.getChallengeDefaultWatcherMemberIds(
          challengeId,
          memberId,
        )
      ).includes(memberId)
    );
  }

  /**
   * Resolves forum-wide notification candidates, applying explicit choices to defaults.
   * The notification publisher still enforces each topic's visibility and bans.
   * @param challengeId Effective challenge scope of the new topic or post.
   * @returns Deduplicated member ids whose challenge-wide watch is enabled.
   * @throws Propagates resource and preference database errors.
   */
  async getWatcherMemberIds(challengeId: string): Promise<string[]> {
    const [defaults, preferences] = await Promise.all([
      this.resourceAccessService.getChallengeDefaultWatcherMemberIds(
        challengeId,
      ),
      this.db.challengeForumWatch.findMany({ where: { challengeId } }),
    ]);
    const watchers = new Set(defaults);
    for (const preference of preferences) {
      if (preference.watching) watchers.add(preference.memberId);
      else watchers.delete(preference.memberId);
    }
    return [...watchers];
  }
}
