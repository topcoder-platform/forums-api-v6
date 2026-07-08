import { isIP } from 'net';
import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../prisma/generated/client';
import { DbService } from '../../db/db.service';
import {
  ImportedTopicTarget,
  VanillaDiscussionRow,
  VanillaMatchedMember,
  VanillaMemberBanRow,
  VanillaReadStateRow,
  VanillaReplyRow,
  VanillaWatchRow,
} from './vanilla-import.types';

/**
 * Direct Prisma writer for the Vanilla import.
 *
 * The service writes only through `DbService` and intentionally bypasses
 * command services, controllers, notifications, and automatic author state
 * seeding. Each method performs one record- or discussion-scoped write so a
 * failure can be reported without wrapping the entire import in one transaction.
 */
@Injectable()
export class VanillaImportWriterService {
  /**
   * Creates the direct writer.
   *
   * @param db Prisma-backed forums database service.
   * @throws Does not throw directly; write methods surface Prisma errors.
   */
  constructor(private readonly db: DbService) {}

  /**
   * Imports a Vanilla discussion as a root topic, starter post, and self
   * closure row in one discussion-scoped transaction.
   *
   * @param discussion Normalized source discussion.
   * @param author Matched Topcoder author snapshot.
   * @returns Target topic id and starter post id.
   * @throws Prisma errors when any write in the transaction fails.
   */
  async importDiscussion(
    discussion: VanillaDiscussionRow,
    author: VanillaMatchedMember,
  ): Promise<ImportedTopicTarget> {
    return this.db.$transaction(async (tx) => {
      const topic = await tx.topic.create({
        data: {
          parentTopicId: null,
          challengeId: discussion.challengeId,
          roleName: null,
          title: discussion.title,
          isAnnouncement: discussion.isAnnouncement,
          locked: discussion.locked,
          lockedAt: null,
          lockedByMemberId: null,
          authorMemberId: author.memberId,
          authorHandle: author.handle,
          createdAt: discussion.createdAt,
          updatedAt: discussion.updatedAt,
        },
      });
      const starterPost = await tx.post.create({
        data: {
          topicId: topic.id,
          parentType: 'TOPIC',
          parentId: topic.id,
          authorMemberId: author.memberId,
          authorHandle: author.handle,
          content: discussion.body,
          createdAt: discussion.createdAt,
          updatedAt: discussion.updatedAt,
        },
      });

      await tx.topicClosure.create({
        data: {
          ancestorTopicId: topic.id,
          descendantTopicId: topic.id,
          depth: 0,
        },
      });

      return {
        topicId: topic.id,
        starterPostId: starterPost.id,
      };
    });
  }

  /**
   * Imports one Vanilla reply as a `Post` under either a topic or parent post.
   *
   * @param reply Normalized source reply.
   * @param topicId Target topic id.
   * @param parent Parent type and id for the target post.
   * @param author Matched Topcoder author snapshot.
   * @returns Created target post id.
   * @throws Prisma errors when post creation fails.
   */
  async importReply(
    reply: VanillaReplyRow,
    topicId: string,
    parent: { parentType: 'TOPIC' | 'POST'; parentId: string },
    author: VanillaMatchedMember,
  ): Promise<string> {
    const post = await this.db.post.create({
      data: {
        topicId,
        parentType: parent.parentType,
        parentId: parent.parentId,
        authorMemberId: author.memberId,
        authorHandle: author.handle,
        content: reply.body,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
      },
    });

    return post.id;
  }

  /**
   * Imports one source watch row after importer-level deduplication.
   *
   * @param watch Normalized source watch.
   * @param topicId Target topic id.
   * @param member Matched Topcoder member.
   * @returns Nothing.
   * @throws Prisma errors when the watch write fails.
   */
  async importWatch(
    watch: VanillaWatchRow,
    topicId: string,
    member: VanillaMatchedMember,
  ): Promise<void> {
    await this.db.topicWatch.create({
      data: {
        topicId,
        memberId: member.memberId,
        createdAt: watch.createdAt,
      },
    });
  }

  /**
   * Imports one collapsed source read-state row.
   *
   * @param readState Latest source read-state row for a topic/member pair.
   * @param topicId Target topic id.
   * @param member Matched Topcoder member.
   * @returns Nothing.
   * @throws Prisma errors when the read-state write fails.
   */
  async importReadState(
    readState: VanillaReadStateRow,
    topicId: string,
    member: VanillaMatchedMember,
  ): Promise<void> {
    await this.db.topicReadState.create({
      data: {
        topicId,
        memberId: member.memberId,
        lastReadAt: readState.readAt,
        updatedAt: readState.readAt,
      },
    });
  }

  /**
   * Imports one active member ban with null imported audit actor fields.
   *
   * @param ban Normalized source member ban.
   * @param member Matched banned member.
   * @returns Nothing.
   * @throws Prisma errors when the ban write fails.
   */
  async importMemberBan(
    ban: VanillaMemberBanRow,
    member: VanillaMatchedMember,
  ): Promise<void> {
    await this.db.memberBan.create({
      data: {
        memberId: member.memberId,
        createdAt: ban.createdAt,
        createdByMemberId: null,
        removedAt: null,
        removedByMemberId: null,
      },
    });
  }

  /**
   * Imports one active exact-IP ban with null imported audit actor fields.
   *
   * @param ipAddress Canonical exact bare host value.
   * @param createdAt Historical source creation timestamp.
   * @returns Nothing.
   * @throws Prisma errors when the ban write fails.
   */
  async importIpBan(ipAddress: string, createdAt: Date): Promise<void> {
    await this.db.ipBan.create({
      data: {
        ipAddress,
        createdAt,
        createdByMemberId: null,
        removedAt: null,
        removedByMemberId: null,
      },
    });
  }

  /**
   * Validates and canonicalizes an exact bare IPv4/IPv6 host value using the
   * same storage format as runtime moderation.
   *
   * @param ipAddress Raw legacy IP ban rule.
   * @returns Canonical PostgreSQL `host(inet)` representation.
   * @throws Error when the source rule is not an exact bare IP host.
   */
  async normalizeBareIpAddress(ipAddress: string): Promise<string> {
    const normalizedIpAddress = ipAddress.trim();

    if (
      !normalizedIpAddress ||
      normalizedIpAddress !== ipAddress ||
      normalizedIpAddress.length > 45 ||
      /["',/*[\]\s-]/.test(normalizedIpAddress) ||
      isIP(normalizedIpAddress) === 0
    ) {
      throw new Error('unsupported_non_exact_ip_rule');
    }

    const rows = await this.db.$queryRaw<{ ipAddress: string }[]>(Prisma.sql`
      SELECT host(${normalizedIpAddress}::inet) AS "ipAddress"
    `);
    const canonicalIpAddress = rows[0]?.ipAddress;

    if (!canonicalIpAddress || isIP(canonicalIpAddress) === 0) {
      throw new Error('unsupported_non_exact_ip_rule');
    }

    return canonicalIpAddress;
  }
}
