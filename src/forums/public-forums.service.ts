import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '../../prisma/generated/client';
import { JwtUser } from '../auth/jwt.service';
import { DbService } from '../db/db.service';
import {
  PublicForumCategoryDto,
  PublicForumsQueryDto,
} from './dto/public-forums.dto';
import { ForumsTopicSummaryPageDto } from './dto/forums-read.dto';
import { buildForumsPrincipal, ForumsPrincipal } from './forums-access.types';
import { ForumsModerationService } from './forums-moderation.service';
import { ForumsReadQueryService } from './forums-read-query.service';
import { ForumsReadService } from './forums-read.service';
import { ForumsTopicContextService } from './forums-topic-context.service';
import { ForumsAccessPolicyService } from './forums-access-policy.service';

/** Presents public categories and paginated threads using the existing topic/post engine.
 * Visibility is checked before search, watches, aggregate counts, and pagination.
 */
@Injectable()
export class PublicForumsService {
  /** @param db Forums database. @param reader Shared SQL summaries. @param reads Shared mapping/pagination.
   * @param contexts Effective restrictions. @param policy Shared action policy. @param moderation Ban checks.
   * @throws Never; dependencies are supplied by Nest.
   */
  constructor(
    private readonly db: DbService,
    private readonly reader: ForumsReadQueryService,
    private readonly reads: ForumsReadService,
    private readonly contexts: ForumsTopicContextService,
    private readonly policy: ForumsAccessPolicyService,
    private readonly moderation: ForumsModerationService,
  ) {}

  /** Loads category cards in Vanilla order with visible subtree statistics.
   * @param user Optional validated identity. @param ip Trusted request IP.
   * @returns Accessible categories; private empty containers are omitted.
   * @throws ForbiddenException for bans; database errors propagate.
   */
  async categories(
    user?: JwtUser,
    ip?: string,
  ): Promise<PublicForumCategoryDto[]> {
    const principal = await this.principal(user, ip);
    const metadata = await this.db.publicForumCategory.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    const summaries = metadata.length
      ? await this.reader.findTopicSummaryRows(
          Prisma.sql`t.id IN (${Prisma.join(metadata.map((category) => category.topicId))}) AND t."deletedAt" IS NULL`,
          principal.memberId,
        )
      : [];
    const candidates = await Promise.all(
      metadata.map(async (category) => {
        const context = await this.contexts.loadTopicContext(
          category.topicId,
          principal,
        );
        const access = await this.policy.decideForTopic(principal, context);
        const summary = summaries.find((row) => row.id === category.topicId);
        if (!access.canView.allowed || !summary) return null;
        return {
          ...this.reads.mapTopicSummary(summary),
          description: category.description,
          displayAs: category.displayAs,
          sortOrder: category.sortOrder,
          topicsCount: 0,
          canCreate: access.canCreateChildTopic.allowed,
        };
      }),
    );
    const visible: PublicForumCategoryDto[] = candidates.filter(
      (category) => category !== null,
    );
    if (!visible.length) return [];
    const ids = visible.map((category) => category.id);
    const threads = await this.visibleThreads(principal, ids);
    const authors = threads.length
      ? await this.db.post.findMany({
          where: {
            topicId: { in: threads.map((thread) => thread.id) },
            deletedAt: null,
          },
          select: { topicId: true, authorMemberId: true, authorHandle: true },
          distinct: ['topicId', 'authorMemberId'],
        })
      : [];
    // Roll up only authorized rows; a private child must never affect public counts or avatars.
    for (const category of visible) {
      const descendantIds = new Set([category.id]);
      for (let changed = true; changed; ) {
        changed = false;
        for (const candidate of visible) {
          if (
            candidate.parentTopicId &&
            descendantIds.has(candidate.parentTopicId) &&
            !descendantIds.has(candidate.id)
          ) {
            descendantIds.add(candidate.id);
            changed = true;
          }
        }
      }
      const descendants = threads.filter(
        (thread) =>
          !!thread.parentTopicId && descendantIds.has(thread.parentTopicId),
      );
      category.topicsCount = descendants.length;
      category.postsCount = descendants.reduce(
        (sum, thread) => sum + thread.postsCount,
        0,
      );
      const threadIds = new Set(descendants.map((thread) => thread.id));
      const participants = new Map(
        authors
          .filter((author) => threadIds.has(author.topicId))
          .map((author) => [
            author.authorMemberId,
            { memberId: author.authorMemberId, handle: author.authorHandle },
          ]),
      );
      category.participants = [...participants.values()].slice(0, 5);
      category.participantsCount = participants.size;
      const newest = [...descendants].sort(
        (a, b) =>
          (b.latestActivityAt?.getTime() ?? 0) -
          (a.latestActivityAt?.getTime() ?? 0),
      )[0];
      category.latestActivity = newest
        ? this.reads.mapTopicSummary(newest).latestActivity
        : null;
      category.unread = descendants.some((thread) => thread.unread);
    }
    return visible.filter(
      (category) =>
        category.displayAs !== 'Categories' ||
        visible.some((child) => child.parentTopicId === category.id),
    );
  }

  /** Lists visible threads, or explicitly watched categories and threads.
   * @param query Validated search, category, sort, watch and page inputs.
   * @param user Optional validated identity. @param ip Trusted request IP.
   * @returns Page whose totals disclose only authorized content.
   * @throws ForbiddenException for bans or inaccessible categories; database failures propagate.
   */
  async topics(
    query: PublicForumsQueryDto,
    user?: JwtUser,
    ip?: string,
  ): Promise<ForumsTopicSummaryPageDto> {
    const principal = await this.principal(user, ip);
    const categories = await this.categories(user, ip);
    if (
      query.categoryId &&
      !categories.some((category) => category.id === query.categoryId)
    ) {
      throw new ForbiddenException('Category is unavailable.');
    }
    const ids = categories
      .filter(
        (category) => !query.categoryId || category.id === query.categoryId,
      )
      .map((category) => category.id);
    if (!ids.length) return this.reads.paginateRows([], query);
    let rows = await this.visibleThreads(principal, ids);
    if (query.watching === 'true') {
      const categoryRows = await this.reader.findTopicSummaryRows(
        Prisma.sql`t.id IN (${Prisma.join(ids)}) AND t."deletedAt" IS NULL`,
        principal.memberId,
      );
      rows = [...rows, ...categoryRows].filter((row) => row.watching);
    }
    const search = query.search?.trim().toLowerCase();
    if (search && rows.length) {
      const matches = await this.db.post.findMany({
        where: {
          topicId: { in: rows.map((row) => row.id) },
          deletedAt: null,
          content: { contains: search, mode: 'insensitive' },
        },
        select: { topicId: true },
        distinct: ['topicId'],
      });
      const matchingIds = new Set(matches.map((post) => post.topicId));
      rows = rows.filter(
        (row) =>
          row.title.toLowerCase().includes(search) || matchingIds.has(row.id),
      );
    }
    if (query.sort === 'oldest' || query.sort === 'recent') {
      rows.sort(
        (a, b) =>
          (a.createdAt.getTime() - b.createdAt.getTime()) *
          (query.sort === 'oldest' ? 1 : -1),
      );
    }
    return this.reads.paginateRows(rows, query);
  }

  /** Reads thread candidates only beneath visible categories, then checks narrower topic restrictions.
   * @param principal Reader identity. @param categoryIds Authorized category IDs.
   * @returns Authorized summaries ordered by latest activity. @throws Database failures.
   */
  private async visibleThreads(
    principal: ForumsPrincipal,
    categoryIds: string[],
  ) {
    const rows = await this.reader.findTopicSummaryRows(
      Prisma.sql`
      t."parentTopicId" IN (${Prisma.join(categoryIds)}) AND t."challengeId" IS NULL AND t."deletedAt" IS NULL
      AND NOT EXISTS (SELECT 1 FROM "forums"."PublicForumCategory" category WHERE category."topicId" = t.id)
      AND NOT EXISTS (SELECT 1 FROM "TopicClosure" c JOIN "Topic" a ON a.id = c."ancestorTopicId"
        WHERE c."descendantTopicId" = t.id AND a."deletedAt" IS NOT NULL)`,
      principal.memberId,
    );
    // The parent ACL was evaluated above. The only additional restrictions a thread can add are role/challenge values.
    return this.reads.filterVisibleRows(principal, rows, (row) => ({
      challengeId: row.challengeId,
      roleName: row.roleName,
      hasRestrictionConflict: false,
    }));
  }

  /** Builds an anonymous/validated reader and enforces member/IP bans before querying content.
   * @param user Optional JWT. @param ip Trusted IP. @returns Principal. @throws ForbiddenException for bans.
   */
  private async principal(
    user?: JwtUser,
    ip?: string,
  ): Promise<ForumsPrincipal> {
    const principal = buildForumsPrincipal(user) ?? {
      memberId: null,
      roles: [],
      scopes: [],
      isAdmin: false,
      isMachine: false,
    };
    const access = await this.moderation.decideForRequestActorBan(
      principal,
      ip,
    );
    if (!access.allowed) throw new ForbiddenException(access.reason);
    return principal;
  }
}
