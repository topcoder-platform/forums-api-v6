import { Injectable } from '@nestjs/common';
import { PostReactionType, Prisma } from '../../prisma/generated/client';
import { DbService } from '../db/db.service';

/**
 * Database row returned by forum topic summary read queries.
 *
 * Lock fields are direct Topic projections. `lockedBy` and `lockedAt` may be
 * null even when `locked` is true for imported legacy topics.
 */
export interface ForumsTopicSummaryRow {
  id: string;
  parentTopicId: string | null;
  challengeId: string | null;
  roleName: string | null;
  title: string;
  isAnnouncement: boolean;
  locked: boolean;
  lockedBy: string | null;
  lockedAt: Date | null;
  authorMemberId: string;
  authorHandle: string;
  createdAt: Date;
  updatedAt: Date;
  postsCount: number;
  viewsCount: number;
  watching: boolean;
  starterPostExcerpt: string | null;
  participantsCount: number;
  participants: ForumsTopicParticipantRow[];
  latestPostId: string | null;
  latestPostAuthorMemberId: string | null;
  latestPostAuthorHandle: string | null;
  latestActivityAt: Date | null;
  unread: boolean;
}

/**
 * Participant snapshot returned by topic-summary SQL aggregation.
 */
export interface ForumsTopicParticipantRow {
  memberId: string;
  handle: string;
}

/**
 * Database row returned by forum topic detail post queries.
 */
export interface ForumsPostTreeRow {
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
  deletedAt: Date | null;
  thumbsUpCount: number;
  thumbsDownCount: number;
  viewerReaction: PostReactionType | null;
}

/**
 * Topic-detail rows read from one database snapshot.
 */
export interface ForumsTopicDetailSnapshot {
  summaryRow: ForumsTopicSummaryRow;
  postRows: ForumsPostTreeRow[];
}

/**
 * Child-topic rows and parent liveness read from one database snapshot.
 */
export interface ForumsChildTopicSnapshot {
  parentActive: boolean;
  rows: ForumsTopicSummaryRow[];
}

type ForumsReadQueryClient = DbService | Prisma.TransactionClient;

/**
 * Raw-query reader for forum topic summaries and detail post rows.
 *
 * The service keeps read SQL localized and side-effect free. Authorization
 * remains outside this layer; callers fetch ordered candidates here and then
 * apply the shared forums access policy before paginating or returning data.
 */
@Injectable()
export class ForumsReadQueryService {
  /**
   * Creates a forums read query service.
   *
   * @param db Prisma-backed forums database service.
   * @throws Does not throw directly; dependencies are resolved by Nest.
   */
  constructor(private readonly db: DbService) {}

  /**
   * Fetches ordered root topic summaries for a challenge.
   *
   * @param challengeId Challenge id whose root topics should be returned.
   * @param memberId Authenticated member id used for unread derivation, or null.
   * @returns Ordered candidate topic summary rows.
   * @throws Prisma errors when the raw query fails.
   */
  findChallengeRootTopicSummaries(
    challengeId: string,
    memberId: string | null,
  ): Promise<ForumsTopicSummaryRow[]> {
    return this.findTopicSummaryRows(
      Prisma.sql`
        t."parentTopicId" IS NULL
        AND t."challengeId" = ${challengeId}
        AND t."deletedAt" IS NULL
      `,
      memberId,
    );
  }

  /**
   * Fetches ordered non-challenge root topic summaries.
   *
   * @param memberId Authenticated member id used for unread derivation, or null.
   * @returns Ordered candidate topic summary rows.
   * @throws Prisma errors when the raw query fails.
   */
  findGeneralRootTopicSummaries(
    memberId: string | null,
  ): Promise<ForumsTopicSummaryRow[]> {
    return this.findTopicSummaryRows(
      Prisma.sql`
        t."parentTopicId" IS NULL
        AND t."challengeId" IS NULL
        AND t."deletedAt" IS NULL
      `,
      memberId,
    );
  }

  /**
   * Fetches ordered direct child topic summaries for a parent topic.
   *
   * The query requires the parent topic and its ancestors to be active in the
   * same snapshot as the child rows so a hidden parent subtree is not returned.
   *
   * @param parentTopicId Parent topic id whose direct children should be returned.
   * @param memberId Authenticated member id used for unread derivation, or null.
   * @param client Optional transaction client used to bind this read to a snapshot.
   * @returns Ordered candidate child topic summary rows.
   * @throws Prisma errors when the raw query fails.
   */
  findChildTopicSummaries(
    parentTopicId: string,
    memberId: string | null,
    client?: Prisma.TransactionClient,
  ): Promise<ForumsTopicSummaryRow[]> {
    return this.findTopicSummaryRows(
      Prisma.sql`
        t."parentTopicId" = ${parentTopicId}
        AND t."deletedAt" IS NULL
        AND EXISTS (
          SELECT 1
          FROM "Topic" parent_topic
          WHERE parent_topic.id = ${parentTopicId}
            AND parent_topic."deletedAt" IS NULL
            AND NOT EXISTS (
              SELECT 1
              FROM "TopicClosure" parent_closure
              INNER JOIN "Topic" deleted_ancestor
                ON deleted_ancestor.id = parent_closure."ancestorTopicId"
              WHERE parent_closure."descendantTopicId" = parent_topic.id
                AND parent_closure."ancestorTopicId" <> parent_topic.id
                AND deleted_ancestor."deletedAt" IS NOT NULL
            )
        )
      `,
      memberId,
      client,
    );
  }

  /**
   * Fetches a topic summary row by topic id for detail header reuse.
   *
   * The row must be active, and no ancestor in its closure may be soft-deleted.
   *
   * @param topicId Topic id to summarize.
   * @param memberId Authenticated member id used for unread derivation, or null.
   * @param client Optional transaction client used to bind this read to a snapshot.
   * @returns Topic summary row, or null when the row is absent.
   * @throws Prisma errors when the raw query fails.
   */
  async findTopicSummaryById(
    topicId: string,
    memberId: string | null,
    client?: Prisma.TransactionClient,
  ): Promise<ForumsTopicSummaryRow | null> {
    const rows = await this.findTopicSummaryRows(
      Prisma.sql`
        t.id = ${topicId}
        AND t."deletedAt" IS NULL
        AND NOT EXISTS (
          SELECT 1
          FROM "TopicClosure" topic_closure
          INNER JOIN "Topic" deleted_ancestor
            ON deleted_ancestor.id = topic_closure."ancestorTopicId"
          WHERE topic_closure."descendantTopicId" = t.id
            AND topic_closure."ancestorTopicId" <> t.id
            AND deleted_ancestor."deletedAt" IS NOT NULL
        )
      `,
      memberId,
      client,
    );

    return rows[0] ?? null;
  }

  /**
   * Fetches all posts for a topic, including soft-deleted placeholders.
   *
   * @param topicId Topic id whose posts should be returned.
   * @param memberId Authenticated member id used to resolve viewer reaction state.
   * @param client Optional transaction client used to bind this read to a snapshot.
   * @returns Post rows with aggregate and viewer reactions, ordered for deterministic tree assembly.
   * @throws Prisma errors when the raw query fails.
   */
  findTopicPostRows(
    topicId: string,
    memberId: string | null,
    client: ForumsReadQueryClient = this.db,
  ): Promise<ForumsPostTreeRow[]> {
    return client.$queryRaw<ForumsPostTreeRow[]>(Prisma.sql`
      SELECT
        p.id,
        p."topicId",
        p."parentType",
        p."parentId",
        p."authorMemberId",
        p."authorHandle",
        CAST(
          COUNT(*) FILTER (WHERE p."deletedAt" IS NULL)
            OVER (PARTITION BY p."authorMemberId")
          AS integer
        ) AS "authorPostsCount",
        p.content,
        p."createdAt",
        p."updatedAt",
        p."deletedAt",
        reaction_stats."thumbsUpCount",
        reaction_stats."thumbsDownCount",
        reaction_stats."viewerReaction"
      FROM "Post" p
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) FILTER (
            WHERE post_reaction.reaction::text = 'THUMBS_UP'
          )::integer AS "thumbsUpCount",
          COUNT(*) FILTER (
            WHERE post_reaction.reaction::text = 'THUMBS_DOWN'
          )::integer AS "thumbsDownCount",
          MAX(post_reaction.reaction::text) FILTER (
            WHERE post_reaction."memberId" = CAST(${memberId} AS text)
          ) AS "viewerReaction"
        FROM "PostReaction" post_reaction
        WHERE post_reaction."postId" = p.id
      ) reaction_stats ON true
      WHERE p."topicId" = ${topicId}
      ORDER BY p."createdAt" ASC, p.id ASC
    `);
  }

  /**
   * Fetches child-topic rows and revalidates parent liveness in one snapshot.
   *
   * @param parentTopicId Parent topic id whose direct children should be returned.
   * @param memberId Authenticated member id used for unread derivation, or null.
   * @returns Snapshot result containing parent liveness and child rows.
   * @throws Prisma errors when the transaction or raw queries fail.
   */
  findChildTopicSnapshot(
    parentTopicId: string,
    memberId: string | null,
  ): Promise<ForumsChildTopicSnapshot> {
    return this.db.$transaction(
      async (tx) => {
        const rows = await this.findChildTopicSummaries(
          parentTopicId,
          memberId,
          tx,
        );
        const parentActive = await this.isTopicActive(parentTopicId, tx);

        return { parentActive, rows };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  /**
   * Fetches topic-detail summary and post rows in one consistent snapshot.
   *
   * @param topicId Topic id whose detail payload should be loaded.
   * @param memberId Authenticated member id used for unread derivation, or null.
   * @returns Summary and post rows, or null when the topic is absent or hidden.
   * @throws Prisma errors when the transaction or raw queries fail.
   */
  findTopicDetailSnapshot(
    topicId: string,
    memberId: string | null,
  ): Promise<ForumsTopicDetailSnapshot | null> {
    return this.db.$transaction(
      async (tx) => {
        const summaryRow = await this.findTopicSummaryById(
          topicId,
          memberId,
          tx,
        );

        if (!summaryRow) {
          return null;
        }

        const postRows = await this.findTopicPostRows(topicId, memberId, tx);

        return { summaryRow, postRows };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  /**
   * Fetches ordered topic summary rows using a caller-supplied safe WHERE clause.
   *
   * @param whereClause Parameterized SQL fragment limiting candidate topics.
   * @param memberId Authenticated member id used for unread derivation, or null.
   * @param client Optional transaction client used to bind this read to a snapshot.
   * @returns Ordered candidate topic summary rows with lock, read, watch, excerpt, view, and participant metadata.
   * @throws Prisma errors when the raw query fails.
   */
  private findTopicSummaryRows(
    whereClause: Prisma.Sql,
    memberId: string | null,
    client: ForumsReadQueryClient = this.db,
  ): Promise<ForumsTopicSummaryRow[]> {
    return client.$queryRaw<ForumsTopicSummaryRow[]>(Prisma.sql`
      SELECT
        t.id,
        t."parentTopicId",
        t."challengeId",
        t."roleName",
        t.title,
        t."isAnnouncement",
        t.locked,
        t."lockedByMemberId" AS "lockedBy",
        t."lockedAt",
        t."authorMemberId",
        t."authorHandle",
        t."createdAt",
        t."updatedAt",
        post_stats."postsCount",
        view_stats."viewsCount",
        watch_state."topicId" IS NOT NULL AS watching,
        starter."starterPostExcerpt",
        participant_stats."participantsCount",
        participant_snapshots.participants,
        latest."latestPostId",
        latest."latestPostAuthorMemberId",
        latest."latestPostAuthorHandle",
        latest."latestActivityAt",
        CASE
          WHEN CAST(${memberId} AS text) IS NULL THEN false
          WHEN latest."latestActivityAt" IS NULL THEN false
          WHEN read_state."lastReadAt" IS NULL THEN true
          ELSE read_state."lastReadAt" < latest."latestActivityAt"
        END AS unread
      FROM "Topic" t
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer AS "postsCount"
        FROM "Post" count_post
        WHERE count_post."topicId" = t.id
          AND count_post."deletedAt" IS NULL
      ) post_stats ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer AS "viewsCount"
        FROM "TopicReadState" topic_view
        WHERE topic_view."topicId" = t.id
      ) view_stats ON true
      LEFT JOIN "TopicWatch" watch_state
        ON watch_state."topicId" = t.id
        AND watch_state."memberId" = CAST(${memberId} AS text)
      LEFT JOIN LATERAL (
        SELECT LEFT(starter_post.content, 280) AS "starterPostExcerpt"
        FROM "Post" starter_post
        WHERE starter_post."topicId" = t.id
          AND starter_post."deletedAt" IS NULL
          AND starter_post.content IS NOT NULL
        ORDER BY starter_post."createdAt" ASC, starter_post.id ASC
        LIMIT 1
      ) starter ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(DISTINCT participant_post."authorMemberId")::integer
          AS "participantsCount"
        FROM "Post" participant_post
        WHERE participant_post."topicId" = t.id
          AND participant_post."deletedAt" IS NULL
      ) participant_stats ON true
      LEFT JOIN LATERAL (
        SELECT COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'memberId', participant."authorMemberId",
              'handle', participant."authorHandle"
            )
            ORDER BY participant."firstActivityAt"
          ),
          '[]'::jsonb
        ) AS participants
        FROM (
          SELECT
            participant_post."authorMemberId",
            (array_agg(
              participant_post."authorHandle"
              ORDER BY participant_post."createdAt" DESC, participant_post.id DESC
            ))[1] AS "authorHandle",
            MIN(participant_post."createdAt") AS "firstActivityAt"
          FROM "Post" participant_post
          WHERE participant_post."topicId" = t.id
            AND participant_post."deletedAt" IS NULL
          GROUP BY participant_post."authorMemberId"
          ORDER BY MIN(participant_post."createdAt") ASC
          LIMIT 5
        ) participant
      ) participant_snapshots ON true
      LEFT JOIN LATERAL (
        SELECT
          latest_post.id AS "latestPostId",
          latest_post."authorMemberId" AS "latestPostAuthorMemberId",
          latest_post."authorHandle" AS "latestPostAuthorHandle",
          latest_post."createdAt" AS "latestActivityAt"
        FROM "Post" latest_post
        WHERE latest_post."topicId" = t.id
          AND latest_post."deletedAt" IS NULL
        ORDER BY latest_post."createdAt" DESC, latest_post.id DESC
        LIMIT 1
      ) latest ON true
      LEFT JOIN "TopicReadState" read_state
        ON read_state."topicId" = t.id
        AND read_state."memberId" = CAST(${memberId} AS text)
      WHERE ${whereClause}
      ORDER BY
        t."isAnnouncement" DESC,
        latest."latestActivityAt" DESC NULLS LAST,
        t."createdAt" DESC,
        t.id ASC
    `);
  }

  /**
   * Determines whether a topic and all ancestors are active.
   *
   * @param topicId Topic id to test.
   * @param client Optional transaction client used to bind this read to a snapshot.
   * @returns True when the topic exists, is not deleted, and has no deleted ancestor.
   * @throws Prisma errors when the raw query fails.
   */
  private async isTopicActive(
    topicId: string,
    client: ForumsReadQueryClient = this.db,
  ): Promise<boolean> {
    const rows = await client.$queryRaw<{ active: boolean }[]>(Prisma.sql`
      SELECT EXISTS (
        SELECT 1
        FROM "Topic" active_topic
        WHERE active_topic.id = ${topicId}
          AND active_topic."deletedAt" IS NULL
          AND NOT EXISTS (
            SELECT 1
            FROM "TopicClosure" active_topic_closure
            INNER JOIN "Topic" deleted_ancestor
              ON deleted_ancestor.id = active_topic_closure."ancestorTopicId"
            WHERE active_topic_closure."descendantTopicId" = active_topic.id
              AND active_topic_closure."ancestorTopicId" <> active_topic.id
              AND deleted_ancestor."deletedAt" IS NOT NULL
          )
      ) AS active
    `);

    return rows[0]?.active ?? false;
  }
}
