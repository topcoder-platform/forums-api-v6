import { Injectable } from '@nestjs/common';
import {
  ChallengeAccessFacts,
  ChallengeAccessService,
} from './challenge-access.service';
import {
  ForumsAccessEvaluationOptions,
  ForumsAccessDecision,
  ForumsEffectiveRestrictions,
  ForumsPostAccessDecisions,
  ForumsPostContext,
  ForumsPrincipal,
  ForumsRestrictionVisibilityTarget,
  ForumsTopicAccessDecisions,
  ForumsTopicContext,
} from './forums-access.types';
import {
  ResourceAccessFacts,
  ResourceAccessService,
} from './resource-access.service';

const CHALLENGE_CHILD_TOPIC_DENY_REASON =
  'Child-topic creation is only allowed for non-challenge effective contexts.';

interface RestrictionEvaluation {
  visibility: ForumsAccessDecision;
  isElevated: boolean;
  isChallengeCopilot: boolean;
}

/**
 * Central forum access policy for topic and post command decisions.
 *
 * The policy accepts request-independent principals and context-loader targets,
 * combines forum restrictions with challenge/resource facts, and returns a
 * reusable action decision object. Controllers only declare coarse role/scope
 * metadata; command services enforce these fine-grained decisions before writes.
 */
@Injectable()
export class ForumsAccessPolicyService {
  /**
   * Creates a forums access policy service.
   *
   * @param challengeAccessService Adapter for challenge existence and member access facts.
   * @param resourceAccessService Adapter for resource-role and challenge-copilot facts.
   * @throws Does not throw directly; dependencies are resolved by Nest.
   */
  constructor(
    private readonly challengeAccessService: ChallengeAccessService,
    private readonly resourceAccessService: ResourceAccessService,
  ) {}

  /**
   * Evaluates all topic-level actions for a loaded topic context.
   *
   * @param principal Normalized forums principal for the current command.
   * @param context Topic context from the context loader.
   * @param options Optional member-targeted evaluation context.
   * @returns Decision matrix for topic reads, writes, watches, read-state, and announcements.
   * @throws Prisma errors when required external access facts cannot be loaded.
   */
  async decideForTopic(
    principal: ForumsPrincipal,
    context: ForumsTopicContext,
    options: ForumsAccessEvaluationOptions = {},
  ): Promise<ForumsTopicAccessDecisions> {
    if (!this.isTopicTargetAvailable(context)) {
      return this.denyTopicDecisions('Topic not found.');
    }

    const evaluation = await this.evaluateRestrictions(
      principal,
      {
        challengeId: context.effectiveChallengeId,
        roleName: context.effectiveRoleName,
        hasRestrictionConflict: context.hasRestrictionConflict,
      },
      options,
    );
    const canOwnContent =
      evaluation.visibility.allowed && context.isTopicAuthor;
    const canMutateContent =
      evaluation.isElevated || canOwnContent
        ? this.allow()
        : this.deny(
            'Only the author or an elevated forums actor may modify it.',
          );
    const canControlAnnouncement = this.evaluateAnnouncementControl(evaluation);

    return {
      canView: evaluation.visibility,
      canCreateTopLevelTopic: this.deny('Use create-topic evaluation.'),
      canCreateChildTopic: evaluation.visibility,
      canCreatePost: evaluation.visibility,
      canUpdateTopic: canMutateContent,
      canDeleteTopic: canMutateContent,
      canAddWatch: evaluation.visibility,
      canRemoveWatch: evaluation.visibility,
      canMarkRead: evaluation.visibility,
      canControlAnnouncement,
      canReceiveNotification: evaluation.visibility,
    };
  }

  /**
   * Evaluates all post-level actions for a loaded post context.
   *
   * @param principal Normalized forums principal for the current command.
   * @param context Post context from the context loader.
   * @param options Optional member-targeted evaluation context.
   * @returns Decision matrix for post reads and mutations plus inherited topic actions.
   * @throws Prisma errors when required external access facts cannot be loaded.
   */
  async decideForPost(
    principal: ForumsPrincipal,
    context: ForumsPostContext,
    options: ForumsAccessEvaluationOptions = {},
  ): Promise<ForumsPostAccessDecisions> {
    const topicDecisions = await this.decideForTopic(
      principal,
      context,
      options,
    );

    if (!this.isTopicTargetAvailable(context)) {
      return {
        ...topicDecisions,
        canUpdatePost: this.deny('Post not found.'),
        canDeletePost: this.deny('Post not found.'),
      };
    }

    const evaluation = await this.evaluateRestrictions(
      principal,
      {
        challengeId: context.effectiveChallengeId,
        roleName: context.effectiveRoleName,
        hasRestrictionConflict: context.hasRestrictionConflict,
      },
      options,
    );
    const canOwnContent = evaluation.visibility.allowed && context.isPostAuthor;
    const canMutateContent =
      evaluation.isElevated || canOwnContent
        ? this.allow()
        : this.deny(
            'Only the author or an elevated forums actor may modify it.',
          );

    return {
      ...topicDecisions,
      canUpdatePost: context.post.deletedAt
        ? this.deny('Post not found.')
        : canMutateContent,
      canDeletePost: canMutateContent,
    };
  }

  /**
   * Evaluates topic creation under a candidate restriction set.
   *
   * Top-level non-challenge topic creation is reserved for human admins and
   * scoped M2M callers. Top-level challenge topics are available to eligible
   * challenge members, challenge copilots, and admins, but not M2M callers.
   * Child-topic creation stays available to members who can see both the parent
   * topic and the monotonic candidate restrictions, but only when the resolved
   * effective child context is non-challenge. Child candidates with a non-null
   * effective `challengeId` are forbidden even when the caller can see the
   * parent or challenge, and they are denied before candidate challenge or
   * resource facts are loaded.
   *
   * @param principal Normalized forums principal for the current command.
   * @param restrictions Effective restrictions that the new topic will carry.
   * @param parentContext Optional parent context for child topic creation.
   * @param options Optional member-targeted evaluation context.
   * @returns Decision matrix with create and announcement decisions populated.
   * @throws Prisma errors when required parent or candidate external access facts cannot be loaded.
   */
  async decideForCreateTopic(
    principal: ForumsPrincipal,
    restrictions: ForumsEffectiveRestrictions,
    parentContext?: ForumsTopicContext,
    options: ForumsAccessEvaluationOptions = {},
  ): Promise<ForumsTopicAccessDecisions> {
    if (parentContext && !this.isTopicTargetAvailable(parentContext)) {
      return this.denyTopicDecisions('Topic not found.');
    }

    const parentVisibility = parentContext
      ? (
          await this.evaluateRestrictions(
            principal,
            {
              challengeId: parentContext.effectiveChallengeId,
              roleName: parentContext.effectiveRoleName,
              hasRestrictionConflict: parentContext.hasRestrictionConflict,
            },
            options,
          )
        ).visibility
      : this.allow();

    if (parentContext && restrictions.challengeId) {
      const canCreateChildTopic = parentVisibility.allowed
        ? this.deny(CHALLENGE_CHILD_TOPIC_DENY_REASON)
        : this.deny(parentVisibility.reason ?? 'Insufficient forums access.');
      const topicNotCreatedDenial = this.deny('Topic has not been created.');

      return {
        canView: parentVisibility,
        canCreateTopLevelTopic: this.deny('Child topic only.'),
        canCreateChildTopic,
        canCreatePost: parentVisibility,
        canUpdateTopic: topicNotCreatedDenial,
        canDeleteTopic: topicNotCreatedDenial,
        canAddWatch: parentVisibility,
        canRemoveWatch: parentVisibility,
        canMarkRead: parentVisibility,
        canControlAnnouncement: this.deny(
          'Announcement control requires elevated forums access.',
        ),
        canReceiveNotification: parentVisibility,
      };
    }

    const candidateEvaluation = await this.evaluateRestrictions(
      principal,
      {
        challengeId: restrictions.challengeId,
        roleName: restrictions.roleName,
        hasRestrictionConflict: false,
      },
      options,
    );
    let canCreateChildTopic: ForumsAccessDecision;

    if (!parentVisibility.allowed) {
      canCreateChildTopic = this.deny(
        parentVisibility.reason ?? 'Insufficient forums access.',
      );
    } else if (candidateEvaluation.visibility.allowed) {
      canCreateChildTopic = this.allow();
    } else {
      canCreateChildTopic = this.deny(
        candidateEvaluation.visibility.reason ?? 'Insufficient forums access.',
      );
    }
    const canCreateTopLevelTopic = this.evaluateTopLevelTopicCreation(
      principal,
      restrictions,
      candidateEvaluation,
    );
    const canControlAnnouncement =
      this.evaluateAnnouncementControl(candidateEvaluation);

    return {
      canView: candidateEvaluation.visibility,
      canCreateTopLevelTopic: parentContext
        ? this.deny('Child topic only.')
        : canCreateTopLevelTopic,
      canCreateChildTopic: parentContext
        ? canCreateChildTopic
        : this.deny('Top-level topic only.'),
      canCreatePost: candidateEvaluation.visibility,
      canUpdateTopic: this.deny('Topic has not been created.'),
      canDeleteTopic: this.deny('Topic has not been created.'),
      canAddWatch: candidateEvaluation.visibility,
      canRemoveWatch: candidateEvaluation.visibility,
      canMarkRead: candidateEvaluation.visibility,
      canControlAnnouncement,
      canReceiveNotification: candidateEvaluation.visibility,
    };
  }

  /**
   * Evaluates whether a principal may access a candidate restriction set.
   *
   * @param principal Normalized forums principal for the current command.
   * @param restrictions Effective challenge and role restrictions.
   * @param options Optional member-targeted evaluation context.
   * @returns Decision for candidate visibility and write eligibility.
   * @throws Prisma errors when required external access facts cannot be loaded.
   */
  async decideForRestrictions(
    principal: ForumsPrincipal,
    restrictions: ForumsEffectiveRestrictions,
    options: ForumsAccessEvaluationOptions = {},
  ): Promise<ForumsAccessDecision> {
    return (
      await this.evaluateRestrictions(
        principal,
        {
          challengeId: restrictions.challengeId,
          roleName: restrictions.roleName,
          hasRestrictionConflict: false,
        },
        options,
      )
    ).visibility;
  }

  /**
   * Evaluates whether a principal may view an already-resolved restriction set.
   *
   * Read list filtering uses this wrapper when it has candidate rows and
   * inherited restriction values but does not need ownership-aware topic
   * decisions. The wrapper preserves the same conflict hiding, admin bypass,
   * M2M bypass, challenge access, resource, copilot, and role behavior as full
   * topic decisions.
   *
   * @param principal Normalized forums principal for the current read request.
   * @param target Effective restrictions plus conflict state for the row.
   * @param options Optional member-targeted evaluation context.
   * @returns Decision describing whether the row is visible.
   * @throws Prisma errors when required external access facts cannot be loaded.
   */
  async decideForRestrictionVisibility(
    principal: ForumsPrincipal,
    target: ForumsRestrictionVisibilityTarget,
    options: ForumsAccessEvaluationOptions = {},
  ): Promise<ForumsAccessDecision> {
    return (await this.evaluateRestrictions(principal, target, options))
      .visibility;
  }

  /**
   * Evaluates effective challenge/role restrictions for a principal.
   *
   * @param principal Normalized forums principal for the current command.
   * @param input Effective restrictions and conflict state for the target.
   * @param options Optional member-targeted evaluation context.
   * @returns Visibility plus elevation facts used by action decisions.
   * @throws Prisma errors when configured external adapter lookups fail.
   */
  private async evaluateRestrictions(
    principal: ForumsPrincipal,
    input: ForumsEffectiveRestrictions & { hasRestrictionConflict: boolean },
    options: ForumsAccessEvaluationOptions = {},
  ): Promise<RestrictionEvaluation> {
    const evaluationPrincipal = this.resolveEvaluationPrincipal(
      principal,
      options,
    );

    if (
      input.hasRestrictionConflict &&
      !evaluationPrincipal.isMachine &&
      !evaluationPrincipal.isAdmin
    ) {
      return {
        visibility: this.deny('Topic restrictions are inconsistent.'),
        isElevated: false,
        isChallengeCopilot: false,
      };
    }

    if (evaluationPrincipal.isMachine) {
      return {
        visibility: this.allow(),
        isElevated: true,
        isChallengeCopilot: false,
      };
    }

    if (evaluationPrincipal.isAdmin) {
      return {
        visibility: this.allow(),
        isElevated: true,
        isChallengeCopilot: false,
      };
    }

    if (!input.challengeId && !input.roleName) {
      return {
        visibility: this.allow(),
        isElevated: false,
        isChallengeCopilot: false,
      };
    }

    if (input.challengeId) {
      return this.evaluateChallengeRestrictions(evaluationPrincipal, input);
    }

    if (input.roleName && evaluationPrincipal.roles.includes(input.roleName)) {
      return {
        visibility: this.allow(),
        isElevated: false,
        isChallengeCopilot: false,
      };
    }

    return {
      visibility: this.deny('Required forum role is missing.'),
      isElevated: false,
      isChallengeCopilot: false,
    };
  }

  /**
   * Evaluates challenge-scoped visibility and copilot elevation.
   *
   * Challenge-copilot elevation can satisfy challenge-scoped targets, but it
   * does not bypass an effective forum role restriction; dual-restricted
   * targets require both challenge copilot status and a matching principal role.
   *
   * @param principal Normalized forums principal for the current command.
   * @param restrictions Effective challenge and optional role restrictions.
   * @returns Visibility plus challenge-copilot elevation facts.
   * @throws Prisma errors when configured external adapter lookups fail.
   */
  private async evaluateChallengeRestrictions(
    principal: ForumsPrincipal,
    restrictions: ForumsEffectiveRestrictions,
  ): Promise<RestrictionEvaluation> {
    const challengeId = restrictions.challengeId;

    if (!challengeId) {
      return {
        visibility: this.deny('Challenge restriction is missing.'),
        isElevated: false,
        isChallengeCopilot: false,
      };
    }

    const [challengeFacts, resourceFacts] = await Promise.all([
      this.challengeAccessService.getChallengeAccessFacts(
        challengeId,
        principal.memberId,
      ),
      this.resourceAccessService.getResourceAccessFacts(
        challengeId,
        principal.memberId,
      ),
    ]);

    if (!challengeFacts.configured) {
      return this.challengeDenied('Challenge access cannot be verified.');
    }

    if (!challengeFacts.challengeExists) {
      return this.challengeDenied('Challenge not found.');
    }

    const satisfiesForumRole =
      !restrictions.roleName || principal.roles.includes(restrictions.roleName);

    if (resourceFacts.isChallengeCopilot) {
      if (!satisfiesForumRole) {
        return {
          visibility: this.deny('Required forum role is missing.'),
          isElevated: false,
          isChallengeCopilot: false,
        };
      }

      return {
        visibility: this.allow(),
        isElevated: true,
        isChallengeCopilot: true,
      };
    }

    if (!this.hasChallengeAccess(challengeFacts, resourceFacts)) {
      return this.challengeDenied('Challenge access is required.');
    }

    if (!satisfiesForumRole) {
      return {
        visibility: this.deny('Required forum role is missing.'),
        isElevated: false,
        isChallengeCopilot: false,
      };
    }

    return {
      visibility: this.allow(),
      isElevated: false,
      isChallengeCopilot: false,
    };
  }

  /**
   * Applies announcement-control rules separate from ordinary topic edits.
   *
   * @param evaluation Restriction evaluation for the target or candidate topic.
   * @returns Decision allowing only M2M, admins, or challenge copilots.
   * @throws Does not throw.
   */
  private evaluateAnnouncementControl(
    evaluation: RestrictionEvaluation,
  ): ForumsAccessDecision {
    return evaluation.isElevated &&
      (evaluation.visibility.allowed || evaluation.isChallengeCopilot)
      ? this.allow()
      : this.deny('Announcement control requires elevated forums access.');
  }

  /**
   * Applies the approved root-topic creation rules.
   *
   * @param principal Normalized forums principal for the current command.
   * @param restrictions Candidate topic restrictions.
   * @param evaluation Candidate restriction evaluation for the requested topic.
   * @returns Decision for non-challenge and challenge root-topic creation.
   * @throws Does not throw.
   */
  private evaluateTopLevelTopicCreation(
    principal: ForumsPrincipal,
    restrictions: ForumsEffectiveRestrictions,
    evaluation: RestrictionEvaluation,
  ): ForumsAccessDecision {
    if (!evaluation.visibility.allowed) {
      return evaluation.visibility;
    }

    if (restrictions.challengeId) {
      return principal.isMachine
        ? this.deny('M2M callers cannot create top-level challenge topics.')
        : this.allow();
    }

    return principal.isMachine || evaluation.isElevated
      ? this.allow()
      : this.deny(
          'Top-level non-challenge topic creation requires an admin member or scoped M2M caller.',
        );
  }

  /**
   * Resolves which principal should be used for member-targeted checks.
   *
   * @param principal Acting caller principal from the authenticated token.
   * @param options Optional member-targeted evaluation context.
   * @returns Target member principal for scoped M2M on-behalf checks, otherwise the actor principal.
   * @throws Does not throw.
   */
  private resolveEvaluationPrincipal(
    principal: ForumsPrincipal,
    options: ForumsAccessEvaluationOptions,
  ): ForumsPrincipal {
    return principal.isMachine && options.memberTargetPrincipal
      ? options.memberTargetPrincipal
      : principal;
  }

  /**
   * Determines whether challenge access is satisfied by challenge or resource facts.
   *
   * @param challengeFacts Challenge-domain member access facts.
   * @param resourceFacts Resource-domain challenge assignment facts.
   * @returns `true` when the member can access the challenge.
   * @throws Does not throw.
   */
  private hasChallengeAccess(
    challengeFacts: ChallengeAccessFacts,
    resourceFacts: ResourceAccessFacts,
  ): boolean {
    return (
      challengeFacts.memberHasChallengeAccess ||
      resourceFacts.hasChallengeResource ||
      resourceFacts.hasFullReadAccess ||
      resourceFacts.hasFullWriteAccess
    );
  }

  /**
   * Checks whether a topic target may participate in command decisions.
   *
   * @param context Loaded topic context.
   * @returns `true` when the topic and ancestors are not deleted.
   * @throws Does not throw.
   */
  private isTopicTargetAvailable(context: ForumsTopicContext): boolean {
    return !context.topic.deletedAt && !context.hasDeletedAncestor;
  }

  /**
   * Creates a challenge-denied evaluation result.
   *
   * @param reason Human-readable denial reason.
   * @returns Restriction evaluation with no elevation.
   * @throws Does not throw.
   */
  private challengeDenied(reason: string): RestrictionEvaluation {
    return {
      visibility: this.deny(reason),
      isElevated: false,
      isChallengeCopilot: false,
    };
  }

  /**
   * Creates an allow decision.
   *
   * @returns Decision object with `allowed` set to true.
   * @throws Does not throw.
   */
  private allow(): ForumsAccessDecision {
    return { allowed: true };
  }

  /**
   * Creates a deny decision.
   *
   * @param reason Human-readable denial reason.
   * @returns Decision object with `allowed` set to false.
   * @throws Does not throw.
   */
  private deny(reason: string): ForumsAccessDecision {
    return { allowed: false, reason };
  }

  /**
   * Creates a fully denied topic decision matrix.
   *
   * @param reason Human-readable denial reason.
   * @returns Topic action decisions all denied with the same reason.
   * @throws Does not throw.
   */
  private denyTopicDecisions(reason: string): ForumsTopicAccessDecisions {
    const decision = this.deny(reason);

    return {
      canView: decision,
      canCreateTopLevelTopic: decision,
      canCreateChildTopic: decision,
      canCreatePost: decision,
      canUpdateTopic: decision,
      canDeleteTopic: decision,
      canAddWatch: decision,
      canRemoveWatch: decision,
      canMarkRead: decision,
      canControlAnnouncement: decision,
      canReceiveNotification: decision,
    };
  }
}
