import { BadRequestException } from '@nestjs/common';
import { Post, Topic } from '../../prisma/generated/client';
import { JwtUser } from '../auth/jwt.service';

export const FORUMS_ADMIN_ROLE = 'administrator';

/**
 * Request-independent forums principal consumed by access policy checks.
 *
 * Controllers and command services build this shape from validated JWTs today.
 * Later read and notification paths can build the same structure from
 * directory data without coupling the policy to HTTP request payloads.
 */
export interface ForumsPrincipal {
  memberId: string | null;
  roles: readonly string[];
  scopes: readonly string[];
  isAdmin: boolean;
  isMachine: boolean;
}

/**
 * Member principal used when a scoped M2M caller performs a member-targeted
 * command such as watch or read-state mutation on behalf of a member.
 */
export interface ForumsMemberTargetPrincipal extends ForumsPrincipal {
  memberId: string;
  isMachine: false;
}

/**
 * Optional policy evaluation context for member-targeted commands.
 */
export interface ForumsAccessEvaluationOptions {
  memberTargetPrincipal?: ForumsMemberTargetPrincipal;
}

/**
 * Effective restriction values used for topic and post visibility checks.
 */
export interface ForumsEffectiveRestrictions {
  challengeId: string | null;
  roleName: string | null;
}

/**
 * Restriction-only visibility target used by read paths that already loaded
 * topic rows but do not need full ownership-aware topic context.
 */
export interface ForumsRestrictionVisibilityTarget extends ForumsEffectiveRestrictions {
  hasRestrictionConflict: boolean;
}

/**
 * Monotonic topic restriction values resolved for storage and runtime checks.
 */
export interface ForumsResolvedRestrictions {
  storedChallengeId: string | null;
  storedRoleName: string | null;
  effectiveChallengeId: string | null;
  effectiveRoleName: string | null;
}

/**
 * Restriction values supplied by a topic create request.
 */
export interface ForumsRequestedRestrictions {
  challengeId?: string | null;
  roleName?: string | null;
}

/**
 * Ownership-aware context for topic-level authorization decisions.
 */
export interface ForumsTopicContext {
  topic: Topic;
  ancestors: readonly Topic[];
  effectiveChallengeId: string | null;
  effectiveRoleName: string | null;
  ancestorChallengeId: string | null;
  ancestorRoleName: string | null;
  hasDeletedAncestor: boolean;
  hasRestrictionConflict: boolean;
  isTopicAuthor: boolean;
}

/**
 * Ownership-aware context for post-level authorization decisions.
 */
export interface ForumsPostContext extends ForumsTopicContext {
  post: Post;
  isPostAuthor: boolean;
}

/**
 * Result of one authorization action check.
 */
export interface ForumsAccessDecision {
  allowed: boolean;
  reason?: string;
}

/**
 * Complete decision matrix returned for a topic target.
 */
export interface ForumsTopicAccessDecisions {
  canView: ForumsAccessDecision;
  canCreateTopLevelTopic: ForumsAccessDecision;
  canCreateChildTopic: ForumsAccessDecision;
  canCreatePost: ForumsAccessDecision;
  canUpdateTopic: ForumsAccessDecision;
  canDeleteTopic: ForumsAccessDecision;
  canAddWatch: ForumsAccessDecision;
  canRemoveWatch: ForumsAccessDecision;
  canMarkRead: ForumsAccessDecision;
  canControlAnnouncement: ForumsAccessDecision;
  canReceiveNotification: ForumsAccessDecision;
}

/**
 * Complete decision matrix returned for a post target.
 */
export interface ForumsPostAccessDecisions extends ForumsTopicAccessDecisions {
  canUpdatePost: ForumsAccessDecision;
  canDeletePost: ForumsAccessDecision;
}

/**
 * Normalizes an optional text field into a trimmed string.
 *
 * @param value Raw input value from a token, DTO, or stored row.
 * @returns Trimmed string, or `undefined` when the value is empty.
 * @throws Does not throw.
 */
export function normalizeForumsOptionalText(
  value: string | null | undefined,
): string | undefined {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
}

/**
 * Normalizes a forum role restriction for persistence and comparison.
 *
 * @param value Raw role restriction from a DTO or stored row.
 * @returns Lowercase trimmed role string, or `null` when no role remains.
 * @throws Does not throw.
 */
export function normalizeForumRoleName(
  value: string | null | undefined,
): string | null {
  return normalizeForumsOptionalText(value)?.toLowerCase() ?? null;
}

/**
 * Normalizes JWT role claims for case-insensitive policy checks.
 *
 * @param roles Role values from a token or directory source.
 * @returns Deduplicated lowercase role names.
 * @throws Does not throw.
 */
export function normalizeForumsRoles(
  roles: readonly string[] | undefined,
): string[] {
  return Array.from(
    new Set(
      (roles ?? [])
        .map((role) => normalizeForumRoleName(role))
        .filter((role): role is string => Boolean(role)),
    ),
  );
}

/**
 * Builds a reusable forums principal from the validated JWT payload.
 *
 * @param user Normalized token payload from the auth middleware.
 * @returns Forums principal, or `undefined` when no authenticated token exists.
 * @throws Does not throw.
 */
export function buildForumsPrincipal(
  user: JwtUser | undefined,
): ForumsPrincipal | undefined {
  if (!user) {
    return undefined;
  }

  const roles = normalizeForumsRoles(user.roles);
  const scopes = (user.scopes ?? [])
    .map((scope) => scope.trim())
    .filter((scope) => scope.length > 0);
  const memberId = normalizeForumsOptionalText(user.userId) ?? null;

  return {
    memberId,
    roles,
    scopes,
    isAdmin: roles.includes(FORUMS_ADMIN_ROLE),
    isMachine: user.isMachine,
  };
}

/**
 * Builds a non-machine forums principal for an explicit target member.
 *
 * @param memberId Target member id supplied by a scoped M2M command.
 * @param roles Directory roles resolved for the target member.
 * @returns Forums principal for evaluating the target member's access.
 * @throws Does not throw.
 */
export function buildForumsMemberTargetPrincipal(
  memberId: string,
  roles: readonly string[],
): ForumsMemberTargetPrincipal {
  const normalizedRoles = normalizeForumsRoles(roles);

  return {
    memberId,
    roles: normalizedRoles,
    scopes: [],
    isAdmin: normalizedRoles.includes(FORUMS_ADMIN_ROLE),
    isMachine: false,
  };
}

/**
 * Resolves child topic restrictions against inherited parent restrictions.
 *
 * Omitted child fields inherit from the effective parent chain. Explicit child
 * values may only add restrictions or repeat inherited values; inherited
 * non-null challenge or role values cannot be cleared or replaced.
 *
 * @param parent Effective parent restrictions, or `undefined` for top-level topics.
 * @param requested Normalized create-request restrictions.
 * @returns Stored and effective restriction values for the new topic.
 * @throws BadRequestException when a child attempts to widen or conflict with inherited visibility.
 */
export function resolveMonotonicTopicRestrictions(
  parent: ForumsEffectiveRestrictions | undefined,
  requested: ForumsRequestedRestrictions,
): ForumsResolvedRestrictions {
  const storedChallengeId = resolveInheritedRestriction(
    'challengeId',
    parent?.challengeId ?? null,
    requested.challengeId,
  );
  const storedRoleName = resolveInheritedRestriction(
    'roleName',
    parent?.roleName ?? null,
    requested.roleName,
  );

  return {
    storedChallengeId,
    storedRoleName,
    effectiveChallengeId: storedChallengeId,
    effectiveRoleName: storedRoleName,
  };
}

/**
 * Resolves a topic role update without allowing visibility widening.
 *
 * @param ancestorRoleName Effective role inherited from ancestors, excluding the target topic.
 * @param currentEffectiveRoleName Current effective role for the target topic.
 * @param requestedRoleName Normalized role requested by the update body.
 * @returns Role value that may be persisted on the target topic.
 * @throws BadRequestException when the request clears or changes a non-null effective role.
 */
export function resolveMonotonicRoleNameUpdate(
  ancestorRoleName: string | null,
  currentEffectiveRoleName: string | null,
  requestedRoleName: string | null,
): string | null {
  if (ancestorRoleName) {
    if (requestedRoleName !== ancestorRoleName) {
      throw new BadRequestException(
        'Topic roleName cannot clear or replace an inherited role restriction.',
      );
    }

    return ancestorRoleName;
  }

  if (
    currentEffectiveRoleName &&
    requestedRoleName !== currentEffectiveRoleName
  ) {
    throw new BadRequestException(
      'Topic roleName cannot widen or replace an existing role restriction.',
    );
  }

  return requestedRoleName;
}

/**
 * Resolves one inherited restriction value for child topic creation.
 *
 * @param fieldName Name used in validation errors.
 * @param inheritedValue Effective value inherited from the parent chain.
 * @param requestedValue Normalized value supplied by the child request.
 * @returns Stored value for the child topic.
 * @throws BadRequestException when the requested value conflicts with inheritance.
 */
function resolveInheritedRestriction(
  fieldName: 'challengeId' | 'roleName',
  inheritedValue: string | null,
  requestedValue: string | null | undefined,
): string | null {
  if (!inheritedValue) {
    return requestedValue ?? null;
  }

  if (requestedValue === undefined) {
    return inheritedValue;
  }

  if (requestedValue === inheritedValue) {
    return inheritedValue;
  }

  throw new BadRequestException(
    `Child topic ${fieldName} cannot clear or replace an inherited restriction.`,
  );
}
