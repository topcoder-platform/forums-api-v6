import { Logger } from '@nestjs/common';
import { Post, Topic } from '../../prisma/generated/client';
import { ForumsWatchNotificationService } from './forums-watch-notification.service';

const createdAt = new Date('2026-06-04T00:00:00.000Z');

/**
 * Builds a persisted topic row for notification service tests.
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
 * Builds a persisted post row for notification service tests.
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
    content: 'Persisted post content',
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    deletedByMemberId: null,
    ...overrides,
  };
}

/**
 * Creates a watch notification service with mocked dependencies.
 *
 * @param templateId Optional SendGrid template id returned by config.
 * @returns Service and mocks used by the tests.
 * @throws Does not throw.
 */
function createService(templateId: string | null = 'template-id') {
  const db = {
    topicClosure: {
      findMany: jest
        .fn()
        .mockResolvedValue([
          { ancestorTopicId: 'topic-1' },
          { ancestorTopicId: 'root-1' },
        ]),
    },
    topicWatch: {
      findMany: jest.fn().mockResolvedValue([{ memberId: '2' }]),
    },
  };
  const memberDirectoryService = {
    getMembersByIds: jest.fn().mockResolvedValue([
      {
        memberId: '2',
        email: 'two@example.com',
        handle: 'two',
      },
    ]),
  };
  const identityAccessService = {
    getMemberRoleNames: jest.fn().mockResolvedValue([]),
  };
  const accessPolicyService = {
    decideForRestrictionVisibility: jest
      .fn()
      .mockResolvedValue({ allowed: true }),
  };
  const moderationService = {
    decideForTargetMemberBan: jest.fn().mockResolvedValue({ allowed: true }),
  };
  const eventBusService = {
    postEvent: jest.fn().mockResolvedValue(undefined),
  };
  const configService = {
    get: jest.fn((key: string) =>
      key === 'notifications.sendgridNotificationTemplate'
        ? (templateId ?? undefined)
        : undefined,
    ),
  };
  const service = new ForumsWatchNotificationService(
    db as any,
    memberDirectoryService as any,
    identityAccessService as any,
    accessPolicyService as any,
    moderationService as any,
    eventBusService as any,
    configService as any,
  );

  return {
    accessPolicyService,
    configService,
    db,
    eventBusService,
    identityAccessService,
    memberDirectoryService,
    moderationService,
    service,
  };
}

describe('ForumsWatchNotificationService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('dedupes topic and ancestor watches into one recipient email event', async () => {
    const { db, eventBusService, service } = createService();
    db.topicWatch.findMany.mockResolvedValue([
      { memberId: '2' },
      { memberId: '2' },
    ]);

    const result = await service.publishPostNotification({
      topic: makeTopic(),
      post: makePost(),
      restrictions: {
        challengeId: null,
        roleName: null,
        hasRestrictionConflict: false,
      },
      operationName: 'createPost',
    });

    expect(result).toEqual({ attemptedRecipientCount: 1, published: true });
    expect(db.topicWatch.findMany).toHaveBeenCalledWith({
      where: {
        topicId: { in: ['topic-1', 'root-1'] },
        memberId: { not: '1' },
      },
      select: { memberId: true },
    });
    expect(eventBusService.postEvent).toHaveBeenCalledTimes(1);
    expect(eventBusService.postEvent).toHaveBeenCalledWith(
      'external.action.email',
      expect.objectContaining({
        recipients: ['two@example.com'],
        sendgrid_template_id: 'template-id',
        version: 'v3',
      }),
    );
  });

  it('excludes the persisted author even when the author watches the topic', async () => {
    const { db, eventBusService, service } = createService();
    db.topicWatch.findMany.mockResolvedValue([{ memberId: '2' }]);

    await service.publishPostNotification({
      topic: makeTopic(),
      post: makePost({ authorMemberId: '1' }),
      restrictions: {
        challengeId: null,
        roleName: null,
        hasRestrictionConflict: false,
      },
      operationName: 'createPost',
    });

    expect(db.topicWatch.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          memberId: { not: '1' },
        }),
      }),
    );
    expect(eventBusService.postEvent).toHaveBeenCalledTimes(1);
  });

  it('filters watched members who cannot view a restricted child topic', async () => {
    const { accessPolicyService, eventBusService, service } = createService();
    accessPolicyService.decideForRestrictionVisibility.mockResolvedValue({
      allowed: false,
      reason: 'Required forum role is missing.',
    });

    const result = await service.publishPostNotification({
      topic: makeTopic({ roleName: 'reviewer' }),
      post: makePost(),
      restrictions: {
        challengeId: 'challenge-1',
        roleName: 'reviewer',
        hasRestrictionConflict: false,
      },
      operationName: 'createPost',
    });

    expect(result).toEqual({ attemptedRecipientCount: 0, published: false });
    expect(
      accessPolicyService.decideForRestrictionVisibility,
    ).toHaveBeenCalledWith(
      expect.objectContaining({ memberId: '2', isMachine: false }),
      {
        challengeId: 'challenge-1',
        roleName: 'reviewer',
        hasRestrictionConflict: false,
      },
    );
    expect(eventBusService.postEvent).not.toHaveBeenCalled();
  });

  it('filters banned watched members out of recipient email events', async () => {
    const {
      db,
      eventBusService,
      identityAccessService,
      memberDirectoryService,
      moderationService,
      service,
    } = createService();
    db.topicWatch.findMany.mockResolvedValue([
      { memberId: '2' },
      { memberId: '3' },
    ]);
    memberDirectoryService.getMembersByIds.mockResolvedValue([
      { memberId: '2', email: 'two@example.com', handle: 'two' },
      { memberId: '3', email: 'three@example.com', handle: 'three' },
    ]);
    moderationService.decideForTargetMemberBan.mockImplementation(
      (memberId: string) =>
        Promise.resolve(
          memberId === '3'
            ? { allowed: false, reason: 'Forums access is restricted.' }
            : { allowed: true },
        ),
    );

    const result = await service.publishPostNotification({
      topic: makeTopic(),
      post: makePost(),
      restrictions: {
        challengeId: null,
        roleName: null,
        hasRestrictionConflict: false,
      },
      operationName: 'createPost',
    });

    expect(result).toEqual({ attemptedRecipientCount: 1, published: true });
    expect(moderationService.decideForTargetMemberBan).toHaveBeenCalledWith(
      '3',
    );
    expect(identityAccessService.getMemberRoleNames).not.toHaveBeenCalledWith(
      '3',
    );
    expect(eventBusService.postEvent).toHaveBeenCalledWith(
      'external.action.email',
      expect.objectContaining({
        recipients: ['two@example.com'],
      }),
    );
  });

  it('skips a failing recipient authorization lookup without suppressing other recipients', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const {
      db,
      eventBusService,
      identityAccessService,
      memberDirectoryService,
      service,
    } = createService();
    db.topicWatch.findMany.mockResolvedValue([
      { memberId: '2' },
      { memberId: '3' },
      { memberId: '4' },
    ]);
    memberDirectoryService.getMembersByIds.mockResolvedValue([
      { memberId: '2', email: 'two@example.com', handle: 'two' },
      { memberId: '3', email: 'three@example.com', handle: 'three' },
      { memberId: '4', email: 'four@example.com', handle: 'four' },
    ]);
    identityAccessService.getMemberRoleNames.mockImplementation(
      (memberId: string) => {
        if (memberId === '3') {
          return Promise.reject(new Error('identity temporarily unavailable'));
        }

        return Promise.resolve([]);
      },
    );

    const result = await service.publishPostNotification({
      topic: makeTopic({ roleName: 'reviewer' }),
      post: makePost(),
      restrictions: {
        challengeId: 'challenge-1',
        roleName: 'reviewer',
        hasRestrictionConflict: false,
      },
      operationName: 'createPost',
    });

    expect(result).toEqual({ attemptedRecipientCount: 2, published: true });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('member 3 authorization lookup failed'),
    );
    expect(eventBusService.postEvent).toHaveBeenCalledWith(
      'external.action.email',
      expect.objectContaining({
        recipients: ['two@example.com', 'four@example.com'],
      }),
    );
  });

  it('evaluates multiple watched members concurrently while resolving authorized recipients', async () => {
    const { db, identityAccessService, memberDirectoryService, service } =
      createService();
    let startedRoleLookups = 0;
    let releaseFirstLookup: () => void = () => undefined;
    let observeConcurrentLookup: () => void = () => undefined;
    const firstLookupBlocked = new Promise<void>((resolve) => {
      releaseFirstLookup = resolve;
    });
    const concurrentLookupObserved = new Promise<void>((resolve) => {
      observeConcurrentLookup = resolve;
    });

    db.topicWatch.findMany.mockResolvedValue([
      { memberId: '2' },
      { memberId: '3' },
      { memberId: '4' },
    ]);
    memberDirectoryService.getMembersByIds.mockResolvedValue([
      { memberId: '2', email: 'two@example.com', handle: 'two' },
      { memberId: '3', email: 'three@example.com', handle: 'three' },
      { memberId: '4', email: 'four@example.com', handle: 'four' },
    ]);
    identityAccessService.getMemberRoleNames.mockImplementation(async () => {
      startedRoleLookups += 1;

      if (startedRoleLookups === 1) {
        await firstLookupBlocked;
      } else {
        observeConcurrentLookup();
      }

      return [];
    });

    const publishPromise = service.publishPostNotification({
      topic: makeTopic(),
      post: makePost(),
      restrictions: {
        challengeId: null,
        roleName: null,
        hasRestrictionConflict: false,
      },
      operationName: 'createPost',
    });
    const secondLookupStartedBeforeFirstCompleted = await Promise.race([
      concurrentLookupObserved.then(() => true),
      new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), 50);
      }),
    ]);

    releaseFirstLookup();
    await publishPromise;

    expect(secondLookupStartedBeforeFirstCompleted).toBe(true);
  });

  it('skips and logs missing recipient email or missing template configuration', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const missingEmail = createService();
    missingEmail.memberDirectoryService.getMembersByIds.mockResolvedValue([
      { memberId: '2', email: null, handle: 'two' },
    ]);

    await missingEmail.service.publishPostNotification({
      topic: makeTopic(),
      post: makePost(),
      restrictions: {
        challengeId: null,
        roleName: null,
        hasRestrictionConflict: false,
      },
      operationName: 'createPost',
    });

    expect(missingEmail.eventBusService.postEvent).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('member 2 has no email'),
    );

    const missingTemplate = createService(null);

    await missingTemplate.service.publishPostNotification({
      topic: makeTopic(),
      post: makePost(),
      restrictions: {
        challengeId: null,
        roleName: null,
        hasRestrictionConflict: false,
      },
      operationName: 'createPost',
    });

    expect(missingTemplate.db.topicClosure.findMany).not.toHaveBeenCalled();
    expect(missingTemplate.eventBusService.postEvent).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'SENDGRID_NOTIFICATION_TEMPLATE is not configured',
      ),
    );
  });

  it('carries the system author handle for M2M-created content', async () => {
    const { eventBusService, service } = createService();

    await service.publishPostNotification({
      topic: makeTopic({ authorMemberId: 'system', authorHandle: 'system' }),
      post: makePost({
        authorMemberId: 'system',
        authorHandle: 'system',
      }),
      restrictions: {
        challengeId: 'challenge-1',
        roleName: null,
        hasRestrictionConflict: false,
      },
      operationName: 'createPost',
    });

    expect(eventBusService.postEvent).toHaveBeenCalledWith(
      'external.action.email',
      expect.objectContaining({
        data: expect.objectContaining({
          authorHandle: 'system',
          challengeId: 'challenge-1',
          createdAt: createdAt.toISOString(),
          postContent: 'Persisted post content',
          topicId: 'topic-1',
          topicTitle: 'Topic title',
        }),
      }),
    );
  });
});
