import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtUser } from '../auth/jwt.service';
import { DbService } from '../db/db.service';
import {
  Post,
  Prisma,
  Topic,
  TopicReadState,
  TopicWatch,
} from '../../prisma/generated/client';
import {
  CreatePostDto,
  CreateTopicDto,
  MemberTargetDto,
  UpdatePostDto,
  UpdateTopicDto,
} from './dto/forums-command.dto';
import {
  buildForumsMemberTargetPrincipal,
  buildForumsPrincipal,
  ForumsAccessDecision,
  ForumsEffectiveRestrictions,
  ForumsMemberTargetPrincipal,
  ForumsPrincipal,
  ForumsRestrictionVisibilityTarget,
  normalizeForumRoleName,
  normalizeForumsOptionalText,
  resolveMonotonicRoleNameUpdate,
  resolveMonotonicTopicRestrictions,
} from './forums-access.types';
import { ForumsAccessPolicyService } from './forums-access-policy.service';
import { ForumsMemberDirectoryService } from './forums-member-directory.service';
import { ForumsTopicContextService } from './forums-topic-context.service';
import {
  ForumsNotificationPublishError,
  ForumsWatchNotificationService,
} from './forums-watch-notification.service';
import { IdentityAccessService } from './identity-access.service';
import { MemberHandleService } from './member-handle.service';

const POST_PARENT_TOPIC = 'TOPIC';
const POST_PARENT_POST = 'POST';
const SYSTEM_AUTHOR_MEMBER_ID = 'system';
const SYSTEM_AUTHOR_HANDLE = 'system';

/**
 * Authenticated forum actor resolved from the validated token.
 */
interface ForumActor {
  memberId: string | null;
  handle: string | null;
}

/**
 * Authenticated member actor required when a mutation writes member snapshots.
 */
interface ForumMemberActor {
  memberId: string;
  handle: string;
}

/**
 * Author snapshot resolved for content creation.
 */
interface ForumContentAuthor {
  memberId: string;
  handle: string;
  seedMemberState: boolean;
}

/**
 * Member target resolved for watch and read-state commands.
 */
interface ForumMemberCommandTarget {
  memberId: string;
  principal: ForumsMemberTargetPrincipal;
}

/**
 * Options controlling whether actor resolution must identify a real member.
 */
interface RequireActorOptions {
  memberRequired?: boolean;
}

/**
 * Result returned after topic creation.
 */
export interface CreateTopicResult {
  topic: Topic;
  starterPost: Post;
}

/**
 * Result returned by watch mutation commands.
 */
export interface TopicWatchResult {
  topicId: string;
  memberId: string;
  watching: boolean;
}

/**
 * Command-side service for forum content, watch, and read-state mutations.
 *
 * The service keeps transactional write shapes local while delegating
 * action-level authorization to the shared forums access policy. Human content
 * authors must resolve to members, while scoped M2M content authors use a
 * stable system snapshot and member-targeted state commands evaluate the
 * explicit target member after Members and Identity both resolve it.
 */
@Injectable()
export class ForumsCommandService {
  private readonly logger = new Logger(ForumsCommandService.name);

  /**
   * Creates a forums command service.
   *
   * @param db Prisma-backed forums database service.
   * @param accessPolicyService Forums policy service for action-level authorization.
   * @param topicContextService Loader for effective topic and post restrictions.
   * @param memberDirectoryService Adapter for member-domain target validation.
   * @param identityAccessService Adapter for strict target identity and role lookup.
   * @param memberHandleService Adapter for member-domain handle lookups.
   * @param notificationService Post-commit forum watch notification publisher.
   * @throws Does not throw directly; dependencies are resolved by Nest.
   */
  constructor(
    private readonly db: DbService,
    private readonly accessPolicyService: ForumsAccessPolicyService,
    private readonly topicContextService: ForumsTopicContextService,
    private readonly memberDirectoryService: ForumsMemberDirectoryService,
    private readonly identityAccessService: IdentityAccessService,
    private readonly memberHandleService: MemberHandleService,
    private readonly notificationService: ForumsWatchNotificationService,
  ) {}

  /**
   * Creates a topic and starter post in one transaction.
   *
   * Child topics are allowed only when the resolved effective restrictions
   * remain non-challenge. Challenge-scoped child candidates are rejected by the
   * shared create-topic policy before any transactional writes or notifications.
   *
   * @param dto Topic metadata and starter-post content.
   * @param user Authenticated token payload for the acting member.
   * @returns The created topic and starter post after any child-topic notification attempt settles.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws BadRequestException when topic fields or parent linkage are invalid.
   * @throws ForbiddenException when shared policy denies topic creation.
   * @throws NotFoundException when the parent topic does not exist or is hidden.
   */
  async createTopic(
    dto: CreateTopicDto,
    user: JwtUser | undefined,
  ): Promise<CreateTopicResult> {
    const principal = this.requirePrincipal(user);
    const author = await this.resolveContentAuthor(user);
    const title = this.normalizeRequiredText(dto.title, 'title', 255);
    const content = this.normalizeRequiredText(dto.content, 'content');
    const parentTopicId = this.normalizeOptionalText(dto.parentTopicId);
    const requestedChallengeId = this.hasOwn(dto, 'challengeId')
      ? (normalizeForumsOptionalText(dto.challengeId) ?? null)
      : undefined;
    const requestedRoleName = this.hasOwn(dto, 'roleName')
      ? normalizeForumRoleName(dto.roleName)
      : undefined;
    const parentContext = parentTopicId
      ? await this.topicContextService.loadTopicContext(
          parentTopicId,
          principal,
        )
      : undefined;
    const restrictions = resolveMonotonicTopicRestrictions(
      parentContext
        ? {
            challengeId: parentContext.effectiveChallengeId,
            roleName: parentContext.effectiveRoleName,
          }
        : undefined,
      {
        challengeId: requestedChallengeId,
        roleName: requestedRoleName,
      },
    );
    const createDecisions = await this.accessPolicyService.decideForCreateTopic(
      principal,
      {
        challengeId: restrictions.effectiveChallengeId,
        roleName: restrictions.effectiveRoleName,
      },
      parentContext,
    );

    this.assertAllowed(
      parentTopicId
        ? createDecisions.canCreateChildTopic
        : createDecisions.canCreateTopLevelTopic,
    );

    if (dto.isAnnouncement) {
      this.assertAllowed(createDecisions.canControlAnnouncement);
    }

    const result = await this.db.$transaction(async (tx) => {
      if (parentTopicId) {
        await this.ensureActiveTopic(tx, parentTopicId);
      }

      const topic = await tx.topic.create({
        data: {
          parentTopicId,
          challengeId: restrictions.storedChallengeId,
          roleName: restrictions.storedRoleName,
          title,
          isAnnouncement: dto.isAnnouncement ?? false,
          authorMemberId: author.memberId,
          authorHandle: author.handle,
        },
      });

      await this.createClosureRows(tx, topic.id, parentTopicId);

      const starterPost = await tx.post.create({
        data: {
          topicId: topic.id,
          parentType: POST_PARENT_TOPIC,
          parentId: topic.id,
          authorMemberId: author.memberId,
          authorHandle: author.handle,
          content,
        },
      });

      if (author.seedMemberState) {
        await tx.topicWatch.upsert({
          where: {
            topicId_memberId: {
              topicId: topic.id,
              memberId: author.memberId,
            },
          },
          create: {
            topicId: topic.id,
            memberId: author.memberId,
          },
          update: {},
        });

        await tx.topicReadState.upsert({
          where: {
            topicId_memberId: {
              topicId: topic.id,
              memberId: author.memberId,
            },
          },
          create: {
            topicId: topic.id,
            memberId: author.memberId,
            lastReadAt: starterPost.createdAt,
          },
          update: {
            lastReadAt: starterPost.createdAt,
          },
        });
      }

      return { topic, starterPost };
    });

    if (parentTopicId) {
      await this.publishPostNotificationBestEffort(
        'createTopic',
        result.topic,
        result.starterPost,
        {
          challengeId: restrictions.effectiveChallengeId,
          roleName: restrictions.effectiveRoleName,
          hasRestrictionConflict:
            parentContext?.hasRestrictionConflict ?? false,
        },
      );
    }

    return result;
  }

  /**
   * Updates mutable topic fields.
   *
   * @param topicId Topic id to update.
   * @param dto Mutable topic fields.
   * @param user Authenticated token payload for the acting member.
   * @returns The updated topic row.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws BadRequestException when no mutable fields are supplied.
   * @throws NotFoundException when the topic does not exist or is hidden.
   */
  async updateTopic(
    topicId: string,
    dto: UpdateTopicDto,
    user: JwtUser | undefined,
  ): Promise<Topic> {
    const principal = this.requirePrincipal(user);
    await this.requireActor(user);
    const context = await this.topicContextService.loadTopicContext(
      topicId,
      principal,
    );
    const topicDecisions = await this.accessPolicyService.decideForTopic(
      principal,
      context,
    );

    this.assertAllowed(topicDecisions.canUpdateTopic);

    const data: {
      title?: string;
      isAnnouncement?: boolean;
      roleName?: string | null;
    } = {};

    if (this.hasOwn(dto, 'title')) {
      data.title = this.normalizeRequiredText(dto.title, 'title', 255);
    }

    if (this.hasOwn(dto, 'isAnnouncement')) {
      data.isAnnouncement = dto.isAnnouncement;

      if (dto.isAnnouncement !== context.topic.isAnnouncement) {
        this.assertAllowed(topicDecisions.canControlAnnouncement);
      }
    }

    if (this.hasOwn(dto, 'roleName')) {
      data.roleName = resolveMonotonicRoleNameUpdate(
        context.ancestorRoleName,
        context.effectiveRoleName,
        normalizeForumRoleName(dto.roleName),
      );

      await this.assertCanAccessRestrictions(principal, {
        challengeId: context.effectiveChallengeId,
        roleName: data.roleName,
      });
      await this.ensureNoConflictingDescendantRole(topicId, data.roleName);
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('At least one topic field is required.');
    }

    return this.db.$transaction(async (tx) => {
      await this.ensureActiveTopic(tx, topicId);

      return tx.topic.update({
        where: { id: topicId },
        data,
      });
    });
  }

  /**
   * Soft-deletes a topic while retaining closure rows for subtree hiding.
   *
   * @param topicId Topic id to soft delete.
   * @param user Authenticated token payload for the acting member.
   * @returns The updated topic row with delete metadata.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws NotFoundException when the topic does not exist or is already hidden.
   */
  async softDeleteTopic(
    topicId: string,
    user: JwtUser | undefined,
  ): Promise<Topic> {
    const principal = this.requirePrincipal(user);
    const actor = await this.requireActor(user);
    const context = await this.topicContextService.loadTopicContext(
      topicId,
      principal,
    );
    const topicDecisions = await this.accessPolicyService.decideForTopic(
      principal,
      context,
    );

    this.assertAllowed(topicDecisions.canDeleteTopic);

    return this.db.$transaction(async (tx) => {
      await this.ensureActiveTopic(tx, topicId);

      return tx.topic.update({
        where: { id: topicId },
        data: {
          deletedAt: new Date(),
          deletedByMemberId: actor.memberId,
        },
      });
    });
  }

  /**
   * Creates a post inside an active topic.
   *
   * @param topicId Owning topic id.
   * @param dto Post content and optional polymorphic parent target.
   * @param user Authenticated token payload for the acting member.
   * @returns The created post row after the best-effort notification attempt settles.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws BadRequestException when parent linkage or content is invalid.
   * @throws NotFoundException when the topic or parent post does not exist.
   */
  async createPost(
    topicId: string,
    dto: CreatePostDto,
    user: JwtUser | undefined,
  ): Promise<Post> {
    const principal = this.requirePrincipal(user);
    const author = await this.resolveContentAuthor(user);
    const content = this.normalizeRequiredText(dto.content, 'content');
    const context = await this.topicContextService.loadTopicContext(
      topicId,
      principal,
    );
    const topicDecisions = await this.accessPolicyService.decideForTopic(
      principal,
      context,
    );

    this.assertAllowed(topicDecisions.canCreatePost);

    const post = await this.db.$transaction(async (tx) => {
      await this.ensureActiveTopic(tx, topicId);
      const parent = await this.resolvePostParent(tx, topicId, dto);

      const post = await tx.post.create({
        data: {
          topicId,
          parentType: parent.parentType,
          parentId: parent.parentId,
          authorMemberId: author.memberId,
          authorHandle: author.handle,
          content,
        },
      });

      if (author.seedMemberState) {
        await tx.topicReadState.upsert({
          where: {
            topicId_memberId: {
              topicId,
              memberId: author.memberId,
            },
          },
          create: {
            topicId,
            memberId: author.memberId,
            lastReadAt: post.createdAt,
          },
          update: {
            lastReadAt: post.createdAt,
          },
        });
      }

      return post;
    });

    await this.publishPostNotificationBestEffort(
      'createPost',
      context.topic,
      post,
      {
        challengeId: context.effectiveChallengeId,
        roleName: context.effectiveRoleName,
        hasRestrictionConflict: context.hasRestrictionConflict,
      },
    );

    return post;
  }

  /**
   * Updates the content of an existing post.
   *
   * @param postId Post id to update.
   * @param dto Updated markdown content.
   * @param user Authenticated token payload for the acting member.
   * @returns The updated post row.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws BadRequestException when content is invalid.
   * @throws NotFoundException when the post or its topic does not exist or is hidden.
   */
  async updatePost(
    postId: string,
    dto: UpdatePostDto,
    user: JwtUser | undefined,
  ): Promise<Post> {
    const principal = this.requirePrincipal(user);
    await this.requireActor(user);
    const content = this.normalizeRequiredText(dto.content, 'content');
    const context = await this.topicContextService.loadPostContext(
      postId,
      principal,
    );
    const postDecisions = await this.accessPolicyService.decideForPost(
      principal,
      context,
    );

    this.assertAllowed(postDecisions.canUpdatePost);

    return this.db.$transaction(async (tx) => {
      const post = await this.ensureMutablePost(tx, postId);

      return tx.post.update({
        where: { id: post.id },
        data: { content },
      });
    });
  }

  /**
   * Soft-deletes a post while preserving row identity and reply structure.
   *
   * @param postId Post id to delete.
   * @param user Authenticated token payload for the acting member.
   * @returns The deleted post row with blank content.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws NotFoundException when the post or its topic does not exist or is hidden.
   */
  async deletePost(postId: string, user: JwtUser | undefined): Promise<Post> {
    const principal = this.requirePrincipal(user);
    const actor = await this.requireActor(user);
    const context = await this.topicContextService.loadPostContext(
      postId,
      principal,
    );
    const postDecisions = await this.accessPolicyService.decideForPost(
      principal,
      context,
    );

    this.assertAllowed(postDecisions.canDeletePost);

    return this.db.$transaction(async (tx) => {
      const post = await this.ensurePostInActiveTopic(tx, postId);

      if (post.deletedAt) {
        return post;
      }

      return tx.post.update({
        where: { id: post.id },
        data: {
          content: null,
          deletedAt: new Date(),
          deletedByMemberId: actor.memberId,
        },
      });
    });
  }

  /**
   * Adds an explicit watch for a member on a topic.
   *
   * @param topicId Topic id to watch.
   * @param dto Optional target member body; required for scoped M2M callers.
   * @param user Authenticated token payload for the acting member.
   * @returns A watch-state result for the member/topic pair.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws BadRequestException when a scoped M2M caller omits the target member id or the target cannot be resolved in Members and Identity.
   * @throws NotFoundException when the topic does not exist or is hidden.
   */
  async addTopicWatch(
    topicId: string,
    dto: MemberTargetDto | undefined,
    user: JwtUser | undefined,
  ): Promise<TopicWatch> {
    const principal = this.requirePrincipal(user);
    const target = await this.resolveMemberCommandTarget(principal, user, dto);
    const context = await this.topicContextService.loadTopicContext(
      topicId,
      target.principal,
    );
    const topicDecisions = await this.accessPolicyService.decideForTopic(
      principal,
      context,
      { memberTargetPrincipal: target.principal },
    );

    this.assertAllowed(topicDecisions.canAddWatch);

    return this.db.$transaction(async (tx) => {
      await this.ensureActiveTopic(tx, topicId);

      return tx.topicWatch.upsert({
        where: {
          topicId_memberId: {
            topicId,
            memberId: target.memberId,
          },
        },
        create: {
          topicId,
          memberId: target.memberId,
        },
        update: {},
      });
    });
  }

  /**
   * Removes an explicit watch for a member from a topic.
   *
   * @param topicId Topic id to unwatch.
   * @param dto Optional target member body; required for scoped M2M callers.
   * @param user Authenticated token payload for the acting member.
   * @returns The resulting watch state for the member/topic pair.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws BadRequestException when a scoped M2M caller omits the target member id or the target cannot be resolved in Members and Identity.
   * @throws NotFoundException when the topic does not exist or is hidden.
   */
  async removeTopicWatch(
    topicId: string,
    dto: MemberTargetDto | undefined,
    user: JwtUser | undefined,
  ): Promise<TopicWatchResult> {
    const principal = this.requirePrincipal(user);
    const target = await this.resolveMemberCommandTarget(principal, user, dto);
    const context = await this.topicContextService.loadTopicContext(
      topicId,
      target.principal,
    );
    const topicDecisions = await this.accessPolicyService.decideForTopic(
      principal,
      context,
      { memberTargetPrincipal: target.principal },
    );

    this.assertAllowed(topicDecisions.canRemoveWatch);

    return this.db.$transaction(async (tx) => {
      await this.ensureActiveTopic(tx, topicId);

      await tx.topicWatch.deleteMany({
        where: {
          topicId,
          memberId: target.memberId,
        },
      });

      return {
        topicId,
        memberId: target.memberId,
        watching: false,
      };
    });
  }

  /**
   * Marks a topic as read for a member.
   *
   * @param topicId Topic id to mark as read.
   * @param dto Optional target member body; required for scoped M2M callers.
   * @param user Authenticated token payload for the acting member.
   * @returns The upserted read-state row.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws BadRequestException when a scoped M2M caller omits the target member id or the target cannot be resolved in Members and Identity.
   * @throws NotFoundException when the topic does not exist or is hidden.
   */
  async markTopicRead(
    topicId: string,
    dto: MemberTargetDto | undefined,
    user: JwtUser | undefined,
  ): Promise<TopicReadState> {
    const principal = this.requirePrincipal(user);
    const target = await this.resolveMemberCommandTarget(principal, user, dto);
    const lastReadAt = new Date();
    const context = await this.topicContextService.loadTopicContext(
      topicId,
      target.principal,
    );
    const topicDecisions = await this.accessPolicyService.decideForTopic(
      principal,
      context,
      { memberTargetPrincipal: target.principal },
    );

    this.assertAllowed(topicDecisions.canMarkRead);

    return this.db.$transaction(async (tx) => {
      await this.ensureActiveTopic(tx, topicId);

      return tx.topicReadState.upsert({
        where: {
          topicId_memberId: {
            topicId,
            memberId: target.memberId,
          },
        },
        create: {
          topicId,
          memberId: target.memberId,
          lastReadAt,
        },
        update: {
          lastReadAt,
        },
      });
    });
  }

  /**
   * Publishes a post-commit watch notification without affecting the write result.
   *
   * @param operationName Command operation that created the post.
   * @param topic Persisted topic row used in the notification payload.
   * @param post Persisted post row used in the notification payload.
   * @param restrictions Effective restriction context for recipient filtering.
   * @returns A promise that resolves after publish succeeds, skips, or is logged as failed.
   * @throws Does not throw; notification errors are caught and logged.
   */
  private async publishPostNotificationBestEffort(
    operationName: 'createPost' | 'createTopic',
    topic: Topic,
    post: Post,
    restrictions: ForumsRestrictionVisibilityTarget,
  ): Promise<void> {
    try {
      await this.notificationService.publishPostNotification({
        topic,
        post,
        restrictions,
        operationName,
      });
    } catch (error) {
      const attemptedRecipientCount =
        error instanceof ForumsNotificationPublishError
          ? String(error.attemptedRecipientCount)
          : 'unknown';
      const message = error instanceof Error ? error.message : 'unknown error';

      this.logger.error(
        `${operationName} notification failed for topic ${topic.id}, post ${post.id}, attemptedRecipientCount=${attemptedRecipientCount}: ${message}`,
      );
    }
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
   * Converts an access decision into the command-layer exception contract.
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
   * Ensures the principal can access a candidate topic restriction set.
   *
   * @param principal Normalized forums principal for the current command.
   * @param restrictions Effective challenge and role restrictions being applied.
   * @returns A promise that resolves when the candidate remains accessible.
   * @throws ForbiddenException when the candidate restriction is not accessible.
   */
  private async assertCanAccessRestrictions(
    principal: ForumsPrincipal,
    restrictions: ForumsEffectiveRestrictions,
  ): Promise<void> {
    this.assertAllowed(
      await this.accessPolicyService.decideForRestrictions(
        principal,
        restrictions,
      ),
    );
  }

  /**
   * Resolves the author snapshot for topic and post creation.
   *
   * @param user Authenticated token payload from request middleware.
   * @returns Member author for human callers or the fixed system author for M2M callers.
   * @throws UnauthorizedException when no token is present or a human author cannot be resolved.
   */
  private async resolveContentAuthor(
    user: JwtUser | undefined,
  ): Promise<ForumContentAuthor> {
    if (!user) {
      throw new UnauthorizedException('Authenticated token required.');
    }

    if (user.isMachine) {
      return {
        memberId: SYSTEM_AUTHOR_MEMBER_ID,
        handle: SYSTEM_AUTHOR_HANDLE,
        seedMemberState: false,
      };
    }

    const actor = await this.requireActor(user, { memberRequired: true });

    return {
      memberId: actor.memberId,
      handle: actor.handle,
      seedMemberState: true,
    };
  }

  /**
   * Resolves the member whose watch or read-state row will be changed.
   *
   * Scoped M2M callers must provide a non-empty target that resolves to the
   * same member through both the Members and Identity adapters before policy
   * evaluation or persistence can proceed. Human callers keep the existing
   * self-target behavior and use their token roles.
   *
   * @param principal Acting caller principal from the authenticated token.
   * @param user Authenticated token payload from request middleware.
   * @param dto Optional target-member request body.
   * @returns Target member id and principal for policy evaluation.
   * @throws BadRequestException when a scoped M2M caller omits `memberId` or the target cannot be resolved in Members and Identity.
   * @throws ForbiddenException when a human caller targets a different member.
   * @throws UnauthorizedException when a human caller has no authenticated member id.
   */
  private async resolveMemberCommandTarget(
    principal: ForumsPrincipal,
    user: JwtUser | undefined,
    dto: MemberTargetDto | undefined,
  ): Promise<ForumMemberCommandTarget> {
    const requestedMemberId = this.normalizeOptionalText(dto?.memberId);

    if (principal.isMachine) {
      if (!requestedMemberId) {
        throw new BadRequestException(
          'memberId is required for M2M on-behalf calls.',
        );
      }

      const [memberRecord] = await this.memberDirectoryService.getMembersByIds([
        requestedMemberId,
      ]);
      const identityProfile =
        await this.identityAccessService.resolveMemberAccessProfile(
          requestedMemberId,
        );

      if (
        !memberRecord ||
        !identityProfile ||
        memberRecord.memberId !== identityProfile.memberId
      ) {
        throw new BadRequestException('Invalid member target.');
      }

      return {
        memberId: memberRecord.memberId,
        principal: buildForumsMemberTargetPrincipal(
          memberRecord.memberId,
          identityProfile.roles,
        ),
      };
    }

    const actor = await this.requireActor(user, { memberRequired: true });

    if (requestedMemberId && requestedMemberId !== actor.memberId) {
      throw new ForbiddenException(
        'Member tokens can only target their own member id.',
      );
    }

    return {
      memberId: actor.memberId,
      principal: buildForumsMemberTargetPrincipal(
        actor.memberId,
        principal.roles,
      ),
    };
  }

  /**
   * Ensures a role update will not create conflicting child role restrictions.
   *
   * @param topicId Topic whose descendants should be checked.
   * @param roleName Role restriction being applied to the topic.
   * @returns A promise that resolves when no active descendant conflicts.
   * @throws BadRequestException when an active child stores a different roleName.
   */
  private async ensureNoConflictingDescendantRole(
    topicId: string,
    roleName: string | null,
  ): Promise<void> {
    if (!roleName) {
      return;
    }

    const descendantRows = await this.db.topicClosure.findMany({
      where: {
        ancestorTopicId: topicId,
        descendantTopicId: { not: topicId },
        descendantTopic: {
          deletedAt: null,
          roleName: { not: null },
        },
      },
      select: {
        descendantTopic: {
          select: { id: true, roleName: true },
        },
      },
    });
    const conflictingDescendant = descendantRows.find((row) => {
      const descendantRoleName = normalizeForumRoleName(
        row.descendantTopic.roleName,
      );
      return descendantRoleName && descendantRoleName !== roleName;
    });

    if (conflictingDescendant) {
      throw new BadRequestException(
        'Topic roleName conflicts with an existing child topic restriction.',
      );
    }
  }

  /**
   * Resolves and validates the authenticated forum actor.
   *
   * @param user Authenticated token payload from request middleware.
   * @param options Resolution options indicating whether a real member is required.
   * @returns Normalized command actor with member details when available.
   * @throws UnauthorizedException when no token is present or a required member cannot be resolved.
   */
  private async requireActor(
    user: JwtUser | undefined,
    options: { memberRequired: true },
  ): Promise<ForumMemberActor>;
  private async requireActor(
    user: JwtUser | undefined,
    options?: RequireActorOptions,
  ): Promise<ForumActor>;
  private async requireActor(
    user: JwtUser | undefined,
    options: RequireActorOptions = {},
  ): Promise<ForumActor> {
    if (!user) {
      throw new UnauthorizedException('Authenticated token required.');
    }

    const memberId = user?.userId?.trim();

    if (!memberId) {
      if (user.isMachine && !options.memberRequired) {
        return {
          memberId: null,
          handle: null,
        };
      }

      throw new UnauthorizedException('Authenticated member token required.');
    }

    const handle =
      this.normalizeHandleSnapshot(user.handle) ??
      (await this.memberHandleService.resolveHandleByMemberId(memberId));

    if (!handle && options.memberRequired) {
      throw new UnauthorizedException(
        'Authenticated member handle could not be resolved.',
      );
    }

    return {
      memberId,
      handle: handle ?? null,
    };
  }

  /**
   * Normalizes a token handle for forum author snapshot storage.
   *
   * @param handle Raw handle claim from the authenticated token.
   * @returns Trimmed handle capped to the forum snapshot column length.
   * @throws Does not throw.
   */
  private normalizeHandleSnapshot(
    handle: string | undefined,
  ): string | undefined {
    const normalized = handle?.trim();
    return normalized ? normalized.slice(0, 128) : undefined;
  }

  /**
   * Ensures an active topic exists and is not hidden by a deleted ancestor.
   *
   * @param tx Prisma transaction client.
   * @param topicId Topic id to validate.
   * @returns The active topic row.
   * @throws NotFoundException when the topic is missing, deleted, or hidden.
   */
  private async ensureActiveTopic(
    tx: Prisma.TransactionClient,
    topicId: string,
  ): Promise<Topic> {
    const topic = await tx.topic.findUnique({ where: { id: topicId } });

    if (!topic || topic.deletedAt) {
      throw new NotFoundException('Topic not found.');
    }

    const deletedAncestor = await tx.topicClosure.findFirst({
      where: {
        descendantTopicId: topicId,
        ancestorTopicId: { not: topicId },
        ancestorTopic: {
          deletedAt: { not: null },
        },
      },
      select: { ancestorTopicId: true },
    });

    if (deletedAncestor) {
      throw new NotFoundException('Topic not found.');
    }

    return topic;
  }

  /**
   * Creates closure rows for a new topic.
   *
   * @param tx Prisma transaction client.
   * @param topicId Newly created topic id.
   * @param parentTopicId Optional parent topic id.
   * @returns A promise that resolves once all closure rows are persisted.
   * @throws Prisma errors when closure rows cannot be created.
   */
  private async createClosureRows(
    tx: Prisma.TransactionClient,
    topicId: string,
    parentTopicId: string | undefined,
  ): Promise<void> {
    const ancestorRows = parentTopicId
      ? await tx.topicClosure.findMany({
          where: { descendantTopicId: parentTopicId },
          select: { ancestorTopicId: true, depth: true },
        })
      : [];

    await tx.topicClosure.createMany({
      data: [
        ...ancestorRows.map((closure) => ({
          ancestorTopicId: closure.ancestorTopicId,
          descendantTopicId: topicId,
          depth: closure.depth + 1,
        })),
        {
          ancestorTopicId: topicId,
          descendantTopicId: topicId,
          depth: 0,
        },
      ],
    });
  }

  /**
   * Validates and resolves polymorphic post parentage.
   *
   * @param tx Prisma transaction client.
   * @param topicId Owning topic id.
   * @param dto Post creation body containing optional parent fields.
   * @returns Normalized parent type and parent id.
   * @throws BadRequestException when parent fields are inconsistent.
   * @throws NotFoundException when a parent post does not exist in the topic.
   */
  private async resolvePostParent(
    tx: Prisma.TransactionClient,
    topicId: string,
    dto: CreatePostDto,
  ): Promise<{ parentType: string; parentId: string }> {
    const hasParentType = this.hasOwn(dto, 'parentType');
    const hasParentId = this.hasOwn(dto, 'parentId');

    if (!hasParentType && !hasParentId) {
      return { parentType: POST_PARENT_TOPIC, parentId: topicId };
    }

    if (!hasParentType || !hasParentId) {
      throw new BadRequestException(
        'parentType and parentId must be supplied together.',
      );
    }

    const parentType = dto.parentType;
    const parentId = this.normalizeOptionalText(dto.parentId);

    if (!parentType || !parentId) {
      throw new BadRequestException(
        'parentType and parentId must be supplied together.',
      );
    }

    if (parentType === POST_PARENT_TOPIC) {
      if (parentId !== topicId) {
        throw new BadRequestException(
          'TOPIC parentId must match the route topic id.',
        );
      }

      return { parentType, parentId };
    }

    if (parentType !== POST_PARENT_POST) {
      throw new BadRequestException('Unsupported post parentType.');
    }

    const parentPost = await tx.post.findFirst({
      where: {
        id: parentId,
        topicId,
      },
      select: { id: true },
    });

    if (!parentPost) {
      throw new NotFoundException('Parent post not found.');
    }

    return { parentType, parentId };
  }

  /**
   * Ensures a post exists in an active topic.
   *
   * @param tx Prisma transaction client.
   * @param postId Post id to validate.
   * @returns The post row.
   * @throws NotFoundException when the post or active topic is missing.
   */
  private async ensurePostInActiveTopic(
    tx: Prisma.TransactionClient,
    postId: string,
  ): Promise<Post> {
    const post = await tx.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    await this.ensureActiveTopic(tx, post.topicId);
    return post;
  }

  /**
   * Ensures a post exists, is not deleted, and belongs to an active topic.
   *
   * @param tx Prisma transaction client.
   * @param postId Post id to validate.
   * @returns The mutable post row.
   * @throws NotFoundException when the post is missing, deleted, or hidden.
   */
  private async ensureMutablePost(
    tx: Prisma.TransactionClient,
    postId: string,
  ): Promise<Post> {
    const post = await this.ensurePostInActiveTopic(tx, postId);

    if (post.deletedAt) {
      throw new NotFoundException('Post not found.');
    }

    return post;
  }

  /**
   * Normalizes required user-supplied text.
   *
   * @param value Raw text value.
   * @param fieldName Field name used in validation errors.
   * @param maxLength Optional maximum length to enforce.
   * @returns Trimmed non-empty text.
   * @throws BadRequestException when text is empty or too long.
   */
  private normalizeRequiredText(
    value: string | undefined,
    fieldName: string,
    maxLength?: number,
  ): string {
    const normalized = value?.trim();

    if (!normalized) {
      throw new BadRequestException(`${fieldName} is required.`);
    }

    if (maxLength && normalized.length > maxLength) {
      throw new BadRequestException(
        `${fieldName} must be at most ${maxLength} characters.`,
      );
    }

    return normalized;
  }

  /**
   * Normalizes optional user-supplied text.
   *
   * @param value Raw optional text value.
   * @returns Trimmed text or `undefined` when no value remains.
   * @throws Does not throw.
   */
  private normalizeOptionalText(
    value: string | null | undefined,
  ): string | undefined {
    const normalized = value?.trim();
    return normalized && normalized.length > 0 ? normalized : undefined;
  }

  /**
   * Checks whether an object owns a property supplied by the request body.
   *
   * @param value Object to inspect.
   * @param key Property key to check.
   * @returns `true` when the property exists on the object.
   * @throws Does not throw.
   */
  private hasOwn<T extends object, K extends PropertyKey>(
    value: T,
    key: K,
  ): value is T & Record<K, unknown> {
    return Object.prototype.hasOwnProperty.call(value, key);
  }
}
