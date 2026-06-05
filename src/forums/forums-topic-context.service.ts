import { Injectable, NotFoundException } from '@nestjs/common';
import { Topic } from '../../prisma/generated/client';
import { DbService } from '../db/db.service';
import {
  ForumsPostContext,
  ForumsPrincipal,
  ForumsTopicContext,
  normalizeForumRoleName,
  normalizeForumsOptionalText,
} from './forums-access.types';

/**
 * Loads topic and post authorization context from the forums database.
 *
 * The service is the single command-side reader for effective topic
 * restrictions. It resolves ancestor rows, inherited challenge and role
 * restrictions, author ownership, and deleted-ancestor state before policy
 * checks are evaluated.
 */
@Injectable()
export class ForumsTopicContextService {
  /**
   * Creates a topic context service.
   *
   * @param db Prisma-backed forums database service.
   * @throws Does not throw directly; dependencies are resolved by Nest.
   */
  constructor(private readonly db: DbService) {}

  /**
   * Loads context for a topic target.
   *
   * @param topicId Topic id to resolve.
   * @param principal Forums principal used to compute ownership flags.
   * @returns Topic context with inherited restrictions and deleted-ancestor state.
   * @throws NotFoundException when the topic row does not exist.
   */
  async loadTopicContext(
    topicId: string,
    principal: ForumsPrincipal,
  ): Promise<ForumsTopicContext> {
    const topic = await this.db.topic.findUnique({ where: { id: topicId } });

    if (!topic) {
      throw new NotFoundException('Topic not found.');
    }

    return this.buildTopicContext(topic, principal);
  }

  /**
   * Loads context for a post target.
   *
   * @param postId Post id to resolve.
   * @param principal Forums principal used to compute ownership flags.
   * @returns Post context with the owning topic's inherited restrictions.
   * @throws NotFoundException when the post row does not exist.
   */
  async loadPostContext(
    postId: string,
    principal: ForumsPrincipal,
  ): Promise<ForumsPostContext> {
    const post = await this.db.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    const topic = await this.db.topic.findUnique({
      where: { id: post.topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found.');
    }

    const topicContext = await this.buildTopicContext(topic, principal);

    return {
      ...topicContext,
      post,
      isPostAuthor: this.isMemberAuthor(post.authorMemberId, principal),
    };
  }

  /**
   * Builds topic context from a loaded topic row.
   *
   * @param topic Topic row to enrich with closure-derived context.
   * @param principal Forums principal used to compute ownership flags.
   * @returns Topic context used by the access policy.
   * @throws Does not throw directly; Prisma errors propagate from closure loading.
   */
  private async buildTopicContext(
    topic: Topic,
    principal: ForumsPrincipal,
  ): Promise<ForumsTopicContext> {
    const closureRows = await this.db.topicClosure.findMany({
      where: { descendantTopicId: topic.id },
      include: { ancestorTopic: true },
      orderBy: { depth: 'asc' },
    });
    const ancestors = closureRows.length
      ? closureRows.map((closure) => closure.ancestorTopic)
      : [topic];
    const ancestorTopics = ancestors.filter(
      (ancestor) => ancestor.id !== topic.id,
    );
    const effectiveChallengeId = this.resolveEffectiveChallengeId(ancestors);
    const effectiveRoleName = this.resolveEffectiveRoleName(ancestors);

    return {
      topic,
      ancestors,
      effectiveChallengeId,
      effectiveRoleName,
      ancestorChallengeId: this.resolveEffectiveChallengeId(ancestorTopics),
      ancestorRoleName: this.resolveEffectiveRoleName(ancestorTopics),
      hasDeletedAncestor: ancestorTopics.some((ancestor) =>
        Boolean(ancestor.deletedAt),
      ),
      hasRestrictionConflict:
        this.hasRestrictionConflict(
          ancestors.map((ancestor) =>
            normalizeForumsOptionalText(ancestor.challengeId),
          ),
        ) ||
        this.hasRestrictionConflict(
          ancestors.map((ancestor) =>
            normalizeForumRoleName(ancestor.roleName),
          ),
        ),
      isTopicAuthor: this.isMemberAuthor(topic.authorMemberId, principal),
    };
  }

  /**
   * Resolves the nearest effective challenge restriction from a topic chain.
   *
   * @param topics Topic chain ordered from target topic to root ancestor.
   * @returns Effective challenge id, or `null` for general topics.
   * @throws Does not throw.
   */
  private resolveEffectiveChallengeId(topics: readonly Topic[]): string | null {
    return (
      topics
        .map((topic) => normalizeForumsOptionalText(topic.challengeId))
        .find((challengeId): challengeId is string => Boolean(challengeId)) ??
      null
    );
  }

  /**
   * Resolves the nearest effective role restriction from a topic chain.
   *
   * @param topics Topic chain ordered from target topic to root ancestor.
   * @returns Effective normalized role name, or `null` for unrestricted topics.
   * @throws Does not throw.
   */
  private resolveEffectiveRoleName(topics: readonly Topic[]): string | null {
    return (
      topics
        .map((topic) => normalizeForumRoleName(topic.roleName))
        .find((roleName): roleName is string => Boolean(roleName)) ?? null
    );
  }

  /**
   * Determines whether a chain contains conflicting non-null restrictions.
   *
   * @param values Restriction values collected from the target and ancestors.
   * @returns `true` when more than one distinct non-null value appears.
   * @throws Does not throw.
   */
  private hasRestrictionConflict(
    values: readonly (string | null | undefined)[],
  ): boolean {
    return (
      new Set(values.filter((value): value is string => Boolean(value))).size >
      1
    );
  }

  /**
   * Compares a persisted author member id against the acting principal.
   *
   * @param authorMemberId Member id stored on the target row.
   * @param principal Forums principal for the current command.
   * @returns `true` when the principal owns the row.
   * @throws Does not throw.
   */
  private isMemberAuthor(
    authorMemberId: string,
    principal: ForumsPrincipal,
  ): boolean {
    return Boolean(principal.memberId && authorMemberId === principal.memberId);
  }
}
