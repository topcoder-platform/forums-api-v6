import { Injectable } from '@nestjs/common';
import { RowDataPacket } from 'mysql2/promise';
import {
  VanillaDiscussionRow,
  VanillaIpBanRow,
  VanillaLegacyActor,
  VanillaMemberBanRow,
  VanillaReadStateRow,
  VanillaReplyRow,
  VanillaWatchRow,
} from './vanilla-import.types';
import { VanillaMysqlService } from './vanilla-mysql.service';

const DEFAULT_BATCH_SIZE = 500;

interface DiscussionPacket extends RowDataPacket {
  discussionId: number | string;
  challengeId: number | string | null;
  title: string | null;
  body: string | null;
  isAnnouncement: number | boolean | null;
  locked: number | boolean | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
  legacyUserId: number | string | null;
  handle: string | null;
  email: string | null;
}

interface ReplyPacket extends RowDataPacket {
  replyId: number | string;
  discussionId: number | string;
  parentReplyId: number | string | null;
  body: string | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
  legacyUserId: number | string | null;
  handle: string | null;
  email: string | null;
}

interface WatchPacket extends RowDataPacket {
  discussionId: number | string;
  createdAt: Date | string | null;
  legacyUserId: number | string | null;
  handle: string | null;
  email: string | null;
}

interface ReadStatePacket extends RowDataPacket {
  discussionId: number | string;
  readAt: Date | string | null;
  legacyUserId: number | string | null;
  handle: string | null;
  email: string | null;
}

interface MemberBanPacket extends RowDataPacket {
  banId: number | string;
  createdAt: Date | string | null;
  legacyUserId: number | string | null;
  handle: string | null;
  email: string | null;
}

interface IpBanPacket extends RowDataPacket {
  banId: number | string;
  ipAddress: string;
  createdAt: Date | string | null;
}

/**
 * Bounded Vanilla source reader for the importer stages.
 *
 * The reader projects only the source columns required by the import contract:
 * legacy row ids, discussion/post content fields, timestamps, challenge linkage
 * from legacy discussion/category/group metadata, state values, and minimal user
 * lookup fields for member mapping.
 */
@Injectable()
export class VanillaSourceReaderService {
  /**
   * Creates a source reader backed by the importer-only MySQL service.
   *
   * @param mysqlService Lazy Vanilla MySQL query service.
   * @throws Does not throw directly; query methods surface MySQL errors.
   */
  constructor(private readonly mysqlService: VanillaMysqlService) {}

  /**
   * Iterates Vanilla discussions deterministically without loading all rows.
   * Challenge ids are recovered from explicit `ForeignID`, Vanilla group
   * `ChallengeID`, or the challenge category URL code used by the legacy
   * challenge forum creator.
   *
   * @param batchSize Maximum rows read per MySQL round trip.
   * @returns Async generator of normalized discussion rows.
   * @throws MySQL query errors when the source read fails.
   */
  async *readDiscussions(
    batchSize = DEFAULT_BATCH_SIZE,
  ): AsyncGenerator<VanillaDiscussionRow> {
    let lastDiscussionId = '0';

    for (;;) {
      const rows = await this.mysqlService.query<DiscussionPacket[]>(
        `
          SELECT
            d.DiscussionID AS discussionId,
            COALESCE(
              NULLIF(CAST(d.ForeignID AS CHAR), ''),
              NULLIF(CAST(g.ChallengeID AS CHAR), ''),
              CASE
                WHEN c.UrlCode REGEXP '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
                  THEN CAST(c.UrlCode AS CHAR)
                WHEN pc.UrlCode REGEXP '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
                  THEN CAST(pc.UrlCode AS CHAR)
                ELSE NULL
              END
            ) AS challengeId,
            d.Name AS title,
            d.Body AS body,
            COALESCE(d.Announce, 0) AS isAnnouncement,
            COALESCE(d.Closed, 0) AS locked,
            d.DateInserted AS createdAt,
            COALESCE(d.DateUpdated, d.DateInserted) AS updatedAt,
            d.InsertUserID AS legacyUserId,
            u.Name AS handle,
            u.Email AS email
          FROM GDN_Discussion d
          LEFT JOIN GDN_Category c ON c.CategoryID = d.CategoryID
          LEFT JOIN GDN_Category pc ON pc.CategoryID = c.ParentCategoryID
          LEFT JOIN GDN_Group g
            ON g.GroupID = COALESCE(
              NULLIF(d.GroupID, 0),
              NULLIF(c.GroupID, 0),
              NULLIF(pc.GroupID, 0)
            )
          LEFT JOIN GDN_User u ON u.UserID = d.InsertUserID
          WHERE d.DiscussionID > ?
          ORDER BY d.DiscussionID ASC
          LIMIT ?
        `,
        [lastDiscussionId, batchSize],
      );

      if (rows.length === 0) {
        break;
      }

      for (const row of rows) {
        lastDiscussionId = this.normalizeId(row.discussionId);
        yield {
          discussionId: lastDiscussionId,
          challengeId: this.normalizeNullableString(row.challengeId),
          title: this.normalizeTitle(row.title, lastDiscussionId),
          body: row.body,
          isAnnouncement: this.normalizeBoolean(row.isAnnouncement),
          locked: this.normalizeBoolean(row.locked),
          createdAt: this.normalizeDate(row.createdAt),
          updatedAt: this.normalizeDate(row.updatedAt),
          actor: this.normalizeActor(row),
        };
      }
    }
  }

  /**
   * Reads all replies for one discussion so the importer can build its branch
   * graph before writing child posts.
   *
   * @param discussionId Legacy discussion id whose comments should be loaded.
   * @returns Normalized reply rows ordered for deterministic graph traversal.
   * @throws MySQL query errors when the source read fails.
   */
  async readRepliesForDiscussion(
    discussionId: string,
  ): Promise<VanillaReplyRow[]> {
    const rows = await this.mysqlService.query<ReplyPacket[]>(
      `
        SELECT
          c.CommentID AS replyId,
          c.DiscussionID AS discussionId,
          c.ParentCommentID AS parentReplyId,
          c.Body AS body,
          c.DateInserted AS createdAt,
          COALESCE(c.DateUpdated, c.DateInserted) AS updatedAt,
          c.InsertUserID AS legacyUserId,
          u.Name AS handle,
          u.Email AS email
        FROM GDN_Comment c
        LEFT JOIN GDN_User u ON u.UserID = c.InsertUserID
        WHERE c.DiscussionID = ?
        ORDER BY COALESCE(c.ParentCommentID, 0), c.DateInserted, c.CommentID
      `,
      [discussionId],
    );

    return rows.map((row) => ({
      replyId: this.normalizeId(row.replyId),
      discussionId: this.normalizeId(row.discussionId),
      parentReplyId: this.normalizeNullableString(row.parentReplyId),
      body: row.body,
      createdAt: this.normalizeDate(row.createdAt),
      updatedAt: this.normalizeDate(row.updatedAt),
      actor: this.normalizeActor(row),
    }));
  }

  /**
   * Iterates source discussion watches in deterministic batches.
   *
   * @param batchSize Maximum rows read per MySQL round trip.
   * @returns Async generator of normalized watch rows.
   * @throws MySQL query errors when the source read fails.
   */
  async *readWatches(
    batchSize = DEFAULT_BATCH_SIZE,
  ): AsyncGenerator<VanillaWatchRow> {
    let lastDiscussionId = '0';
    let lastUserId = '0';

    for (;;) {
      const rows = await this.mysqlService.query<WatchPacket[]>(
        `
          SELECT
            ud.DiscussionID AS discussionId,
            COALESCE(ud.DateLastViewed, NOW()) AS createdAt,
            ud.UserID AS legacyUserId,
            u.Name AS handle,
            u.Email AS email
          FROM GDN_UserDiscussion ud
          LEFT JOIN GDN_User u ON u.UserID = ud.UserID
          WHERE COALESCE(ud.Bookmarked, 0) <> 0
            AND (
              ud.DiscussionID > ?
              OR (ud.DiscussionID = ? AND ud.UserID > ?)
            )
          ORDER BY ud.DiscussionID ASC, ud.UserID ASC
          LIMIT ?
        `,
        [lastDiscussionId, lastDiscussionId, lastUserId, batchSize],
      );

      if (rows.length === 0) {
        break;
      }

      for (const row of rows) {
        lastDiscussionId = this.normalizeId(row.discussionId);
        lastUserId = this.normalizeId(row.legacyUserId);
        yield {
          discussionId: lastDiscussionId,
          createdAt: this.normalizeDate(row.createdAt),
          actor: this.normalizeActor(row),
        };
      }
    }
  }

  /**
   * Iterates source read-state rows in deterministic batches.
   *
   * @param batchSize Maximum rows read per MySQL round trip.
   * @returns Async generator of normalized read-state rows.
   * @throws MySQL query errors when the source read fails.
   */
  async *readReadStates(
    batchSize = DEFAULT_BATCH_SIZE,
  ): AsyncGenerator<VanillaReadStateRow> {
    let lastDiscussionId = '0';
    let lastUserId = '0';

    for (;;) {
      const rows = await this.mysqlService.query<ReadStatePacket[]>(
        `
          SELECT
            ud.DiscussionID AS discussionId,
            ud.DateLastViewed AS readAt,
            ud.UserID AS legacyUserId,
            u.Name AS handle,
            u.Email AS email
          FROM GDN_UserDiscussion ud
          LEFT JOIN GDN_User u ON u.UserID = ud.UserID
          WHERE ud.DateLastViewed IS NOT NULL
            AND (
              ud.DiscussionID > ?
              OR (ud.DiscussionID = ? AND ud.UserID > ?)
            )
          ORDER BY ud.DiscussionID ASC, ud.UserID ASC, ud.DateLastViewed ASC
          LIMIT ?
        `,
        [lastDiscussionId, lastDiscussionId, lastUserId, batchSize],
      );

      if (rows.length === 0) {
        break;
      }

      for (const row of rows) {
        lastDiscussionId = this.normalizeId(row.discussionId);
        lastUserId = this.normalizeId(row.legacyUserId);
        yield {
          discussionId: lastDiscussionId,
          readAt: this.normalizeDate(row.readAt),
          actor: this.normalizeActor(row),
        };
      }
    }
  }

  /**
   * Iterates active member bans in deterministic batches.
   *
   * @param batchSize Maximum rows read per MySQL round trip.
   * @returns Async generator of normalized member-ban rows.
   * @throws MySQL query errors when the source read fails.
   */
  async *readMemberBans(
    batchSize = DEFAULT_BATCH_SIZE,
  ): AsyncGenerator<VanillaMemberBanRow> {
    let lastUserId = '0';

    for (;;) {
      const rows = await this.mysqlService.query<MemberBanPacket[]>(
        `
          SELECT
            u.UserID AS banId,
            COALESCE(u.DateUpdated, u.DateInserted, NOW()) AS createdAt,
            u.UserID AS legacyUserId,
            u.Name AS handle,
            u.Email AS email
          FROM GDN_User u
          WHERE COALESCE(u.Banned, 0) <> 0
            AND u.UserID > ?
          ORDER BY u.UserID ASC
          LIMIT ?
        `,
        [lastUserId, batchSize],
      );

      if (rows.length === 0) {
        break;
      }

      for (const row of rows) {
        lastUserId = this.normalizeId(row.legacyUserId);
        yield {
          banId: this.normalizeId(row.banId),
          createdAt: this.normalizeDate(row.createdAt),
          actor: this.normalizeActor(row),
        };
      }
    }
  }

  /**
   * Iterates IP ban rules in deterministic batches.
   *
   * Vanilla's ban table does not expose a portable active flag, so matching ban
   * rows are treated as active by presence and later filtered to exact host
   * rules by the writer.
   *
   * @param batchSize Maximum rows read per MySQL round trip.
   * @returns Async generator of normalized IP-ban rows.
   * @throws MySQL query errors when the source read fails.
   */
  async *readIpBans(
    batchSize = DEFAULT_BATCH_SIZE,
  ): AsyncGenerator<VanillaIpBanRow> {
    let lastBanId = '0';

    for (;;) {
      const rows = await this.mysqlService.query<IpBanPacket[]>(
        `
          SELECT
            b.BanID AS banId,
            b.BanValue AS ipAddress,
            COALESCE(b.DateInserted, NOW()) AS createdAt
          FROM GDN_Ban b
          WHERE b.BanID > ?
            AND LOWER(b.BanType) IN ('ip', 'ipaddress', 'ip_address')
          ORDER BY b.BanID ASC
          LIMIT ?
        `,
        [lastBanId, batchSize],
      );

      if (rows.length === 0) {
        break;
      }

      for (const row of rows) {
        lastBanId = this.normalizeId(row.banId);
        yield {
          banId: lastBanId,
          ipAddress: row.ipAddress,
          createdAt: this.normalizeDate(row.createdAt),
        };
      }
    }
  }

  /**
   * Normalizes the minimal actor projection shared by source reads.
   *
   * @param row MySQL row containing user columns.
   * @returns Legacy actor DTO.
   * @throws Does not throw.
   */
  private normalizeActor(row: {
    legacyUserId: number | string | null;
    handle: string | null;
    email: string | null;
  }): VanillaLegacyActor {
    return {
      legacyUserId: this.normalizeNullableString(row.legacyUserId) ?? '',
      handle: this.normalizeNullableString(row.handle),
      email: this.normalizeNullableString(row.email),
    };
  }

  /**
   * Normalizes an arbitrary source id into a stable report key.
   *
   * @param value Raw source id.
   * @returns String id.
   * @throws Does not throw.
   */
  private normalizeId(value: number | string | null): string {
    return this.normalizeNullableString(value) ?? '';
  }

  /**
   * Normalizes nullable MySQL scalar text.
   *
   * @param value Raw MySQL value.
   * @returns Trimmed non-empty text, or null.
   * @throws Does not throw.
   */
  private normalizeNullableString(
    value: number | string | null | undefined,
  ): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const normalized = String(value).trim();
    return normalized ? normalized : null;
  }

  /**
   * Normalizes source discussion titles while keeping a stable fallback.
   *
   * @param title Raw discussion title.
   * @param discussionId Legacy discussion id used in the fallback.
   * @returns Title capped to the forums schema length.
   * @throws Does not throw.
   */
  private normalizeTitle(title: string | null, discussionId: string): string {
    const normalized = title?.trim();
    return (normalized || `Imported Vanilla discussion ${discussionId}`).slice(
      0,
      255,
    );
  }

  /**
   * Normalizes common Vanilla boolean scalar encodings.
   *
   * @param value Raw boolean-like value.
   * @returns Boolean value.
   * @throws Does not throw.
   */
  private normalizeBoolean(value: number | boolean | null): boolean {
    return value === true || value === 1;
  }

  /**
   * Normalizes MySQL date values, falling back to the current time only when
   * the source field is missing.
   *
   * @param value Raw MySQL date value.
   * @returns Date instance for persistence.
   * @throws Does not throw.
   */
  private normalizeDate(value: Date | string | null): Date {
    if (value instanceof Date) {
      return value;
    }

    if (value) {
      const parsed = new Date(value);

      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return new Date();
  }
}
