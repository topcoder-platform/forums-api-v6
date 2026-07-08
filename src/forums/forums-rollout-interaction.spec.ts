import { JwtUser } from '../auth/jwt.service';
import { Post, Topic } from '../../prisma/generated/client';
import { ForumsCommandService } from './forums-command.service';

const createdAt = new Date('2026-06-04T00:00:00.000Z');

/**
 * Builds a persisted topic row for the rollout interaction spec.
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
    authorMemberId: '1',
    authorHandle: 'author',
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    deletedByMemberId: null,
    ...overrides,
  };
}

/**
 * Builds a persisted post row for the rollout interaction spec.
 *
 * @param overrides Post fields to override.
 * @returns Post row compatible with the generated Prisma type.
 * @throws Does not throw.
 */
function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 'starter-1',
    topicId: 'child-1',
    parentType: 'TOPIC',
    parentId: 'child-1',
    authorMemberId: '1',
    authorHandle: 'author',
    content: 'Restricted starter content',
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    deletedByMemberId: null,
    ...overrides,
  };
}

describe('forums rollout interaction', () => {
  it('carries restricted child-topic context from write access into notification filtering', async () => {
    const parentTopic = makeTopic({ id: 'parent-1', parentTopicId: null });
    const childTopic = makeTopic({
      id: 'child-1',
      parentTopicId: 'parent-1',
      title: 'Restricted child',
    });
    const starterPost = makePost();
    const tx = {
      topic: {
        findUnique: jest.fn().mockResolvedValue(parentTopic),
        create: jest.fn().mockResolvedValue(childTopic),
      },
      post: {
        create: jest.fn().mockResolvedValue(starterPost),
      },
      topicClosure: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest
          .fn()
          .mockResolvedValue([{ ancestorTopicId: 'parent-1', depth: 0 }]),
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      topicWatch: {
        upsert: jest.fn().mockResolvedValue(undefined),
      },
      topicReadState: {
        upsert: jest.fn().mockResolvedValue(undefined),
      },
    };
    type TxMock = typeof tx;
    const db = {
      $transaction: jest.fn(
        async (callback: (transaction: TxMock) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const accessPolicyService = {
      decideForCreateTopic: jest.fn().mockResolvedValue({
        canCreateChildTopic: { allowed: true },
        canCreateTopLevelTopic: { allowed: false },
        canControlAnnouncement: { allowed: true },
      }),
    };
    const topicContextService = {
      loadTopicContext: jest.fn().mockResolvedValue({
        topic: parentTopic,
        ancestors: [parentTopic],
        effectiveChallengeId: 'challenge-1',
        effectiveRoleName: 'reviewer',
        ancestorChallengeId: null,
        ancestorRoleName: null,
        hasDeletedAncestor: false,
        hasRestrictionConflict: false,
        isTopicAuthor: false,
      }),
    };
    const notificationService = {
      publishPostNotification: jest.fn().mockResolvedValue(undefined),
    };
    const moderationService = {
      decideForRequestActorBan: jest.fn().mockResolvedValue({ allowed: true }),
      decideForLockedTopicMutation: jest.fn().mockResolvedValue({
        allowed: true,
      }),
    };
    const service = new ForumsCommandService(
      db as any,
      accessPolicyService as any,
      topicContextService as any,
      {} as any,
      {} as any,
      {} as any,
      notificationService as any,
      moderationService as any,
    );
    const user: JwtUser = {
      userId: '1',
      handle: 'author',
      roles: ['reviewer'],
      scopes: [],
      isMachine: false,
    };

    await service.createTopic(
      {
        title: 'Restricted child',
        content: 'Restricted starter content',
        parentTopicId: 'parent-1',
      },
      user,
    );

    expect(accessPolicyService.decideForCreateTopic).toHaveBeenCalledWith(
      expect.objectContaining({ memberId: '1' }),
      { challengeId: 'challenge-1', roleName: 'reviewer' },
      expect.objectContaining({ topic: parentTopic }),
    );
    expect(notificationService.publishPostNotification).toHaveBeenCalledWith({
      operationName: 'createTopic',
      post: starterPost,
      topic: childTopic,
      restrictions: {
        challengeId: 'challenge-1',
        roleName: 'reviewer',
        hasRestrictionConflict: false,
      },
    });
  });
});
