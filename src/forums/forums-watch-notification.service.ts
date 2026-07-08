import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Post, Topic } from '../../prisma/generated/client';
import { DbService } from '../db/db.service';
import { EventBusService } from './event-bus.service';
import { ForumsAccessPolicyService } from './forums-access-policy.service';
import {
  buildForumsMemberTargetPrincipal,
  ForumsRestrictionVisibilityTarget,
} from './forums-access.types';
import {
  ForumsMemberDirectoryService,
  ForumsNotificationMember,
} from './forums-member-directory.service';
import { ForumsModerationService } from './forums-moderation.service';
import { IdentityAccessService } from './identity-access.service';

const EMAIL_EVENT_TOPIC = 'external.action.email';
const RECIPIENT_AUTHORIZATION_CONCURRENCY = 10;

interface ForumsWatchNotificationEmailPayload {
  data: Record<string, string>;
  recipients: string[];
  sendgrid_template_id: string;
  version: 'v3';
}

/**
 * Parameters used to publish a watch notification for newly persisted content.
 */
export interface PublishForumsPostNotificationParams {
  topic: Topic;
  post: Post;
  restrictions: ForumsRestrictionVisibilityTarget;
  operationName: 'createPost' | 'createTopic';
}

/**
 * Publish outcome returned to the command boundary for diagnostic logging.
 */
export interface ForumsNotificationPublishResult {
  attemptedRecipientCount: number;
  published: boolean;
}

/**
 * Error raised when a notification publish reaches the bus and fails.
 */
export class ForumsNotificationPublishError extends Error {
  /**
   * Creates a notification publish error.
   *
   * @param message Human-readable failure reason.
   * @param attemptedRecipientCount Number of email recipients in the failed bus event.
   * @param cause Original publish failure.
   * @throws Does not throw.
   */
  constructor(
    message: string,
    readonly attemptedRecipientCount: number,
    cause: unknown,
  ) {
    super(message);
    this.name = ForumsNotificationPublishError.name;
    this.cause = cause;
  }
}

/**
 * Publishes post-commit forum watch notifications.
 *
 * The service resolves explicit watches on the created post's topic and all
 * ancestors, dedupes by member id, excludes the persisted author member id,
 * filters active member bans and remaining recipients through the shared forums
 * access policy, and publishes one SendGrid email event for the final recipient
 * list. IP-ban checks are intentionally excluded because notification delivery
 * is not bound to a trusted request client IP.
 */
@Injectable()
export class ForumsWatchNotificationService {
  private readonly logger = new Logger(ForumsWatchNotificationService.name);

  /**
   * Creates a forums watch notification publisher.
   *
   * @param db Prisma-backed forums database service.
   * @param memberDirectoryService Batch Members-domain lookup adapter.
   * @param identityAccessService Identity adapter used to build recipient principals.
   * @param accessPolicyService Shared forums access policy.
   * @param moderationService Shared runtime member-ban gate.
   * @param eventBusService Local event-bus adapter.
   * @param configService Nest configuration service containing notification settings.
   * @throws Does not throw directly; dependencies are resolved by Nest.
   */
  constructor(
    private readonly db: DbService,
    private readonly memberDirectoryService: ForumsMemberDirectoryService,
    private readonly identityAccessService: IdentityAccessService,
    private readonly accessPolicyService: ForumsAccessPolicyService,
    private readonly moderationService: ForumsModerationService,
    private readonly eventBusService: EventBusService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Resolves recipients and publishes the forum watch email event.
   *
   * @param params Persisted topic, post, restriction context, and operation name.
   * @returns Publish outcome with the attempted recipient count.
   * @throws ForumsNotificationPublishError when the final event bus publish fails.
   */
  async publishPostNotification(
    params: PublishForumsPostNotificationParams,
  ): Promise<ForumsNotificationPublishResult> {
    const templateId = this.configService.get<string>(
      'notifications.sendgridNotificationTemplate',
    );

    if (!templateId) {
      this.logger.warn(
        `${params.operationName} notification skipped for topic ${params.topic.id}, post ${params.post.id}: SENDGRID_NOTIFICATION_TEMPLATE is not configured.`,
      );
      return { attemptedRecipientCount: 0, published: false };
    }

    const watcherMemberIds = await this.resolveWatcherMemberIds(
      params.topic.id,
      params.post.authorMemberId,
    );

    if (watcherMemberIds.length === 0) {
      this.logger.debug(
        `${params.operationName} notification skipped for topic ${params.topic.id}, post ${params.post.id}: no eligible watchers.`,
      );
      return { attemptedRecipientCount: 0, published: false };
    }

    const memberRecords =
      await this.memberDirectoryService.getMembersByIds(watcherMemberIds);
    const membersById = new Map(
      memberRecords.map((member) => [member.memberId, member]),
    );
    const resolvableMembers = this.resolveMembersWithEmail(
      watcherMemberIds,
      membersById,
      params,
    );
    const recipientEmails = await this.resolveAuthorizedRecipientEmails(
      resolvableMembers,
      params,
    );

    if (recipientEmails.length === 0) {
      this.logger.debug(
        `${params.operationName} notification skipped for topic ${params.topic.id}, post ${params.post.id}: no authorized email recipients.`,
      );
      return { attemptedRecipientCount: 0, published: false };
    }

    const payload = this.buildEmailPayload(params, templateId, recipientEmails);

    try {
      await this.eventBusService.postEvent(EMAIL_EVENT_TOPIC, payload);
      this.logger.log(
        `Published '${EMAIL_EVENT_TOPIC}' (${params.operationName}) for topic ${params.topic.id}, post ${params.post.id} to ${recipientEmails.length} recipients.`,
      );
      return {
        attemptedRecipientCount: recipientEmails.length,
        published: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      throw new ForumsNotificationPublishError(
        `Forum watch notification publish failed: ${message}`,
        recipientEmails.length,
        error,
      );
    }
  }

  /**
   * Resolves watched members from topic and ancestor watch rows.
   *
   * @param topicId Topic id receiving the newly created post.
   * @param authorMemberId Persisted author member id to exclude.
   * @returns Deduped watcher member ids, excluding the author.
   * @throws Prisma errors when closure or watch rows cannot be loaded.
   */
  private async resolveWatcherMemberIds(
    topicId: string,
    authorMemberId: string,
  ): Promise<string[]> {
    const closureRows = await this.db.topicClosure.findMany({
      where: { descendantTopicId: topicId },
      select: { ancestorTopicId: true },
    });
    const watchedTopicIds = Array.from(
      new Set([
        topicId,
        ...closureRows.map((closure) => closure.ancestorTopicId),
      ]),
    );
    const watchRows = await this.db.topicWatch.findMany({
      where: {
        topicId: { in: watchedTopicIds },
        memberId: { not: authorMemberId },
      },
      select: { memberId: true },
    });

    return Array.from(new Set(watchRows.map((watch) => watch.memberId)));
  }

  /**
   * Filters directory records down to members with usable email addresses.
   *
   * @param watcherMemberIds Deduped watcher member ids from forum watches.
   * @param membersById Directory records keyed by member id.
   * @param params Current notification publish parameters for logging context.
   * @returns Members with non-empty email values.
   * @throws Does not throw.
   */
  private resolveMembersWithEmail(
    watcherMemberIds: readonly string[],
    membersById: ReadonlyMap<string, ForumsNotificationMember>,
    params: PublishForumsPostNotificationParams,
  ): ForumsNotificationMember[] {
    const members: ForumsNotificationMember[] = [];

    for (const memberId of watcherMemberIds) {
      const member = membersById.get(memberId);

      if (!member) {
        this.logger.warn(
          `${params.operationName} notification recipient skipped for topic ${params.topic.id}, post ${params.post.id}: member ${memberId} could not be resolved.`,
        );
        continue;
      }

      if (!member.email) {
        this.logger.warn(
          `${params.operationName} notification recipient skipped for topic ${params.topic.id}, post ${params.post.id}: member ${memberId} has no email.`,
        );
        continue;
      }

      members.push(member);
    }

    return members;
  }

  /**
   * Applies member-ban and shared forums access policy checks to recipients.
   *
   * @param members Candidate members with email addresses.
   * @param params Current notification publish parameters and restriction target.
   * @returns Deduped email addresses that may receive the notification.
   * @throws Does not throw for per-member authorization failures; failed members are logged and skipped.
   */
  private async resolveAuthorizedRecipientEmails(
    members: readonly ForumsNotificationMember[],
    params: PublishForumsPostNotificationParams,
  ): Promise<string[]> {
    const resolvedEmails = await this.mapWithBoundedConcurrency(
      members,
      RECIPIENT_AUTHORIZATION_CONCURRENCY,
      (member) => this.resolveAuthorizedRecipientEmail(member, params),
    );

    return Array.from(
      new Set(
        resolvedEmails.filter((email): email is string => Boolean(email)),
      ),
    );
  }

  /**
   * Evaluates a single candidate recipient against member bans, identity roles,
   * and forums policy.
   *
   * @param member Candidate member directory record.
   * @param params Current notification publish parameters and restriction target.
   * @returns The member email when authorized, otherwise `null`.
   * @throws Does not throw; identity and policy lookup failures are logged per member.
   */
  private async resolveAuthorizedRecipientEmail(
    member: ForumsNotificationMember,
    params: PublishForumsPostNotificationParams,
  ): Promise<string | null> {
    try {
      const moderationDecision =
        await this.moderationService.decideForTargetMemberBan(member.memberId);

      if (!moderationDecision.allowed) {
        this.logger.debug(
          `${params.operationName} notification recipient skipped for topic ${params.topic.id}, post ${params.post.id}: member ${member.memberId} is banned.`,
        );
        return null;
      }

      const roles = await this.identityAccessService.getMemberRoleNames(
        member.memberId,
      );
      const principal = buildForumsMemberTargetPrincipal(
        member.memberId,
        roles,
      );
      const decision =
        await this.accessPolicyService.decideForRestrictionVisibility(
          principal,
          params.restrictions,
        );

      if (!decision.allowed) {
        this.logger.debug(
          `${params.operationName} notification recipient skipped for topic ${params.topic.id}, post ${params.post.id}: member ${member.memberId} cannot view the topic.`,
        );
        return null;
      }

      return member.email;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';

      this.logger.warn(
        `${params.operationName} notification recipient skipped for topic ${params.topic.id}, post ${params.post.id}: member ${member.memberId} authorization lookup failed: ${message}`,
      );
      return null;
    }
  }

  /**
   * Maps items through an async callback while capping concurrent work.
   *
   * @param items Ordered input items to map.
   * @param concurrency Maximum number of callbacks allowed to run at once.
   * @param mapper Async mapper invoked for each item.
   * @returns Mapper results in the same order as the input items.
   * @throws Re-throws mapper errors; callers decide whether to catch per item.
   */
  private async mapWithBoundedConcurrency<T, R>(
    items: readonly T[],
    concurrency: number,
    mapper: (item: T, index: number) => Promise<R>,
  ): Promise<R[]> {
    const results = new Array<R>(items.length);
    const workerCount = Math.min(Math.max(concurrency, 1), items.length);
    let nextIndex = 0;

    await Promise.all(
      Array.from({ length: workerCount }, async () => {
        while (nextIndex < items.length) {
          const currentIndex = nextIndex;
          nextIndex += 1;
          results[currentIndex] = await mapper(
            items[currentIndex],
            currentIndex,
          );
        }
      }),
    );

    return results;
  }

  /**
   * Builds the SendGrid event payload from persisted topic and post rows.
   *
   * @param params Current notification publish parameters.
   * @param templateId Configured SendGrid template id.
   * @param recipients Final recipient email list.
   * @returns Event-bus email payload.
   * @throws Does not throw.
   */
  private buildEmailPayload(
    params: PublishForumsPostNotificationParams,
    templateId: string,
    recipients: string[],
  ): ForumsWatchNotificationEmailPayload {
    return {
      data: {
        ...(params.restrictions.challengeId
          ? { challengeId: params.restrictions.challengeId }
          : {}),
        topicId: params.topic.id,
        topicTitle: params.topic.title,
        postContent: params.post.content ?? '',
        authorHandle: params.post.authorHandle,
        createdAt: params.post.createdAt.toISOString(),
      },
      recipients,
      sendgrid_template_id: templateId,
      version: 'v3',
    };
  }
}
