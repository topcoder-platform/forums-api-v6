import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtUser } from '../auth/jwt.service';
import { PostReactionType } from '../../prisma/generated/client';
import {
  ForumsPostTreeNodeDto,
  ForumsTopicDetailDto,
  ForumsTopicListQueryDto,
  ForumsTopicSummaryDto,
  ForumsTopicSummaryPageDto,
} from './dto/forums-read.dto';
import { ForumsAccessPolicyService } from './forums-access-policy.service';
import {
  buildForumsPrincipal,
  ForumsAccessDecision,
  ForumsPrincipal,
  ForumsRestrictionVisibilityTarget,
  ForumsTopicContext,
  normalizeForumRoleName,
  normalizeForumsOptionalText,
} from './forums-access.types';
import {
  ForumsPostTreeRow,
  ForumsReadQueryService,
  ForumsTopicSummaryRow,
} from './forums-read-query.service';
import { ForumsModerationService } from './forums-moderation.service';
import { ForumsTopicContextService } from './forums-topic-context.service';

const POST_PARENT_POST = 'POST';
const POST_PARENT_TOPIC = 'TOPIC';

/**
 * Internal post tree node carrying subtree sort metadata.
 */
interface ForumsPostTreeNodeInternal {
  id: string;
  topicId: string;
  parentType: string;
  parentId: string;
  authorMemberId: string;
  authorHandle: string;
  authorPostsCount: number;
  content: string | null;
  createdAt: Date;
  updatedAt: Date;
  deleted: boolean;
  thumbsUpCount: number;
  thumbsDownCount: number;
  viewerReaction: PostReactionType | null;
  replies: ForumsPostTreeNodeInternal[];
  subtreeLatestActivityAt: Date | null;
}

/**
 * Orchestrates forum read endpoints under the topics surface.
 *
 * The service normalizes authenticated callers, delegates restriction decisions
 * to the shared access policy, enforces shared runtime moderation before policy
 * or query work, uses raw-query rows only as read candidates, and applies
 * pagination after visibility filtering so counts match what the caller can
 * actually see.
 */
@Injectable()
export class ForumsReadService {
  /**
   * Creates a forums read service.
   *
   * @param accessPolicyService Shared forums policy service.
   * @param topicContextService Loader for effective topic restrictions.
   * @param readQueryService Side-effect-free raw-query reader.
   * @param moderationService Shared runtime ban and lock gate.
   * @throws Does not throw directly; dependencies are resolved by Nest.
   */
  constructor(
    private readonly accessPolicyService: ForumsAccessPolicyService,
    private readonly topicContextService: ForumsTopicContextService,
    private readonly readQueryService: ForumsReadQueryService,
    private readonly moderationService: ForumsModerationService,
  ) {}

  /**
   * Lists visible root topics for a challenge.
   *
   * The challenge restriction itself is authorized before rows are queried so
   * inaccessible challenges return the same NotFound/Forbidden contract as
   * command paths. Candidate rows are then filtered for narrower role
   * restrictions before pagination is applied.
   *
   * @param challengeId Challenge id supplied in the route.
   * @param query Pagination query parameters.
   * @param user Authenticated token payload for the read caller.
   * @param trustedClientIp Optional trusted client IP resolved at the HTTP boundary.
   * @returns Paginated visible challenge topic summaries.
   * @throws UnauthorizedException when no authenticated read caller is present.
   * @throws ForbiddenException when the caller is globally banned.
   * @throws ForbiddenException when base challenge visibility is denied.
   * @throws NotFoundException when challenge visibility reports a missing target.
   */
  async listChallengeRootTopics(
    challengeId: string,
    query: ForumsTopicListQueryDto,
    user: JwtUser | undefined,
    trustedClientIp?: string,
  ): Promise<ForumsTopicSummaryPageDto> {
    const principal = this.requirePrincipal(user);
    this.assertAllowed(
      await this.moderationService.decideForRequestActorBan(
        principal,
        trustedClientIp,
      ),
    );
    const normalizedChallengeId =
      normalizeForumsOptionalText(challengeId) ?? challengeId;

    this.assertAllowed(
      await this.accessPolicyService.decideForRestrictionVisibility(principal, {
        challengeId: normalizedChallengeId,
        roleName: null,
        hasRestrictionConflict: false,
      }),
    );

    const rows = await this.readQueryService.findChallengeRootTopicSummaries(
      normalizedChallengeId,
      principal.memberId,
    );
    const visibleRows = await this.filterVisibleRows(principal, rows, (row) =>
      this.resolveRootRowRestrictions(row),
    );

    return this.paginateRows(visibleRows, query);
  }

  /**
   * Lists visible non-challenge root topics.
   *
   * Public and role-restricted general roots are queried as ordered candidates,
   * filtered through the shared restriction policy, and paginated only after
   * filtering.
   *
   * @param query Pagination query parameters.
   * @param user Authenticated token payload for the read caller.
   * @param trustedClientIp Optional trusted client IP resolved at the HTTP boundary.
   * @returns Paginated visible general topic summaries.
   * @throws UnauthorizedException when no authenticated read caller is present.
   * @throws ForbiddenException when the caller is globally banned.
   */
  async listGeneralRootTopics(
    query: ForumsTopicListQueryDto,
    user: JwtUser | undefined,
    trustedClientIp?: string,
  ): Promise<ForumsTopicSummaryPageDto> {
    const principal = this.requirePrincipal(user);
    this.assertAllowed(
      await this.moderationService.decideForRequestActorBan(
        principal,
        trustedClientIp,
      ),
    );
    const rows = await this.readQueryService.findGeneralRootTopicSummaries(
      principal.memberId,
    );
    const visibleRows = await this.filterVisibleRows(principal, rows, (row) =>
      this.resolveRootRowRestrictions(row),
    );

    return this.paginateRows(visibleRows, query);
  }

  /**
   * Lists visible direct child topics for a parent topic.
   *
   * The parent topic must be viewable first. Each child row then receives
   * effective inherited restrictions from that parent context before narrower
   * child restrictions are filtered through the shared access policy. Parent
   * liveness and child summaries are re-read from one snapshot before return.
   *
   * @param topicId Parent topic id supplied in the route.
   * @param user Authenticated token payload for the read caller.
   * @param trustedClientIp Optional trusted client IP resolved at the HTTP boundary.
   * @returns Ordered child topic summaries visible to the caller.
   * @throws UnauthorizedException when no authenticated read caller is present.
   * @throws ForbiddenException when the caller is globally banned.
   * @throws ForbiddenException when parent topic visibility is denied.
   * @throws NotFoundException when the parent topic is missing or hidden.
   */
  async listChildTopics(
    topicId: string,
    user: JwtUser | undefined,
    trustedClientIp?: string,
  ): Promise<ForumsTopicSummaryDto[]> {
    const principal = this.requirePrincipal(user);
    this.assertAllowed(
      await this.moderationService.decideForRequestActorBan(
        principal,
        trustedClientIp,
      ),
    );
    const parentContext = await this.topicContextService.loadTopicContext(
      topicId,
      principal,
    );
    const parentDecisions = await this.accessPolicyService.decideForTopic(
      principal,
      parentContext,
    );

    this.assertAllowed(parentDecisions.canView);

    const childSnapshot = await this.readQueryService.findChildTopicSnapshot(
      topicId,
      principal.memberId,
    );

    if (!childSnapshot.parentActive) {
      throw new NotFoundException('Topic not found.');
    }

    const visibleRows = await this.filterVisibleRows(
      principal,
      childSnapshot.rows,
      (row) => this.resolveChildRowRestrictions(parentContext, row),
    );

    return visibleRows.map((row) => this.mapTopicSummary(row));
  }

  /**
   * Loads topic detail with an embedded post tree.
   *
   * Topic visibility is enforced with full topic context before summary and post
   * rows are fetched from one consistent snapshot. Embedded posts remain under
   * `read:forums-topics` and are returned as a nested thread containing deleted
   * placeholders.
   *
   * @param topicId Topic id supplied in the route.
   * @param user Authenticated token payload for the read caller.
   * @param trustedClientIp Optional trusted client IP resolved at the HTTP boundary.
   * @returns Topic summary and nested post tree.
   * @throws UnauthorizedException when no authenticated read caller is present.
   * @throws ForbiddenException when the caller is globally banned.
   * @throws ForbiddenException when topic visibility is denied.
   * @throws NotFoundException when the topic is missing or hidden.
   */
  async getTopicDetail(
    topicId: string,
    user: JwtUser | undefined,
    trustedClientIp?: string,
  ): Promise<ForumsTopicDetailDto> {
    const principal = this.requirePrincipal(user);
    this.assertAllowed(
      await this.moderationService.decideForRequestActorBan(
        principal,
        trustedClientIp,
      ),
    );
    const context = await this.topicContextService.loadTopicContext(
      topicId,
      principal,
    );
    const topicDecisions = await this.accessPolicyService.decideForTopic(
      principal,
      context,
    );

    this.assertAllowed(topicDecisions.canView);

    const detailSnapshot = await this.readQueryService.findTopicDetailSnapshot(
      topicId,
      principal.memberId,
    );

    if (!detailSnapshot) {
      throw new NotFoundException('Topic not found.');
    }

    return {
      topic: this.mapTopicSummary(detailSnapshot.summaryRow),
      posts: this.buildPostTree(topicId, detailSnapshot.postRows),
    };
  }

  /**
   * Builds the reusable forums principal required by policy checks.
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
   * Converts an access decision into the read-layer exception contract.
   *
   * @param decision Decision returned by the forums access policy.
   * @returns Nothing when the decision allows the action.
   * @throws NotFoundException when the policy hides a missing or deleted target.
   * @throws ForbiddenException when the target exists but the action is denied.
   */
  private assertAllowed(decision: ForumsAccessDecision): void {
    if (decision.allowed) {
      return;
    }

    const reason = decision.reason ?? 'Insufficient forums access.';

    if (reason.toLowerCase().includes('not found')) {
      throw new NotFoundException(reason);
    }

    throw new ForbiddenException(reason);
  }

  /**
   * Filters ordered topic rows through restriction-only access decisions.
   *
   * Restriction signatures are deduplicated before policy calls, then the
   * original row order is preserved when denied rows are removed.
   *
   * @param principal Forums principal for the current request.
   * @param rows Ordered topic candidate rows.
   * @param resolveRestrictions Function that resolves each row's effective restrictions.
   * @returns Candidate rows visible to the caller.
   * @throws Prisma errors when external policy fact lookups fail.
   */
  private async filterVisibleRows(
    principal: ForumsPrincipal,
    rows: readonly ForumsTopicSummaryRow[],
    resolveRestrictions: (
      row: ForumsTopicSummaryRow,
    ) => ForumsRestrictionVisibilityTarget,
  ): Promise<ForumsTopicSummaryRow[]> {
    const rowKeys = new Map<ForumsTopicSummaryRow, string>();
    const targetsByKey = new Map<string, ForumsRestrictionVisibilityTarget>();

    for (const row of rows) {
      const target = resolveRestrictions(row);
      const key = this.restrictionSignature(target);

      rowKeys.set(row, key);

      if (!targetsByKey.has(key)) {
        targetsByKey.set(key, target);
      }
    }

    const decisionEntries = await Promise.all(
      Array.from(targetsByKey.entries()).map(async ([key, target]) => {
        const decision =
          await this.accessPolicyService.decideForRestrictionVisibility(
            principal,
            target,
          );

        return [key, decision.allowed] as const;
      }),
    );
    const allowedByKey = new Map<string, boolean>(decisionEntries);

    return rows.filter(
      (row) => allowedByKey.get(rowKeys.get(row) ?? '') === true,
    );
  }

  /**
   * Resolves effective restriction input for a root topic row.
   *
   * @param row Topic summary row from a root list query.
   * @returns Restriction-only visibility target for policy filtering.
   * @throws Does not throw.
   */
  private resolveRootRowRestrictions(
    row: ForumsTopicSummaryRow,
  ): ForumsRestrictionVisibilityTarget {
    return {
      challengeId: normalizeForumsOptionalText(row.challengeId) ?? null,
      roleName: normalizeForumRoleName(row.roleName),
      hasRestrictionConflict: false,
    };
  }

  /**
   * Resolves inherited effective restrictions for a direct child topic row.
   *
   * @param parentContext Loaded and authorized parent topic context.
   * @param row Direct child topic summary row.
   * @returns Restriction-only visibility target for policy filtering.
   * @throws Does not throw.
   */
  private resolveChildRowRestrictions(
    parentContext: ForumsTopicContext,
    row: ForumsTopicSummaryRow,
  ): ForumsRestrictionVisibilityTarget {
    const directChallengeId =
      normalizeForumsOptionalText(row.challengeId) ?? null;
    const directRoleName = normalizeForumRoleName(row.roleName);

    return {
      challengeId: directChallengeId ?? parentContext.effectiveChallengeId,
      roleName: directRoleName ?? parentContext.effectiveRoleName,
      hasRestrictionConflict:
        parentContext.hasRestrictionConflict ||
        this.hasRestrictionConflict(
          parentContext.effectiveChallengeId,
          directChallengeId,
        ) ||
        this.hasRestrictionConflict(
          parentContext.effectiveRoleName,
          directRoleName,
        ),
    };
  }

  /**
   * Determines whether direct and inherited restrictions conflict.
   *
   * @param inheritedValue Effective restriction inherited from the parent chain.
   * @param directValue Direct restriction stored on the child topic.
   * @returns True when both values exist and differ.
   * @throws Does not throw.
   */
  private hasRestrictionConflict(
    inheritedValue: string | null,
    directValue: string | null,
  ): boolean {
    return Boolean(
      inheritedValue && directValue && inheritedValue !== directValue,
    );
  }

  /**
   * Creates a stable cache key for restriction-only policy decisions.
   *
   * @param target Restriction visibility target.
   * @returns String key representing challenge, role, and conflict state.
   * @throws Does not throw.
   */
  private restrictionSignature(
    target: ForumsRestrictionVisibilityTarget,
  ): string {
    return [
      target.challengeId ?? '',
      target.roleName ?? '',
      target.hasRestrictionConflict ? 'conflict' : 'consistent',
    ].join('|');
  }

  /**
   * Applies page metadata to already-authorized topic rows.
   *
   * @param rows Ordered visible topic rows.
   * @param query Pagination query values.
   * @returns Paginated response containing summary DTOs and metadata.
   * @throws Does not throw.
   */
  private paginateRows(
    rows: readonly ForumsTopicSummaryRow[],
    query: ForumsTopicListQueryDto,
  ): ForumsTopicSummaryPageDto {
    const rawPage = query.page ?? 1;
    const rawPerPage = query.perPage ?? 10;
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const perPage =
      Number.isFinite(rawPerPage) && rawPerPage > 0 ? rawPerPage : 10;
    const totalCount = rows.length;
    const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / perPage);
    const offset = (page - 1) * perPage;

    return {
      data: rows
        .slice(offset, offset + perPage)
        .map((row) => this.mapTopicSummary(row)),
      meta: {
        page,
        perPage,
        totalCount,
        totalPages,
      },
    };
  }

  /**
   * Maps a raw topic summary row into the public read DTO.
   *
   * @param row Raw topic summary row from the query service.
   * @returns Topic summary DTO.
   * @throws Does not throw.
   */
  private mapTopicSummary(row: ForumsTopicSummaryRow): ForumsTopicSummaryDto {
    return {
      id: row.id,
      parentTopicId: row.parentTopicId,
      challengeId: row.challengeId,
      roleName: row.roleName,
      title: row.title,
      isAnnouncement: row.isAnnouncement,
      locked: Boolean(row.locked),
      lockedBy: row.lockedBy,
      lockedAt: row.lockedAt,
      authorMemberId: row.authorMemberId,
      authorHandle: row.authorHandle,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      postsCount: Number(row.postsCount),
      viewsCount: Number(row.viewsCount),
      watching: Boolean(row.watching),
      starterPostExcerpt: row.starterPostExcerpt,
      participantsCount: Number(row.participantsCount),
      participants: Array.isArray(row.participants) ? row.participants : [],
      latestActivity:
        row.latestPostId &&
        row.latestPostAuthorMemberId &&
        row.latestPostAuthorHandle &&
        row.latestActivityAt
          ? {
              postId: row.latestPostId,
              authorMemberId: row.latestPostAuthorMemberId,
              authorHandle: row.latestPostAuthorHandle,
              createdAt: row.latestActivityAt,
            }
          : null,
      unread: Boolean(row.unread),
    };
  }

  /**
   * Assembles post rows into a newest-active embedded thread tree.
   *
   * Top-level `TOPIC` children and nested `POST` replies are preserved. Deleted
   * rows stay as placeholders with null content, and branch ordering is based on
   * each subtree's latest non-deleted post timestamp.
   *
   * @param topicId Topic id used to identify top-level post parentage.
   * @param rows Post rows returned by the detail query.
   * @returns Public post tree DTOs.
   * @throws Does not throw.
   */
  private buildPostTree(
    topicId: string,
    rows: readonly ForumsPostTreeRow[],
  ): ForumsPostTreeNodeDto[] {
    const nodesById = new Map<string, ForumsPostTreeNodeInternal>();
    const roots: ForumsPostTreeNodeInternal[] = [];

    for (const row of rows) {
      nodesById.set(row.id, this.mapPostNode(row));
    }

    for (const row of rows) {
      const node = nodesById.get(row.id);

      if (!node) {
        continue;
      }

      if (row.parentType === POST_PARENT_POST) {
        const parent = nodesById.get(row.parentId);

        if (parent) {
          parent.replies.push(node);
          continue;
        }
      }

      if (row.parentType === POST_PARENT_TOPIC && row.parentId === topicId) {
        roots.push(node);
        continue;
      }

      roots.push(node);
    }

    for (const root of roots) {
      this.refreshSubtreeLatestActivity(root);
    }

    roots.sort((left, right) => this.comparePostNodes(left, right));

    return roots.map((root) => this.toPostTreeDto(root));
  }

  /**
   * Maps a raw post row into an internal post tree node.
   *
   * @param row Raw post row from the detail query.
   * @returns Internal node with subtree sort metadata.
   * @throws Does not throw.
   */
  private mapPostNode(row: ForumsPostTreeRow): ForumsPostTreeNodeInternal {
    const deleted = Boolean(row.deletedAt);

    return {
      id: row.id,
      topicId: row.topicId,
      parentType: row.parentType,
      parentId: row.parentId,
      authorMemberId: row.authorMemberId,
      authorHandle: row.authorHandle,
      authorPostsCount: Number(row.authorPostsCount),
      content: deleted ? null : row.content,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deleted,
      thumbsUpCount: Number(row.thumbsUpCount),
      thumbsDownCount: Number(row.thumbsDownCount),
      viewerReaction: row.viewerReaction,
      replies: [],
      subtreeLatestActivityAt: deleted ? null : row.createdAt,
    };
  }

  /**
   * Computes subtree latest visible activity and sorts each reply list.
   *
   * @param node Internal post tree node to refresh.
   * @returns Latest non-deleted post timestamp for the subtree, or null.
   * @throws Does not throw.
   */
  private refreshSubtreeLatestActivity(
    node: ForumsPostTreeNodeInternal,
  ): Date | null {
    let latest = node.deleted ? null : node.createdAt;

    for (const reply of node.replies) {
      const replyLatest = this.refreshSubtreeLatestActivity(reply);

      if (
        replyLatest &&
        (!latest || replyLatest.getTime() > latest.getTime())
      ) {
        latest = replyLatest;
      }
    }

    node.subtreeLatestActivityAt = latest;
    node.replies.sort((left, right) => this.comparePostNodes(left, right));

    return latest;
  }

  /**
   * Compares post tree nodes by subtree activity and stable fallback fields.
   *
   * @param left First post tree node.
   * @param right Second post tree node.
   * @returns Negative when left should sort before right.
   * @throws Does not throw.
   */
  private comparePostNodes(
    left: ForumsPostTreeNodeInternal,
    right: ForumsPostTreeNodeInternal,
  ): number {
    const leftActivity = left.subtreeLatestActivityAt?.getTime() ?? -Infinity;
    const rightActivity = right.subtreeLatestActivityAt?.getTime() ?? -Infinity;

    if (leftActivity !== rightActivity) {
      return rightActivity - leftActivity;
    }

    const createdAtDifference =
      right.createdAt.getTime() - left.createdAt.getTime();

    return createdAtDifference !== 0
      ? createdAtDifference
      : left.id.localeCompare(right.id);
  }

  /**
   * Strips internal subtree sort metadata from a post node.
   *
   * @param node Internal post tree node.
   * @returns Public post tree DTO.
   * @throws Does not throw.
   */
  private toPostTreeDto(
    node: ForumsPostTreeNodeInternal,
  ): ForumsPostTreeNodeDto {
    return {
      id: node.id,
      topicId: node.topicId,
      parentType: node.parentType,
      parentId: node.parentId,
      authorMemberId: node.authorMemberId,
      authorHandle: node.authorHandle,
      authorPostsCount: node.authorPostsCount,
      content: node.content,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
      deleted: node.deleted,
      thumbsUpCount: node.thumbsUpCount,
      thumbsDownCount: node.thumbsDownCount,
      viewerReaction: node.viewerReaction,
      replies: node.replies.map((reply) => this.toPostTreeDto(reply)),
    };
  }
}
