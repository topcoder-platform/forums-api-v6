import { Logger } from '@nestjs/common';
import { JwtUser } from '../auth/jwt.service';
import { Post, PostReactionType, Topic } from '../../prisma/generated/client';
import { CreatePostDto, UpdateTopicDto } from './dto/forums-command.dto';
import { ForumsCommandService } from './forums-command.service';

const createdAt = new Date('2026-06-04T00:00:00.000Z');
const challengeChildTopicDenyReason =
  'Child-topic creation is only allowed for non-challenge effective contexts.';

/**
 * Builds a persisted topic row for command service tests.
 *
 * @param overrides Topic fields to override.
 * @returns Topic row compatible with the generated Prisma type.
 * @throws Does not throw.
 */
function makeTopic(overrides: Partial<Topic> = {}): Topic {
  return {
    id: 'topic-1',
    parentTopicId: null,
    challengeId: null,
    roleName: null,
    title: 'Topic title',
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
 * Builds a persisted post row for command service tests.
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
    authorMemberId: '1',
    authorHandle: 'author',
    content: 'Persisted content',
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    deletedByMemberId: null,
    ...overrides,
  };
}

/**
 * Creates a command service with mocked dependencies.
 *
 * @param order Optional event-order array used by commit timing assertions.
 * @returns Service and mocks used by command-side tests.
 * @throws Does not throw.
 */
function createCommandService(order: string[] = []) {
  const topic = makeTopic();
  const post = makePost();
  const tx = {
    topic: {
      findUnique: jest.fn().mockResolvedValue(topic),
      create: jest.fn().mockResolvedValue(topic),
      update: jest.fn().mockResolvedValue(topic),
    },
    post: {
      create: jest.fn().mockImplementation(() => {
        order.push('post.create');
        return post;
      }),
      findFirst: jest.fn(),
      findUnique: jest.fn().mockResolvedValue(post),
      update: jest.fn().mockResolvedValue(post),
    },
    postReaction: {
      upsert: jest.fn().mockResolvedValue({
        postId: 'post-1',
        memberId: '1',
        reaction: PostReactionType.THUMBS_UP,
        createdAt,
        updatedAt: createdAt,
      }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      count: jest.fn().mockImplementation(
        (args: { where: { reaction: PostReactionType } }) =>
          args.where.reaction === PostReactionType.THUMBS_UP ? 2 : 1,
      ),
    },
    topicClosure: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      createMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    topicWatch: {
      upsert: jest.fn().mockResolvedValue({
        topicId: 'topic-1',
        memberId: '2',
        createdAt,
      }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    topicReadState: {
      upsert: jest.fn().mockResolvedValue({
        topicId: 'topic-1',
        memberId: '2',
        lastReadAt: createdAt,
      }),
    },
  };
  type TxMock = typeof tx;
  const db = {
    $transaction: jest.fn(
      async (callback: (transaction: TxMock) => Promise<unknown>) => {
        const result = await callback(tx);
        order.push('commit');
        return result;
      },
    ),
    topicClosure: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
  const accessPolicyService = {
    decideForTopic: jest.fn().mockResolvedValue({
      canAddWatch: { allowed: true },
      canCreatePost: { allowed: true },
      canControlAnnouncement: { allowed: true },
      canDeleteTopic: { allowed: true },
      canMarkRead: { allowed: true },
      canRemoveWatch: { allowed: true },
      canUpdateTopic: { allowed: true },
    }),
    decideForPost: jest.fn().mockResolvedValue({
      canView: { allowed: true },
      canDeletePost: { allowed: true },
      canUpdatePost: { allowed: true },
    }),
    decideForCreateTopic: jest.fn().mockResolvedValue({
      canCreateChildTopic: { allowed: true },
      canCreateTopLevelTopic: { allowed: true },
      canControlAnnouncement: { allowed: true },
    }),
    decideForRestrictions: jest.fn().mockResolvedValue({ allowed: true }),
  };
  const topicContextService = {
    loadTopicContext: jest.fn().mockResolvedValue({
      topic,
      ancestors: [topic],
      effectiveChallengeId: null,
      effectiveRoleName: null,
      ancestorChallengeId: null,
      ancestorRoleName: null,
      hasDeletedAncestor: false,
      hasRestrictionConflict: false,
      isTopicAuthor: true,
    }),
    loadPostContext: jest.fn().mockResolvedValue({
      topic,
      ancestors: [topic],
      effectiveChallengeId: null,
      effectiveRoleName: null,
      ancestorChallengeId: null,
      ancestorRoleName: null,
      hasDeletedAncestor: false,
      hasRestrictionConflict: false,
      isTopicAuthor: true,
      post,
      isPostAuthor: true,
    }),
  };
  const memberDirectoryService = {
    getMembersByIds: jest.fn().mockResolvedValue([
      {
        memberId: '2',
        email: 'target@example.com',
        handle: 'target',
      },
    ]),
  };
  const identityAccessService = {
    getMemberRoleNames: jest.fn(),
    resolveMemberAccessProfile: jest.fn().mockResolvedValue({
      memberId: '2',
      roles: ['Reviewer'],
    }),
  };
  const memberHandleService = {
    resolveHandleByMemberId: jest.fn(),
  };
  const notificationService = {
    publishPostNotification: jest.fn().mockImplementation(() => {
      order.push('notify');
      return Promise.resolve();
    }),
  };
  const moderationService = {
    decideForRequestActorBan: jest.fn().mockResolvedValue({ allowed: true }),
    decideForTargetMemberBan: jest.fn().mockResolvedValue({ allowed: true }),
    decideForLockedTopicMutation: jest.fn().mockResolvedValue({
      allowed: true,
    }),
  };
  const service = new ForumsCommandService(
    db as any,
    accessPolicyService as any,
    topicContextService as any,
    memberDirectoryService as any,
    identityAccessService as any,
    memberHandleService as any,
    notificationService as any,
    moderationService as any,
  );

  return {
    accessPolicyService,
    db,
    identityAccessService,
    memberDirectoryService,
    moderationService,
    notificationService,
    service,
    topic,
    topicContextService,
    tx,
  };
}

const user: JwtUser = {
  userId: '1',
  handle: 'author',
  roles: [],
  scopes: [],
  isMachine: false,
};

const machineUser: JwtUser = {
  roles: [],
  scopes: ['add:forums-topic-watch'],
  isMachine: true,
};

describe('ForumsCommandService notification boundary', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('attempts createPost notifications after the write transaction commits', async () => {
    const order: string[] = [];
    const { notificationService, service } = createCommandService(order);

    const result = await service.createPost(
      'topic-1',
      { content: 'Persisted content' },
      user,
    );

    expect(result.id).toBe('post-1');
    expect(order).toEqual(['post.create', 'commit', 'notify']);
    expect(notificationService.publishPostNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        operationName: 'createPost',
        post: expect.objectContaining({ id: 'post-1' }),
        topic: expect.objectContaining({ id: 'topic-1' }),
      }),
    );
  });

  it('treats transformed undefined post parent fields as omitted', async () => {
    const { service, tx } = createCommandService();
    const dto = new CreatePostDto();
    dto.content = 'Persisted content';

    await expect(service.createPost('topic-1', dto, user)).resolves.toEqual(
      expect.objectContaining({ id: 'post-1' }),
    );
    expect(tx.post.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        parentId: 'topic-1',
        parentType: 'TOPIC',
      }),
    });
  });

  it('attempts starter-post notification for a child createTopic command', async () => {
    const order: string[] = [];
    const { notificationService, service, tx } = createCommandService(order);
    const childTopic = makeTopic({
      id: 'child-1',
      parentTopicId: 'parent-1',
      roleName: 'reviewer',
    });
    const starterPost = makePost({
      id: 'starter-1',
      topicId: 'child-1',
      parentId: 'child-1',
    });
    tx.topic.create.mockResolvedValue(childTopic);
    tx.post.create.mockResolvedValue(starterPost);

    const result = await service.createTopic(
      {
        title: 'Child topic',
        content: 'Starter content',
        parentTopicId: 'parent-1',
        roleName: 'reviewer',
      },
      user,
    );

    expect(result.topic.id).toBe('child-1');
    expect(notificationService.publishPostNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        operationName: 'createTopic',
        post: starterPost,
        topic: childTopic,
        restrictions: expect.objectContaining({ roleName: 'reviewer' }),
      }),
    );
  });

  it('rejects denied child createTopic commands before writes or notifications', async () => {
    const { accessPolicyService, db, notificationService, service } =
      createCommandService();
    accessPolicyService.decideForCreateTopic.mockResolvedValue({
      canCreateChildTopic: {
        allowed: false,
        reason: challengeChildTopicDenyReason,
      },
      canCreateTopLevelTopic: { allowed: true },
      canControlAnnouncement: { allowed: true },
    });

    await expect(
      service.createTopic(
        {
          title: 'Child topic',
          content: 'Starter content',
          parentTopicId: 'parent-1',
          challengeId: 'challenge-1',
        },
        user,
      ),
    ).rejects.toThrow(challengeChildTopicDenyReason);

    expect(accessPolicyService.decideForCreateTopic).toHaveBeenCalledWith(
      expect.objectContaining({ memberId: '1' }),
      {
        challengeId: 'challenge-1',
        roleName: null,
      },
      expect.objectContaining({
        effectiveChallengeId: null,
        effectiveRoleName: null,
      }),
    );
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(notificationService.publishPostNotification).not.toHaveBeenCalled();
  });

  it('does not publish notifications for top-level createTopic commands', async () => {
    const { notificationService, service } = createCommandService();

    await service.createTopic(
      {
        title: 'Top-level topic',
        content: 'Starter content',
      },
      user,
    );

    expect(notificationService.publishPostNotification).not.toHaveBeenCalled();
  });

  it('omits topic lock persistence fields from createTopic command responses', async () => {
    const { service, tx } = createCommandService();
    tx.topic.create.mockResolvedValue(
      makeTopic({
        locked: true,
        lockedAt: new Date('2026-06-04T01:00:00.000Z'),
        lockedByMemberId: '99',
      }),
    );

    const result = await service.createTopic(
      {
        title: 'Top-level topic',
        content: 'Starter content',
      },
      user,
    );

    expect(result.topic).toEqual({
      id: 'topic-1',
      parentTopicId: null,
      challengeId: null,
      roleName: null,
      title: 'Topic title',
      isAnnouncement: false,
      authorMemberId: '1',
      authorHandle: 'author',
      createdAt,
      updatedAt: createdAt,
      deletedAt: null,
      deletedByMemberId: null,
    });
    expect(result.topic).not.toHaveProperty('locked');
    expect(result.topic).not.toHaveProperty('lockedAt');
    expect(result.topic).not.toHaveProperty('lockedByMemberId');
  });

  it('returns the content write result when notification publishing fails', async () => {
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const { notificationService, service } = createCommandService();
    notificationService.publishPostNotification.mockRejectedValue(
      new Error('bus unavailable'),
    );

    const result = await service.createPost(
      'topic-1',
      { content: 'Persisted content' },
      user,
    );

    expect(result.id).toBe('post-1');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('createPost notification failed'),
    );
  });

  it('rejects banned writes before context loading, writes, or notifications', async () => {
    const {
      db,
      moderationService,
      notificationService,
      service,
      topicContextService,
    } = createCommandService();
    moderationService.decideForRequestActorBan.mockResolvedValue({
      allowed: false,
      reason: 'Forums access is restricted.',
    });

    await expect(
      service.createPost(
        'topic-1',
        { content: 'Persisted content' },
        user,
        '203.0.113.10',
      ),
    ).rejects.toThrow('Forums access is restricted.');

    expect(moderationService.decideForRequestActorBan).toHaveBeenCalledWith(
      expect.objectContaining({ memberId: '1' }),
      '203.0.113.10',
    );
    expect(topicContextService.loadTopicContext).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(notificationService.publishPostNotification).not.toHaveBeenCalled();
  });

  it('rejects child-topic creation under a locked parent before writes or notifications', async () => {
    const { db, moderationService, notificationService, service } =
      createCommandService();
    moderationService.decideForLockedTopicMutation.mockResolvedValue({
      allowed: false,
      reason: 'Topic is locked.',
    });

    await expect(
      service.createTopic(
        {
          title: 'Child topic',
          content: 'Starter content',
          parentTopicId: 'parent-1',
        },
        user,
      ),
    ).rejects.toThrow('Topic is locked.');

    expect(moderationService.decideForLockedTopicMutation).toHaveBeenCalledWith(
      expect.objectContaining({ memberId: '1' }),
      expect.objectContaining({
        topic: expect.objectContaining({ id: 'topic-1' }),
      }),
    );
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(notificationService.publishPostNotification).not.toHaveBeenCalled();
  });

  it('rejects locked topic updates for ordinary members before writes', async () => {
    const { db, moderationService, service, tx } = createCommandService();
    moderationService.decideForLockedTopicMutation.mockResolvedValue({
      allowed: false,
      reason: 'Topic is locked.',
    });

    await expect(
      service.updateTopic('topic-1', { title: 'Updated title' }, user),
    ).rejects.toThrow('Topic is locked.');

    expect(db.$transaction).not.toHaveBeenCalled();
    expect(tx.topic.update).not.toHaveBeenCalled();
  });

  it('ignores transformed undefined announcement state during a title-only update', async () => {
    const { accessPolicyService, service, tx } = createCommandService();
    accessPolicyService.decideForTopic.mockResolvedValue({
      canAddWatch: { allowed: true },
      canCreatePost: { allowed: true },
      canControlAnnouncement: {
        allowed: false,
        reason: 'Announcement control requires elevated forums access.',
      },
      canDeleteTopic: { allowed: false },
      canMarkRead: { allowed: true },
      canRemoveWatch: { allowed: true },
      canUpdateTopic: { allowed: true },
    });
    const dto = new UpdateTopicDto();
    dto.title = 'Updated title';

    await expect(service.updateTopic('topic-1', dto, user)).resolves.toEqual(
      expect.objectContaining({ id: 'topic-1' }),
    );
    expect(tx.topic.update).toHaveBeenCalledWith({
      data: { title: 'Updated title' },
      where: { id: 'topic-1' },
    });
  });

  it('rejects locked role updates before restriction or descendant checks', async () => {
    const { accessPolicyService, db, moderationService, service } =
      createCommandService();
    moderationService.decideForLockedTopicMutation.mockResolvedValue({
      allowed: false,
      reason: 'Topic is locked.',
    });
    accessPolicyService.decideForRestrictions.mockResolvedValue({
      allowed: false,
      reason: 'Hidden candidate restriction.',
    });

    await expect(
      service.updateTopic('topic-1', { roleName: 'reviewer' }, user),
    ).rejects.toThrow('Topic is locked.');

    expect(accessPolicyService.decideForRestrictions).not.toHaveBeenCalled();
    expect(db.topicClosure.findMany).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('rejects locked post updates for ordinary members before writes', async () => {
    const { db, moderationService, service, tx } = createCommandService();
    moderationService.decideForLockedTopicMutation.mockResolvedValue({
      allowed: false,
      reason: 'Topic is locked.',
    });

    await expect(
      service.updatePost('post-1', { content: 'Updated content' }, user),
    ).rejects.toThrow('Topic is locked.');

    expect(db.$transaction).not.toHaveBeenCalled();
    expect(tx.post.update).not.toHaveBeenCalled();
  });

  it('allows administrator lock bypass decisions to continue to writes', async () => {
    const { moderationService, service, tx } = createCommandService();
    const adminUser: JwtUser = {
      ...user,
      roles: ['administrator'],
    };

    await expect(
      service.updateTopic('topic-1', { title: 'Updated title' }, adminUser),
    ).resolves.toEqual(expect.objectContaining({ id: 'topic-1' }));

    expect(moderationService.decideForLockedTopicMutation).toHaveBeenCalledWith(
      expect.objectContaining({ isAdmin: true }),
      expect.any(Object),
    );
    expect(tx.topic.update).toHaveBeenCalled();
  });

  it('allows eligible challenge-copilot lock bypass decisions to continue to writes', async () => {
    const { moderationService, service, tx } = createCommandService();
    const copilotUser: JwtUser = {
      ...user,
      roles: ['copilot'],
    };

    await expect(
      service.createPost(
        'topic-1',
        { content: 'Persisted content' },
        copilotUser,
      ),
    ).resolves.toEqual(expect.objectContaining({ id: 'post-1' }));

    expect(moderationService.decideForLockedTopicMutation).toHaveBeenCalledWith(
      expect.objectContaining({ roles: ['copilot'] }),
      expect.any(Object),
    );
    expect(tx.post.create).toHaveBeenCalled();
  });
});

describe('ForumsCommandService post reactions', () => {
  it('upserts a member reaction and returns both shared counts', async () => {
    const { moderationService, service, tx } = createCommandService();

    await expect(
      service.setPostReaction(
        'post-1',
        { reaction: PostReactionType.THUMBS_DOWN },
        user,
        '203.0.113.10',
      ),
    ).resolves.toEqual({
      postId: 'post-1',
      viewerReaction: PostReactionType.THUMBS_DOWN,
      thumbsUpCount: 2,
      thumbsDownCount: 1,
    });

    expect(moderationService.decideForRequestActorBan).toHaveBeenCalledWith(
      expect.objectContaining({ memberId: '1' }),
      '203.0.113.10',
    );
    expect(tx.postReaction.upsert).toHaveBeenCalledWith({
      where: {
        postId_memberId: { postId: 'post-1', memberId: '1' },
      },
      create: {
        postId: 'post-1',
        memberId: '1',
        reaction: PostReactionType.THUMBS_DOWN,
      },
      update: { reaction: PostReactionType.THUMBS_DOWN },
    });
    expect(tx.postReaction.count).toHaveBeenCalledTimes(2);
    expect(moderationService.decideForLockedTopicMutation).not.toHaveBeenCalled();
  });

  it('removes a member reaction idempotently and returns a null viewer state', async () => {
    const { service, tx } = createCommandService();
    tx.postReaction.deleteMany.mockResolvedValue({ count: 0 });
    tx.postReaction.count.mockResolvedValue(0);

    await expect(
      service.removePostReaction('post-1', user),
    ).resolves.toEqual({
      postId: 'post-1',
      viewerReaction: null,
      thumbsUpCount: 0,
      thumbsDownCount: 0,
    });
    expect(tx.postReaction.deleteMany).toHaveBeenCalledWith({
      where: { postId: 'post-1', memberId: '1' },
    });
  });

  it('rejects reactions when post visibility is denied before persistence', async () => {
    const { accessPolicyService, db, service, tx } = createCommandService();
    accessPolicyService.decideForPost.mockResolvedValue({
      canView: { allowed: false, reason: 'Insufficient forums access.' },
    });

    await expect(
      service.setPostReaction(
        'post-1',
        { reaction: PostReactionType.THUMBS_UP },
        user,
      ),
    ).rejects.toThrow('Insufficient forums access.');
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(tx.postReaction.upsert).not.toHaveBeenCalled();
  });

  it('rejects machine callers because reactions belong to human members', async () => {
    const { db, service } = createCommandService();

    await expect(
      service.removePostReaction('post-1', machineUser),
    ).rejects.toThrow('Authenticated member token required.');
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});

describe('ForumsCommandService member-targeted state commands', () => {
  const commandCases = [
    {
      name: 'addTopicWatch',
      run: (service: ForumsCommandService, memberId: string) =>
        service.addTopicWatch('topic-1', { memberId }, machineUser),
      expectWrite: (tx: ReturnType<typeof createCommandService>['tx']) => {
        expect(tx.topicWatch.upsert).toHaveBeenCalledWith({
          where: {
            topicId_memberId: {
              topicId: 'topic-1',
              memberId: '2',
            },
          },
          create: {
            topicId: 'topic-1',
            memberId: '2',
          },
          update: {},
        });
      },
    },
    {
      name: 'removeTopicWatch',
      run: (service: ForumsCommandService, memberId: string) =>
        service.removeTopicWatch('topic-1', { memberId }, machineUser),
      expectWrite: (tx: ReturnType<typeof createCommandService>['tx']) => {
        expect(tx.topicWatch.deleteMany).toHaveBeenCalledWith({
          where: {
            topicId: 'topic-1',
            memberId: '2',
          },
        });
      },
    },
    {
      name: 'markTopicRead',
      run: (service: ForumsCommandService, memberId: string) =>
        service.markTopicRead('topic-1', { memberId }, machineUser),
      expectWrite: (tx: ReturnType<typeof createCommandService>['tx']) => {
        expect(tx.topicReadState.upsert).toHaveBeenCalledWith({
          where: {
            topicId_memberId: {
              topicId: 'topic-1',
              memberId: '2',
            },
          },
          create: {
            topicId: 'topic-1',
            memberId: '2',
            lastReadAt: expect.any(Date),
          },
          update: {
            lastReadAt: expect.any(Date),
          },
        });
      },
    },
  ];

  const rejectionCases = [
    {
      memberId: '2',
      name: 'missing member',
      configure: ({
        identityAccessService,
        memberDirectoryService,
      }: ReturnType<typeof createCommandService>) => {
        memberDirectoryService.getMembersByIds.mockResolvedValue([]);
        identityAccessService.resolveMemberAccessProfile.mockResolvedValue({
          memberId: '2',
          roles: ['Reviewer'],
        });
      },
    },
    {
      memberId: 'not-a-number',
      name: 'malformed member id',
      configure: ({
        identityAccessService,
        memberDirectoryService,
      }: ReturnType<typeof createCommandService>) => {
        memberDirectoryService.getMembersByIds.mockResolvedValue([]);
        identityAccessService.resolveMemberAccessProfile.mockResolvedValue(
          undefined,
        );
      },
    },
    {
      memberId: '2',
      name: 'identity/member resolution mismatch',
      configure: ({
        identityAccessService,
        memberDirectoryService,
      }: ReturnType<typeof createCommandService>) => {
        memberDirectoryService.getMembersByIds.mockResolvedValue([
          {
            memberId: '2',
            email: 'target@example.com',
            handle: 'target',
          },
        ]);
        identityAccessService.resolveMemberAccessProfile.mockResolvedValue(
          undefined,
        );
      },
    },
  ];

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each(commandCases)(
    '$name succeeds for a valid target member',
    async ({ run, expectWrite }) => {
      const {
        accessPolicyService,
        db,
        identityAccessService,
        memberDirectoryService,
        service,
        topicContextService,
        tx,
      } = createCommandService();
      const expectedTargetPrincipal = expect.objectContaining({
        memberId: '2',
        roles: ['reviewer'],
        isMachine: false,
      });

      await expect(run(service, '2')).resolves.toBeDefined();

      expect(memberDirectoryService.getMembersByIds).toHaveBeenCalledWith([
        '2',
      ]);
      expect(
        identityAccessService.resolveMemberAccessProfile,
      ).toHaveBeenCalledWith('2');
      expect(topicContextService.loadTopicContext).toHaveBeenCalledWith(
        'topic-1',
        expectedTargetPrincipal,
      );
      expect(accessPolicyService.decideForTopic).toHaveBeenCalledWith(
        expect.objectContaining({ isMachine: true }),
        expect.objectContaining({
          topic: expect.objectContaining({ id: 'topic-1' }),
        }),
        { memberTargetPrincipal: expectedTargetPrincipal },
      );
      expect(db.$transaction).toHaveBeenCalledTimes(1);
      expectWrite(tx);
    },
  );

  it.each(
    commandCases.flatMap((commandCase) =>
      rejectionCases.map((rejectionCase) => ({
        commandCase,
        rejectionCase,
      })),
    ),
  )(
    '$commandCase.name rejects $rejectionCase.name before loading topic context or writing state',
    async ({ commandCase, rejectionCase }) => {
      const fixture = createCommandService();

      rejectionCase.configure(fixture);

      await expect(
        commandCase.run(fixture.service, rejectionCase.memberId),
      ).rejects.toThrow('Invalid member target.');
      expect(
        fixture.topicContextService.loadTopicContext,
      ).not.toHaveBeenCalled();
      expect(fixture.db.$transaction).not.toHaveBeenCalled();
      expect(fixture.tx.topicWatch.upsert).not.toHaveBeenCalled();
      expect(fixture.tx.topicWatch.deleteMany).not.toHaveBeenCalled();
      expect(fixture.tx.topicReadState.upsert).not.toHaveBeenCalled();
    },
  );

  it.each(commandCases)(
    '$name rejects banned target members before loading context or writing state',
    async ({ run }) => {
      const fixture = createCommandService();
      fixture.moderationService.decideForTargetMemberBan.mockResolvedValue({
        allowed: false,
        reason: 'Forums access is restricted.',
      });

      await expect(run(fixture.service, '2')).rejects.toThrow(
        'Forums access is restricted.',
      );
      expect(
        fixture.moderationService.decideForRequestActorBan,
      ).not.toHaveBeenCalled();
      expect(
        fixture.moderationService.decideForTargetMemberBan,
      ).toHaveBeenCalledWith('2');
      expect(
        fixture.topicContextService.loadTopicContext,
      ).not.toHaveBeenCalled();
      expect(fixture.db.$transaction).not.toHaveBeenCalled();
      expect(fixture.tx.topicWatch.upsert).not.toHaveBeenCalled();
      expect(fixture.tx.topicWatch.deleteMany).not.toHaveBeenCalled();
      expect(fixture.tx.topicReadState.upsert).not.toHaveBeenCalled();
    },
  );
});
