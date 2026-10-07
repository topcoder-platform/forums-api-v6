import { Injectable } from '@nestjs/common';
import { Prisma } from '../../prisma/generated/client';
import { DbService } from '../db/db.service';
import { PublicForumsQueryDto } from './dto/public-forums.dto';
import { ForumsPrincipal } from './forums-access.types';
import { ForumsTopicSummaryRow } from './forums-read-query.service';

/** Bounded category aggregate returned by SQL; no thread or post arrays leave the database. */
export interface PublicCategoryRollup {
  categoryId: string;
  topicsCount: number;
  postsCount: number;
  participantsCount: number;
  participants: ForumsTopicSummaryRow['participants'];
  latestPostId: string | null;
  latestPostAuthorMemberId: string | null;
  latestPostAuthorHandle: string | null;
  latestActivityAt: Date | null;
  unread: boolean;
}

/** Executes public catalog aggregation and pagination after category authorization.
 * Callers supply only category IDs approved by the shared inherited access policy.
 * Personalized watches/read state are computed per request; no cross-user cache is used.
 */
@Injectable()
export class PublicForumsQueryService {
  /** @param db Forums database. @throws Never; supplied by Nest dependency injection. */
  constructor(private readonly db: DbService) {}

  /** Restricts non-category threads to authorized parents and applicable direct roles.
   * Parent restrictions have already been checked by the shared policy. Deleted ancestors
   * and challenge topics are excluded before counts, search, sorting, and pagination.
   * @param principal Reader. @param categoryIds Authorized category IDs (nonempty).
   * @returns Parameterized predicate for the Topic alias t. @throws Never.
   */
  private visibleThreads(
    principal: ForumsPrincipal,
    categoryIds: string[],
  ): Prisma.Sql {
    // The shared restriction policy requires a member ID before a human admin can bypass a role.
    const role =
      principal.isMachine || (principal.isAdmin && !!principal.memberId)
        ? Prisma.sql`true`
        : principal.memberId && principal.roles.length
          ? Prisma.sql`(t."roleName" IS NULL OR t."roleName" = '' OR t."roleName" IN (${Prisma.join([...principal.roles])}))`
          : Prisma.sql`(t."roleName" IS NULL OR t."roleName" = '')`;
    return Prisma.sql`
      t."parentTopicId" IN (${Prisma.join(categoryIds)})
      AND t."challengeId" IS NULL AND t."deletedAt" IS NULL AND ${role}
      AND NOT EXISTS (SELECT 1 FROM "forums"."PublicForumCategory" c WHERE c."topicId" = t.id)
      AND NOT EXISTS (
        SELECT 1 FROM "TopicClosure" c JOIN "Topic" a ON a.id = c."ancestorTopicId"
        WHERE c."descendantTopicId" = t.id AND a."deletedAt" IS NOT NULL
      )`;
  }

  /** Aggregates authorized descendants into one row per category entirely in PostgreSQL.
   * Counts, participant previews, activity and unread flags exclude inaccessible threads.
   * @param principal Reader. @param categoryIds Authorized category IDs.
   * @returns Category rollups (including empty categories) with at most five participants each.
   * @throws Prisma errors when aggregation fails.
   */
  async categoryRollups(
    principal: ForumsPrincipal,
    categoryIds: string[],
  ): Promise<PublicCategoryRollup[]> {
    if (!categoryIds.length) return [];
    // IDs use bytewise grouping/order; locale-aware text comparisons dominate
    // large catalog joins without changing which identifiers are equal.
    return this.db.$queryRaw<PublicCategoryRollup[]>(Prisma.sql`
      WITH visible_threads AS MATERIALIZED (
        SELECT t.id COLLATE "C" AS id, t."parentTopicId" COLLATE "C" AS "parentTopicId" FROM "Topic" t
        WHERE ${this.visibleThreads(principal, categoryIds)}
      ), thread_counts AS (
        SELECT "parentTopicId", COUNT(*)::integer AS "topicsCount"
        FROM visible_threads GROUP BY "parentTopicId"
      ), post_counts AS (
        SELECT t."parentTopicId", COUNT(p.id)::integer AS "postsCount",
          COALESCE(BOOL_OR(${principal.memberId}::text IS NOT NULL AND p.id IS NOT NULL
            AND (r."lastReadAt" IS NULL OR p."createdAt" > r."lastReadAt")), false) AS unread
        FROM visible_threads t
        LEFT JOIN "Post" p ON p."topicId" = t.id AND p."deletedAt" IS NULL
        LEFT JOIN "TopicReadState" r ON r."topicId" = t.id AND r."memberId" = ${principal.memberId}::text
        GROUP BY t."parentTopicId"
      ), totals AS (
        SELECT c."ancestorTopicId" COLLATE "C" AS "categoryId", SUM(t."topicsCount")::integer AS "topicsCount",
          SUM(p."postsCount")::integer AS "postsCount", BOOL_OR(p.unread) AS unread
        FROM thread_counts t JOIN post_counts p ON p."parentTopicId" = t."parentTopicId"
        JOIN "TopicClosure" c ON c."descendantTopicId" = t."parentTopicId"
        WHERE c."ancestorTopicId" IN (${Prisma.join(categoryIds)})
        GROUP BY c."ancestorTopicId"
      ), direct_authors AS MATERIALIZED (
        SELECT DISTINCT ON (t."parentTopicId", p."authorMemberId" COLLATE "C")
          t."parentTopicId", p."authorMemberId" COLLATE "C" AS "authorMemberId", p."authorHandle", p."createdAt", p.id COLLATE "C" AS id
        FROM visible_threads t JOIN "Post" p ON p."topicId" = t.id AND p."deletedAt" IS NULL
        ORDER BY t."parentTopicId", p."authorMemberId" COLLATE "C", p."createdAt" DESC, p.id COLLATE "C" DESC
      ), rollup_authors AS MATERIALIZED (
        SELECT c."ancestorTopicId" COLLATE "C" AS "categoryId", a.*
        FROM direct_authors a JOIN "TopicClosure" c ON c."descendantTopicId" = a."parentTopicId"
        WHERE c."ancestorTopicId" IN (${Prisma.join(categoryIds)})
      ), authors AS (
        SELECT DISTINCT ON ("categoryId", "authorMemberId") * FROM rollup_authors
        ORDER BY "categoryId", "authorMemberId", "createdAt" DESC, id DESC
      ), ranked_authors AS (
        SELECT *, ROW_NUMBER() OVER (
          PARTITION BY "categoryId" ORDER BY "createdAt" DESC, id DESC, "authorMemberId"
        ) AS rank FROM authors
      ), participants AS (
        SELECT "categoryId", COUNT(*)::integer AS "participantsCount",
          JSONB_AGG(JSONB_BUILD_OBJECT('memberId', "authorMemberId", 'handle', "authorHandle")
            ORDER BY rank) FILTER (WHERE rank <= 5) AS participants
        FROM ranked_authors GROUP BY "categoryId"
      ), latest AS (
        SELECT DISTINCT ON ("categoryId") "categoryId", id AS "latestPostId",
          "authorMemberId" AS "latestPostAuthorMemberId", "authorHandle" AS "latestPostAuthorHandle",
          "createdAt" AS "latestActivityAt"
        FROM rollup_authors ORDER BY "categoryId", "createdAt" DESC, id DESC
      )
      SELECT category."topicId" AS "categoryId",
        COALESCE(t."topicsCount", 0) AS "topicsCount", COALESCE(t."postsCount", 0) AS "postsCount",
        COALESCE(p."participantsCount", 0) AS "participantsCount", COALESCE(p.participants, '[]'::jsonb) AS participants,
        l."latestPostId", l."latestPostAuthorMemberId", l."latestPostAuthorHandle", l."latestActivityAt",
        COALESCE(t.unread, false) AS unread
      FROM "forums"."PublicForumCategory" category
      LEFT JOIN totals t ON t."categoryId" = category."topicId"
      LEFT JOIN participants p ON p."categoryId" = category."topicId"
      LEFT JOIN latest l ON l."categoryId" = category."topicId"
      WHERE category."topicId" IN (${Prisma.join(categoryIds)})
    `);
  }

  /** Selects and counts visible topic IDs before the caller loads expensive summary fields.
   * Watch and literal substring search filters run before SQL pagination. Category watches
   * are included only for the watching view, matching the existing public API contract.
   * @param principal Reader. @param categoryIds Authorized/listable categories.
   * @param query Validated search/watch/sort/page inputs.
   * @returns A bounded page of IDs and the total visible matching count, even beyond the last page.
   * @throws Prisma errors when the read fails.
   */
  async topicPage(
    principal: ForumsPrincipal,
    categoryIds: string[],
    query: PublicForumsQueryDto,
  ): Promise<{ ids: string[]; totalCount: number }> {
    if (
      !categoryIds.length ||
      (query.watching === 'true' && !principal.memberId)
    ) {
      return { ids: [], totalCount: 0 };
    }
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    // Preserve empty out-of-range pages even when the validated integer exceeds PostgreSQL bigint.
    const offset = Math.min(Number.MAX_SAFE_INTEGER, (page - 1) * perPage);
    const search = query.search?.trim().toLowerCase();
    const watching = query.watching === 'true';
    const candidates = watching
      ? Prisma.sql`((${this.visibleThreads(principal, categoryIds)}) OR t.id IN (${Prisma.join(categoryIds)}))`
      : this.visibleThreads(principal, categoryIds);
    const watchFilter = watching
      ? Prisma.sql`AND EXISTS (SELECT 1 FROM "TopicWatch" w WHERE w."topicId" = t.id AND w."memberId" = ${principal.memberId})`
      : Prisma.empty;
    const searchFilter = search
      ? Prisma.sql`AND (STRPOS(LOWER(t.title), ${search}) > 0 OR EXISTS (
          SELECT 1 FROM "Post" p WHERE p."topicId" = t.id AND p."deletedAt" IS NULL
            AND STRPOS(LOWER(p.content), ${search}) > 0))`
      : Prisma.empty;
    const order =
      query.sort === 'oldest'
        ? Prisma.sql`"createdAt" ASC, "isAnnouncement" DESC, "latestActivityAt" DESC NULLS LAST, id ASC`
        : query.sort === 'recent'
          ? Prisma.sql`"createdAt" DESC, "isAnnouncement" DESC, "latestActivityAt" DESC NULLS LAST, id ASC`
          : Prisma.sql`"isAnnouncement" DESC, "latestActivityAt" DESC NULLS LAST, "createdAt" DESC, id ASC`;
    const rows = await this.db.$queryRaw<
      { id: string | null; totalCount: number }[]
    >(Prisma.sql`
      WITH candidates AS MATERIALIZED (
        SELECT t.id, t."createdAt", t."isAnnouncement",
          (SELECT p."createdAt" FROM "Post" p WHERE p."topicId" = t.id AND p."deletedAt" IS NULL
            ORDER BY p."createdAt" DESC, p.id DESC LIMIT 1) AS "latestActivityAt"
        FROM "Topic" t WHERE (${candidates}) ${watchFilter} ${searchFilter}
      ), page AS (
        SELECT * FROM candidates ORDER BY ${order} LIMIT ${perPage} OFFSET ${offset}
      )
      SELECT page.id, totals."totalCount" FROM (SELECT COUNT(*)::integer AS "totalCount" FROM candidates) totals
      LEFT JOIN page ON true ORDER BY ${order}
    `);
    return {
      ids: rows.flatMap((row) => (row.id ? [row.id] : [])),
      totalCount: rows[0]?.totalCount ?? 0,
    };
  }
}
