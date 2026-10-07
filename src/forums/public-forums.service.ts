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
import { PublicForumsQueryService } from './public-forums-query.service';

/** Presents public categories and paginated threads using the existing topic/post engine.
 * Visibility is checked before search, watches, aggregate counts, and pagination.
 */
@Injectable()
export class PublicForumsService {
  /** @param catalog Bounded SQL catalog reads. @param db Forums database. @param reader Shared SQL summaries. @param reads Shared mapping/pagination.
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
    private readonly catalog: PublicForumsQueryService,
  ) {}

  /** Loads category cards using batched authorization and SQL subtree aggregates.
   * @param user Optional validated identity. @param ip Trusted request IP.
   * @returns Accessible categories with counts/activity derived only from visible descendants.
   * @throws ForbiddenException for bans; database errors propagate.
   */
  async categories(
    user?: JwtUser,
    ip?: string,
  ): Promise<PublicForumCategoryDto[]> {
    const principal = await this.principal(user, ip);
    const visible = await this.authorizedCategories(principal);
    if (!visible.length) return [];
    const ids = visible.map((category) => category.topicId);
    const [summaries, rollups] = await Promise.all([
      this.reader.findTopicSummaryRows(
        Prisma.sql`t.id IN (${Prisma.join(ids)}) AND t."deletedAt" IS NULL`,
        principal.memberId,
      ),
      this.catalog.categoryRollups(principal, ids),
    ]);
    const summaryById = new Map(summaries.map((row) => [row.id, row]));
    const rollupById = new Map(rollups.map((row) => [row.categoryId, row]));
    return visible.flatMap((category) => {
      const summary = summaryById.get(category.topicId);
      const rollup = rollupById.get(category.topicId);
      if (!summary || !rollup) return [];
      return [
        {
          ...this.reads.mapTopicSummary({ ...summary, ...rollup }),
          description: category.description,
          displayAs: category.displayAs,
          sortOrder: category.sortOrder,
          topicsCount: rollup.topicsCount,
          canCreate: category.canCreate,
        },
      ];
    });
  }

  /** Lists visible threads or explicit watches, authorizing before SQL pagination.
   * Only the selected page is enriched with posts, participants, and read state.
   * @param query Validated list inputs. @param user Optional identity. @param ip Trusted IP.
   * @returns Bounded summaries and visible matching totals.
   * @throws ForbiddenException for bans/inaccessible categories; database errors propagate.
   */
  async topics(
    query: PublicForumsQueryDto,
    user?: JwtUser,
    ip?: string,
  ): Promise<ForumsTopicSummaryPageDto> {
    const principal = await this.principal(user, ip);
    const categories = await this.authorizedCategories(principal);
    if (
      query.categoryId &&
      !categories.some((category) => category.topicId === query.categoryId)
    ) {
      throw new ForbiddenException('Category is unavailable.');
    }
    const ids = categories
      .filter(
        (category) =>
          !query.categoryId || category.topicId === query.categoryId,
      )
      .map((category) => category.topicId);
    const result = await this.catalog.topicPage(principal, ids, query);
    const summaries = result.ids.length
      ? await this.reader.findTopicSummaryRows(
          Prisma.sql`t.id IN (${Prisma.join(result.ids)}) AND t."deletedAt" IS NULL`,
          principal.memberId,
        )
      : [];
    const byId = new Map(summaries.map((row) => [row.id, row]));
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    return {
      data: result.ids.flatMap((id) => {
        const row = byId.get(id);
        return row ? [this.reads.mapTopicSummary(row)] : [];
      }),
      meta: {
        page,
        perPage,
        totalCount: result.totalCount,
        totalPages: Math.ceil(result.totalCount / perPage),
      },
    };
  }

  /** Loads listable category metadata and inherited policy decisions in batches.
   * This intentionally omits full-catalog counts and participant rollups for topic lists.
   * @param principal Reader checked for bans. @returns Authorized category metadata and create permission.
   * @throws Database or external policy errors; unavailable/missing categories are omitted.
   */
  private async authorizedCategories(principal: ForumsPrincipal) {
    const metadata = await this.db.publicForumCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        topicId: true,
        description: true,
        displayAs: true,
        sortOrder: true,
      },
    });
    const contexts = await this.contexts.loadTopicContexts(
      metadata.map((category) => category.topicId),
      principal,
    );
    const decisions = await this.policy.decideForTopics(principal, [
      ...contexts.values(),
    ]);
    const visible = metadata.flatMap((category) => {
      const decision = decisions.get(category.topicId);
      const context = contexts.get(category.topicId);
      return decision?.canView.allowed && context
        ? [
            {
              ...category,
              parentTopicId: context.topic.parentTopicId,
              canCreate: decision.canCreateChildTopic.allowed,
            },
          ]
        : [];
    });
    const parents = new Set(visible.map((category) => category.parentTopicId));
    return visible.filter(
      (category) =>
        category.displayAs !== 'Categories' || parents.has(category.topicId),
    );
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
