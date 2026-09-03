import { Post, Topic } from '../../prisma/generated/client';
import {
  ChallengeAccessFacts,
  ChallengeAccessService,
} from './challenge-access.service';
import { ForumsAccessPolicyService } from './forums-access-policy.service';
import {
  ForumsPostContext,
  ForumsPrincipal,
  ForumsTopicContext,
} from './forums-access.types';
import {
  ResourceAccessFacts,
  ResourceAccessService,
} from './resource-access.service';

const createdAt = new Date('2026-06-04T00:00:00.000Z');
const dualRestrictedTarget = {
  challengeId: 'challenge-1',
  roleName: 'reviewer',
  hasRestrictionConflict: false,
};
const challengeChildTopicDenyReason =
  'Child-topic creation is only allowed for non-challenge effective contexts.';

interface PolicyHarness {
  challengeAccessService: jest.Mocked<
    Pick<ChallengeAccessService, 'getChallengeAccessFacts'>
  >;
  resourceAccessService: jest.Mocked<
    Pick<ResourceAccessService, 'getResourceAccessFacts'>
  >;
  service: ForumsAccessPolicyService;
}

/**
 * Creates a forums access policy service with lightweight access adapters.
 *
 * @param facts Optional challenge and resource facts used by the mocked adapters.
 * @returns Policy service and dependency mocks for focused authorization tests.
 * @throws Does not throw.
 */
function createPolicyHarness(
  facts: {
    challengeFacts?: Partial<ChallengeAccessFacts>;
    resourceFacts?: Partial<ResourceAccessFacts>;
  } = {},
): PolicyHarness {
  const challengeFacts: ChallengeAccessFacts = {
    configured: true,
    challengeExists: true,
    memberHasChallengeAccess: false,
    memberIsWhitelisted: false,
    ...facts.challengeFacts,
  };
  const resourceFacts: ResourceAccessFacts = {
    configured: true,
    hasChallengeResource: false,
    isChallengeCopilot: false,
    hasFullReadAccess: false,
    hasFullWriteAccess: false,
    roleNames: [],
    ...facts.resourceFacts,
  };
  const challengeAccessService = {
    getChallengeAccessFacts: jest.fn().mockResolvedValue(challengeFacts),
  };
  const resourceAccessService = {
    getResourceAccessFacts: jest.fn().mockResolvedValue(resourceFacts),
  };

  return {
    challengeAccessService,
    resourceAccessService,
    service: new ForumsAccessPolicyService(
      challengeAccessService as unknown as ChallengeAccessService,
      resourceAccessService as unknown as ResourceAccessService,
    ),
  };
}

/**
 * Builds a normalized forums principal for policy tests.
 *
 * @param overrides Principal fields to override for a scenario.
 * @returns Forums principal consumed by the access policy.
 * @throws Does not throw.
 */
function makePrincipal(
  overrides: Partial<ForumsPrincipal> = {},
): ForumsPrincipal {
  return {
    memberId: 'member-1',
    roles: [],
    scopes: [],
    isAdmin: false,
    isMachine: false,
    ...overrides,
  };
}

/**
 * Builds a persisted topic row for policy authorization tests.
 *
 * @param overrides Topic fields to override.
 * @returns Topic row compatible with the generated Prisma type.
 * @throws Does not throw.
 */
function makeTopic(overrides: Partial<Topic> = {}): Topic {
  return {
    id: 'topic-1',
    parentTopicId: null,
    challengeId: 'challenge-1',
    roleName: 'reviewer',
    title: 'Restricted topic',
    isAnnouncement: false,
    locked: false,
    lockedAt: null,
    lockedByMemberId: null,
    authorMemberId: 'author-1',
    authorHandle: 'author',
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    deletedByMemberId: null,
    ...overrides,
  };
}

/**
 * Builds a persisted post row for policy authorization tests.
 *
 * @param overrides Post fields to override.
 * @returns Post row compatible with the generated Prisma type.
 * @throws Does not throw.
 */
function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 'post-1',
    topicId: 'topic-1',
    parentType: 'TOPIC',
    parentId: 'topic-1',
    authorMemberId: 'author-1',
    authorHandle: 'author',
    content: 'Restricted post content',
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    deletedByMemberId: null,
    ...overrides,
  };
}

/**
 * Builds an ownership-aware topic context for policy authorization tests.
 *
 * @param overrides Topic context fields to override.
 * @returns Topic context consumed by topic-level policy decisions.
 * @throws Does not throw.
 */
function makeTopicContext(
  overrides: Partial<ForumsTopicContext> = {},
): ForumsTopicContext {
  const effectiveChallengeId = overrides.effectiveChallengeId ?? 'challenge-1';
  const effectiveRoleName =
    overrides.effectiveRoleName === undefined
      ? 'reviewer'
      : overrides.effectiveRoleName;
  const topic =
    overrides.topic ??
    makeTopic({
      challengeId: effectiveChallengeId,
      roleName: effectiveRoleName,
    });

  return {
    topic,
    ancestors: [topic],
    effectiveChallengeId,
    effectiveRoleName,
    ancestorChallengeId: null,
    ancestorRoleName: null,
    hasDeletedAncestor: false,
    hasRestrictionConflict: false,
    isTopicAuthor: false,
    ...overrides,
  };
}

/**
 * Builds an ownership-aware post context for policy authorization tests.
 *
 * @param overrides Post context fields to override.
 * @returns Post context consumed by post-level policy decisions.
 * @throws Does not throw.
 */
function makePostContext(
  overrides: Partial<ForumsPostContext> = {},
): ForumsPostContext {
  const topicContext = makeTopicContext(overrides);
  const post = overrides.post ?? makePost({ topicId: topicContext.topic.id });

  return {
    ...topicContext,
    post,
    isPostAuthor: false,
    ...overrides,
  };
}

describe('ForumsAccessPolicyService', () => {
  it('allows and elevates a challenge copilot when the effective forum role matches', async () => {
    const { service } = createPolicyHarness({
      resourceFacts: {
        hasChallengeResource: true,
        isChallengeCopilot: true,
      },
    });
    const principal = makePrincipal({ roles: ['reviewer'] });

    await expect(
      service.decideForRestrictionVisibility(principal, dualRestrictedTarget),
    ).resolves.toEqual({ allowed: true });

    const topicDecisions = await service.decideForTopic(
      principal,
      makeTopicContext(),
    );
    const postDecisions = await service.decideForPost(
      principal,
      makePostContext(),
    );

    expect(topicDecisions.canView).toEqual({ allowed: true });
    expect(topicDecisions.canUpdateTopic).toEqual({ allowed: true });
    expect(topicDecisions.canDeleteTopic).toEqual({
      allowed: false,
      reason: 'Only an administrator may delete a topic.',
    });
    expect(topicDecisions.canControlAnnouncement).toEqual({ allowed: true });
    expect(postDecisions.canUpdatePost).toEqual({ allowed: true });
    expect(postDecisions.canDeletePost).toEqual({ allowed: true });
  });

  it('denies dual-restricted visibility and elevation for a challenge copilot without the role', async () => {
    const { service } = createPolicyHarness({
      resourceFacts: {
        hasChallengeResource: true,
        isChallengeCopilot: true,
      },
    });
    const principal = makePrincipal();
    const expectedRoleDenial = {
      allowed: false,
      reason: 'Required forum role is missing.',
    };

    await expect(
      service.decideForRestrictionVisibility(principal, dualRestrictedTarget),
    ).resolves.toEqual(expectedRoleDenial);
    await expect(
      service.decideForRestrictions(principal, {
        challengeId: 'challenge-1',
        roleName: 'reviewer',
      }),
    ).resolves.toEqual(expectedRoleDenial);

    const createDecisions = await service.decideForCreateTopic(principal, {
      challengeId: 'challenge-1',
      roleName: 'reviewer',
    });
    const topicDecisions = await service.decideForTopic(
      principal,
      makeTopicContext(),
    );
    const postDecisions = await service.decideForPost(
      principal,
      makePostContext(),
    );

    expect(createDecisions.canView).toEqual(expectedRoleDenial);
    expect(createDecisions.canCreateTopLevelTopic).toEqual(expectedRoleDenial);
    expect(topicDecisions.canView).toEqual(expectedRoleDenial);
    expect(topicDecisions.canCreatePost).toEqual(expectedRoleDenial);
    expect(topicDecisions.canUpdateTopic.allowed).toBe(false);
    expect(topicDecisions.canControlAnnouncement.allowed).toBe(false);
    expect(topicDecisions.canReceiveNotification).toEqual(expectedRoleDenial);
    expect(postDecisions.canUpdatePost.allowed).toBe(false);
    expect(postDecisions.canDeletePost.allowed).toBe(false);
  });

  it('keeps challenge-only copilot visibility and elevation intact', async () => {
    const { service } = createPolicyHarness({
      resourceFacts: {
        hasChallengeResource: true,
        isChallengeCopilot: true,
      },
    });
    const principal = makePrincipal();
    const challengeOnlyContext = makeTopicContext({
      effectiveRoleName: null,
    });

    await expect(
      service.decideForRestrictionVisibility(principal, {
        challengeId: 'challenge-1',
        roleName: null,
        hasRestrictionConflict: false,
      }),
    ).resolves.toEqual({ allowed: true });

    const createDecisions = await service.decideForCreateTopic(principal, {
      challengeId: 'challenge-1',
      roleName: null,
    });
    const topicDecisions = await service.decideForTopic(
      principal,
      challengeOnlyContext,
    );

    expect(createDecisions.canCreateTopLevelTopic).toEqual({ allowed: true });
    expect(createDecisions.canControlAnnouncement).toEqual({ allowed: true });
    expect(topicDecisions.canView).toEqual({ allowed: true });
    expect(topicDecisions.canUpdateTopic).toEqual({ allowed: true });
    expect(topicDecisions.canDeleteTopic.allowed).toBe(false);
    expect(topicDecisions.canControlAnnouncement).toEqual({ allowed: true });
  });

  it('lets an author edit but not delete their own topic', async () => {
    const { service } = createPolicyHarness();
    const decisions = await service.decideForTopic(
      makePrincipal({ memberId: 'author-1' }),
      makeTopicContext({
        effectiveChallengeId: null,
        effectiveRoleName: null,
        isTopicAuthor: true,
      }),
    );

    expect(decisions.canUpdateTopic).toEqual({ allowed: true });
    expect(decisions.canDeleteTopic).toEqual({
      allowed: false,
      reason: 'Only an administrator may delete a topic.',
    });
  });

  it('allows general public child-topic creation', async () => {
    const { service } = createPolicyHarness();
    const principal = makePrincipal();
    const parentContext = makeTopicContext({
      effectiveChallengeId: null,
      effectiveRoleName: null,
      topic: makeTopic({
        challengeId: null,
        roleName: null,
      }),
    });

    const createDecisions = await service.decideForCreateTopic(
      principal,
      {
        challengeId: null,
        roleName: null,
      },
      parentContext,
    );

    expect(createDecisions.canCreateChildTopic).toEqual({ allowed: true });
  });

  it('rejects challenge-scoped child-topic creation under a general parent', async () => {
    const { challengeAccessService, resourceAccessService, service } =
      createPolicyHarness();
    const principal = makePrincipal();
    const parentContext = makeTopicContext({
      effectiveChallengeId: null,
      effectiveRoleName: null,
      topic: makeTopic({
        challengeId: null,
        roleName: null,
      }),
    });

    challengeAccessService.getChallengeAccessFacts.mockRejectedValue(
      new Error('Unexpected challenge access lookup.'),
    );
    resourceAccessService.getResourceAccessFacts.mockRejectedValue(
      new Error('Unexpected resource access lookup.'),
    );

    const createDecisions = await service.decideForCreateTopic(
      principal,
      {
        challengeId: 'challenge-1',
        roleName: null,
      },
      parentContext,
    );

    expect(createDecisions.canView).toEqual({ allowed: true });
    expect(createDecisions.canCreateChildTopic).toEqual({
      allowed: false,
      reason: challengeChildTopicDenyReason,
    });
    expect(
      challengeAccessService.getChallengeAccessFacts,
    ).not.toHaveBeenCalled();
    expect(resourceAccessService.getResourceAccessFacts).not.toHaveBeenCalled();
  });

  it('rejects child-topic creation under challenge and role-restricted parents', async () => {
    const { service } = createPolicyHarness({
      challengeFacts: {
        memberHasChallengeAccess: true,
      },
    });
    const principal = makePrincipal({ roles: ['reviewer'] });

    const createDecisions = await service.decideForCreateTopic(
      principal,
      {
        challengeId: 'challenge-1',
        roleName: 'reviewer',
      },
      makeTopicContext(),
    );

    expect(createDecisions.canView).toEqual({ allowed: true });
    expect(createDecisions.canCreateChildTopic).toEqual({
      allowed: false,
      reason: challengeChildTopicDenyReason,
    });
  });

  it('requires both challenge access and forum role on dual-restricted topics', async () => {
    const withChallengeAccess = createPolicyHarness({
      challengeFacts: {
        memberHasChallengeAccess: true,
      },
    });
    const matchingRolePrincipal = makePrincipal({ roles: ['reviewer'] });
    const missingRolePrincipal = makePrincipal();

    await expect(
      withChallengeAccess.service.decideForRestrictionVisibility(
        matchingRolePrincipal,
        dualRestrictedTarget,
      ),
    ).resolves.toEqual({ allowed: true });
    await expect(
      withChallengeAccess.service.decideForRestrictionVisibility(
        missingRolePrincipal,
        dualRestrictedTarget,
      ),
    ).resolves.toEqual({
      allowed: false,
      reason: 'Required forum role is missing.',
    });

    const noChallengeAccess = createPolicyHarness();

    await expect(
      noChallengeAccess.service.decideForRestrictionVisibility(
        matchingRolePrincipal,
        dualRestrictedTarget,
      ),
    ).resolves.toEqual({
      allowed: false,
      reason: 'Challenge access is required.',
    });
  });

  it('keeps admin and machine restriction bypasses ahead of challenge and role checks', async () => {
    const { challengeAccessService, resourceAccessService, service } =
      createPolicyHarness({
        challengeFacts: {
          configured: false,
          challengeExists: false,
        },
      });
    const conflictingTarget = {
      ...dualRestrictedTarget,
      hasRestrictionConflict: true,
    };
    const adminPrincipal = makePrincipal({
      roles: ['administrator'],
      isAdmin: true,
    });
    const machinePrincipal = makePrincipal({
      memberId: null,
      isMachine: true,
    });

    await expect(
      service.decideForRestrictionVisibility(adminPrincipal, conflictingTarget),
    ).resolves.toEqual({ allowed: true });
    await expect(
      service.decideForRestrictionVisibility(
        machinePrincipal,
        conflictingTarget,
      ),
    ).resolves.toEqual({ allowed: true });

    const adminTopicDecisions = await service.decideForTopic(
      adminPrincipal,
      makeTopicContext({ hasRestrictionConflict: true }),
    );
    const machineTopicDecisions = await service.decideForTopic(
      machinePrincipal,
      makeTopicContext({ hasRestrictionConflict: true }),
    );

    expect(adminTopicDecisions.canUpdateTopic).toEqual({ allowed: true });
    expect(machineTopicDecisions.canUpdateTopic).toEqual({ allowed: true });
    expect(adminTopicDecisions.canDeleteTopic).toEqual({ allowed: true });
    expect(machineTopicDecisions.canDeleteTopic).toEqual({ allowed: true });
    expect(
      challengeAccessService.getChallengeAccessFacts,
    ).not.toHaveBeenCalled();
    expect(resourceAccessService.getResourceAccessFacts).not.toHaveBeenCalled();
  });
});
