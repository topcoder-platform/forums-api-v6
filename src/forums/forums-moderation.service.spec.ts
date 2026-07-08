import {
  IpBan,
  MemberBan,
  Post,
  Prisma,
  Topic,
} from '../../prisma/generated/client';
import { JwtUser } from '../auth/jwt.service';
import {
  ForumsPostContext,
  ForumsPrincipal,
  ForumsTopicContext,
} from './forums-access.types';
import {
  IpBanStateDto,
  MemberBanStateDto,
} from './dto/forums-moderation-response.dto';
import { ForumsModerationService } from './forums-moderation.service';

const createdAt = new Date('2026-06-04T00:00:00.000Z');

/**
 * Builds a persisted topic row for moderation service tests.
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
 * Builds a persisted post row for moderation service tests.
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
 * Builds a persisted member ban row for moderation service tests.
 *
 * @param overrides MemberBan fields to override.
 * @returns MemberBan row compatible with the generated Prisma type.
 * @throws Does not throw.
 */
function makeMemberBan(overrides: Partial<MemberBan> = {}): MemberBan {
  return {
    id: 'member-ban-1',
    memberId: '2',
    createdAt,
    createdByMemberId: '1',
    removedAt: null,
    removedByMemberId: null,
    ...overrides,
  };
}

/**
 * Builds a persisted IP ban row for moderation service tests.
 *
 * @param overrides IpBan fields to override.
 * @returns IpBan row compatible with the generated Prisma type.
 * @throws Does not throw.
 */
function makeIpBan(overrides: Partial<IpBan> = {}): IpBan {
  return {
    id: 'ip-ban-1',
    ipAddress: '203.0.113.10',
    createdAt,
    createdByMemberId: '1',
    removedAt: null,
    removedByMemberId: null,
    ...overrides,
  };
}

/**
 * Maps a persisted member ban test row into the public moderation DTO shape.
 *
 * @param ban Persisted member ban row used by the mocked database service.
 * @returns Member ban state expected from the moderation service.
 * @throws Does not throw.
 */
function makeMemberBanState(ban: MemberBan): MemberBanStateDto {
  return {
    id: ban.id,
    memberId: ban.memberId,
    active: !ban.removedAt,
    createdAt: ban.createdAt,
    createdByMemberId: ban.createdByMemberId,
    removedAt: ban.removedAt,
    removedByMemberId: ban.removedByMemberId,
  };
}

/**
 * Maps a persisted IP ban test row into the public moderation DTO shape.
 *
 * @param ban Persisted IP ban row used by the mocked database service.
 * @returns IP ban state expected from the moderation service.
 * @throws Does not throw.
 */
function makeIpBanState(ban: IpBan): IpBanStateDto {
  return {
    id: ban.id,
    ipAddress: ban.ipAddress,
    active: !ban.removedAt,
    createdAt: ban.createdAt,
    createdByMemberId: ban.createdByMemberId,
    removedAt: ban.removedAt,
    removedByMemberId: ban.removedByMemberId,
  };
}

/**
 * Builds a Prisma unique-constraint error for moderation create-race tests.
 *
 * @param target Prisma unique target metadata to attach to the error.
 * @returns Known Prisma request error with the P2002 unique code.
 * @throws Does not throw.
 */
function makeUniqueConstraintError(
  target: string | string[],
): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
    meta: { target },
  });
}

/**
 * Asserts that an IP-ban normalization query canonicalizes a bare IP with the
 * same PostgreSQL `host(...::inet)` expression used by the service.
 *
 * @param query Prisma SQL object passed to the mocked raw query method.
 * @param ipAddress Raw IP address expected to be bound into the query.
 * @returns Nothing.
 * @throws Jest assertion errors when the query does not match expectations.
 */
function expectCanonicalIpHostQuery(query: unknown, ipAddress: string): void {
  const sqlQuery = query as { strings: string[]; values: unknown[] };
  const queryText = sqlQuery.strings.join('?');

  expect(queryText).toContain('SELECT host(?::inet) AS "ipAddress"');
  expect(sqlQuery.values).toEqual([ipAddress]);
}

/**
 * Builds a topic context for lock moderation tests.
 *
 * @param overrides Context fields to override.
 * @returns Forums topic context test value.
 * @throws Does not throw.
 */
function makeContext(
  overrides: Partial<ForumsTopicContext> = {},
): ForumsTopicContext {
  const topic = overrides.topic ?? makeTopic({ locked: true });

  return {
    topic,
    ancestors: [topic],
    effectiveChallengeId: null,
    effectiveRoleName: null,
    ancestorChallengeId: null,
    ancestorRoleName: null,
    hasDeletedAncestor: false,
    hasRestrictionConflict: false,
    isTopicAuthor: false,
    ...overrides,
  };
}

/**
 * Builds a forums principal for moderation service tests.
 *
 * @param overrides Principal fields to override.
 * @returns Forums principal test value.
 * @throws Does not throw.
 */
function makePrincipal(
  overrides: Partial<ForumsPrincipal> = {},
): ForumsPrincipal {
  return {
    memberId: '1',
    roles: [],
    scopes: [],
    isAdmin: false,
    isMachine: false,
    ...overrides,
  };
}

/**
 * Builds an authenticated token payload for management method tests.
 *
 * @param overrides JWT user fields to override.
 * @returns JwtUser test value.
 * @throws Does not throw.
 */
function makeUser(overrides: Partial<JwtUser> = {}): JwtUser {
  return {
    userId: '1',
    handle: 'admin',
    roles: ['administrator'],
    scopes: [],
    isMachine: false,
    ...overrides,
  };
}

/**
 * Creates a moderation service with mocked dependencies.
 *
 * @returns Service and mocks used by moderation tests.
 * @throws Does not throw.
 */
function createService() {
  const db = {
    memberBan: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
    },
    ipBan: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
    },
    topic: {
      update: jest.fn(),
    },
    $queryRaw: jest.fn().mockResolvedValue([]),
  };
  const resourceAccessService = {
    getResourceAccessFacts: jest.fn().mockResolvedValue({
      configured: true,
      hasChallengeResource: false,
      isChallengeCopilot: false,
      hasFullReadAccess: false,
      hasFullWriteAccess: false,
      roleNames: [],
    }),
  };
  const topicContextService = {
    loadTopicContext: jest.fn().mockResolvedValue(makeContext()),
  };
  const service = new ForumsModerationService(
    db as any,
    resourceAccessService as any,
    topicContextService as any,
  );

  return {
    db,
    resourceAccessService,
    topicContextService,
    service,
  };
}

describe('ForumsModerationService', () => {
  it('denies active member bans', async () => {
    const { db, service } = createService();
    db.memberBan.findFirst.mockResolvedValue({ id: 'ban-1' });

    await expect(
      service.decideForRequestActorBan(makePrincipal(), undefined),
    ).resolves.toEqual({
      allowed: false,
      reason: 'Forums access is restricted.',
    });
  });

  it('denies exact-match trusted IP bans', async () => {
    const { db, service } = createService();
    db.$queryRaw.mockResolvedValue([{ id: 'ip-ban-1' }]);

    await expect(
      service.decideForRequestActorBan(makePrincipal(), '2001:db8::1'),
    ).resolves.toEqual({
      allowed: false,
      reason: 'Forums access is restricted.',
    });

    const query = db.$queryRaw.mock.calls[0][0] as {
      strings: string[];
      values: unknown[];
    };
    const queryText = query.strings.join('?');
    expect(queryText).toContain('"ipAddress" = host(?::inet)');
    expect(queryText).not.toContain('"ipAddress"::inet');
    expect(query.values).toEqual(['2001:db8::1']);
  });

  it('does not evaluate IP bans when no trusted client IP is present', async () => {
    const { db, service } = createService();

    await expect(
      service.decideForRequestActorBan(makePrincipal(), undefined),
    ).resolves.toEqual({ allowed: true });
    expect(db.$queryRaw).not.toHaveBeenCalled();
  });

  it('allows administrators to bypass locked-topic mutation checks', async () => {
    const { resourceAccessService, service } = createService();

    await expect(
      service.decideForLockedTopicMutation(
        makePrincipal({ isAdmin: true }),
        makeContext(),
      ),
    ).resolves.toEqual({ allowed: true });
    expect(resourceAccessService.getResourceAccessFacts).not.toHaveBeenCalled();
  });

  it('allows challenge copilots to bypass locks only on challenge-scoped topics', async () => {
    const { resourceAccessService, service } = createService();
    resourceAccessService.getResourceAccessFacts.mockResolvedValue({
      configured: true,
      hasChallengeResource: true,
      isChallengeCopilot: true,
      hasFullReadAccess: false,
      hasFullWriteAccess: false,
      roleNames: ['copilot'],
    });

    await expect(
      service.decideForLockedTopicMutation(
        makePrincipal(),
        makeContext({ effectiveChallengeId: 'challenge-1' }),
      ),
    ).resolves.toEqual({ allowed: true });
    await expect(
      service.decideForLockedTopicMutation(makePrincipal(), makeContext()),
    ).resolves.toEqual({
      allowed: false,
      reason: 'Topic is locked.',
    });
  });

  it('blocks M2M callers with lock checks', async () => {
    const { resourceAccessService, service } = createService();
    const postContext: ForumsPostContext = {
      ...makeContext({ effectiveChallengeId: 'challenge-1' }),
      post: makePost(),
      isPostAuthor: false,
    };

    await expect(
      service.decideForLockedTopicMutation(
        makePrincipal({ isMachine: true, memberId: null }),
        postContext,
      ),
    ).resolves.toEqual({
      allowed: false,
      reason: 'Topic is locked.',
    });
    expect(resourceAccessService.getResourceAccessFacts).not.toHaveBeenCalled();
  });

  it('locks active topics with human administrator audit metadata', async () => {
    const { db, service, topicContextService } = createService();
    const unlockedTopic = makeTopic({ locked: false });
    const lockedAt = new Date('2026-06-04T01:00:00.000Z');
    const lockedTopic = makeTopic({
      locked: true,
      lockedAt,
      lockedByMemberId: '1',
      updatedAt: lockedAt,
    });
    topicContextService.loadTopicContext.mockResolvedValue(
      makeContext({ topic: unlockedTopic, hasDeletedAncestor: false }),
    );
    db.topic.update.mockResolvedValue(lockedTopic);

    await expect(service.lockTopic('topic-1', makeUser())).resolves.toEqual({
      topicId: 'topic-1',
      locked: true,
      lockedBy: '1',
      lockedAt,
      updatedAt: lockedAt,
    });
    expect(db.topic.update).toHaveBeenCalledWith({
      where: { id: 'topic-1' },
      data: expect.objectContaining({
        locked: true,
        lockedByMemberId: '1',
      }),
    });
  });

  it('rejects lock management for topics hidden by deleted ancestors', async () => {
    const { service, topicContextService } = createService();
    topicContextService.loadTopicContext.mockResolvedValue(
      makeContext({ hasDeletedAncestor: true }),
    );

    await expect(service.lockTopic('topic-1', makeUser())).rejects.toThrow(
      'Topic not found.',
    );
  });

  it('unlocks active topics and clears lock metadata', async () => {
    const { db, service, topicContextService } = createService();
    const lockedTopic = makeTopic({
      locked: true,
      lockedAt: new Date('2026-06-04T01:00:00.000Z'),
      lockedByMemberId: '1',
    });
    const unlockedAt = new Date('2026-06-04T02:00:00.000Z');
    topicContextService.loadTopicContext.mockResolvedValue(
      makeContext({ topic: lockedTopic }),
    );
    db.topic.update.mockResolvedValue(
      makeTopic({
        locked: false,
        lockedAt: null,
        lockedByMemberId: null,
        updatedAt: unlockedAt,
      }),
    );

    await expect(service.unlockTopic('topic-1', makeUser())).resolves.toEqual({
      topicId: 'topic-1',
      locked: false,
      lockedBy: null,
      lockedAt: null,
      updatedAt: unlockedAt,
    });
    expect(db.topic.update).toHaveBeenCalledWith({
      where: { id: 'topic-1' },
      data: {
        locked: false,
        lockedAt: null,
        lockedByMemberId: null,
      },
    });
  });

  it('creates member bans with human audit metadata after pre-reading active rows', async () => {
    const { db, service } = createService();
    const ban = makeMemberBan({ memberId: '2', createdByMemberId: '1' });
    db.memberBan.findFirst.mockResolvedValueOnce(null);
    db.memberBan.create.mockResolvedValue(ban);

    await expect(service.banMember('2', makeUser())).resolves.toEqual(
      makeMemberBanState(ban),
    );
    expect(db.memberBan.create).toHaveBeenCalledWith({
      data: {
        memberId: '2',
        createdByMemberId: '1',
      },
    });
  });

  it('returns existing active member bans without creating duplicates', async () => {
    const { db, service } = createService();
    const ban = makeMemberBan({ memberId: '2' });
    db.memberBan.findFirst.mockResolvedValueOnce(ban);

    await expect(service.banMember('2', makeUser())).resolves.toEqual(
      expect.objectContaining({
        id: 'member-ban-1',
        memberId: '2',
        active: true,
      }),
    );
    expect(db.memberBan.create).not.toHaveBeenCalled();
  });

  it('keeps exactly one active member ban through repeat ban, unban, and re-ban', async () => {
    const { db, service } = createService();
    const removedAt = new Date('2026-06-04T03:00:00.000Z');
    const rebannedAt = new Date('2026-06-04T04:00:00.000Z');
    const initialBan = makeMemberBan({
      id: 'member-ban-1',
      memberId: '2',
      createdByMemberId: '1',
    });
    const removedBan = makeMemberBan({
      id: 'member-ban-1',
      memberId: '2',
      createdByMemberId: '1',
      removedAt,
      removedByMemberId: '1',
    });
    const rebannedBan = makeMemberBan({
      id: 'member-ban-2',
      memberId: '2',
      createdAt: rebannedAt,
      createdByMemberId: '1',
    });
    db.memberBan.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(initialBan)
      .mockResolvedValueOnce(initialBan)
      .mockResolvedValueOnce(null);
    db.memberBan.create
      .mockResolvedValueOnce(initialBan)
      .mockResolvedValueOnce(rebannedBan);
    db.memberBan.update.mockResolvedValueOnce(removedBan);

    await expect(service.banMember('2', makeUser())).resolves.toEqual(
      makeMemberBanState(initialBan),
    );
    await expect(service.banMember('2', makeUser())).resolves.toEqual(
      makeMemberBanState(initialBan),
    );
    await expect(service.unbanMember('2', makeUser())).resolves.toEqual(
      makeMemberBanState(removedBan),
    );
    await expect(service.banMember('2', makeUser())).resolves.toEqual(
      makeMemberBanState(rebannedBan),
    );
    expect(db.memberBan.findFirst).toHaveBeenCalledTimes(4);
    expect(db.memberBan.findFirst).toHaveBeenNthCalledWith(1, {
      where: { memberId: '2', removedAt: null },
    });
    expect(db.memberBan.findFirst).toHaveBeenNthCalledWith(2, {
      where: { memberId: '2', removedAt: null },
    });
    expect(db.memberBan.findFirst).toHaveBeenNthCalledWith(3, {
      where: { memberId: '2', removedAt: null },
    });
    expect(db.memberBan.findFirst).toHaveBeenNthCalledWith(4, {
      where: { memberId: '2', removedAt: null },
    });
    expect(db.memberBan.create).toHaveBeenCalledTimes(2);
    expect(db.memberBan.create).toHaveBeenNthCalledWith(1, {
      data: {
        memberId: '2',
        createdByMemberId: '1',
      },
    });
    expect(db.memberBan.create).toHaveBeenNthCalledWith(2, {
      data: {
        memberId: '2',
        createdByMemberId: '1',
      },
    });
    expect(db.memberBan.update).toHaveBeenCalledWith({
      where: { id: 'member-ban-1' },
      data: {
        removedAt: expect.any(Date),
        removedByMemberId: '1',
      },
    });
  });

  it('returns the same active member ban for concurrent duplicate creates', async () => {
    const { db, service } = createService();
    const ban = makeMemberBan({ memberId: '2', createdByMemberId: '1' });
    const expectedState = makeMemberBanState(ban);
    db.memberBan.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(ban);
    db.memberBan.create
      .mockResolvedValueOnce(ban)
      .mockRejectedValueOnce(
        makeUniqueConstraintError('MemberBan_memberId_active_key'),
      );

    await expect(
      Promise.all([
        service.banMember('2', makeUser()),
        service.banMember('2', makeUser()),
      ]),
    ).resolves.toEqual([expectedState, expectedState]);
    expect(db.memberBan.findFirst).toHaveBeenCalledTimes(3);
  });

  it('removes active member bans with null M2M audit metadata', async () => {
    const { db, service } = createService();
    const removedAt = new Date('2026-06-04T03:00:00.000Z');
    db.memberBan.findFirst.mockResolvedValueOnce(makeMemberBan());
    db.memberBan.update.mockResolvedValue(
      makeMemberBan({
        removedAt,
        removedByMemberId: null,
      }),
    );

    await expect(
      service.unbanMember(
        '2',
        makeUser({ isMachine: true, userId: undefined }),
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        active: false,
        removedAt,
        removedByMemberId: null,
      }),
    );
    expect(db.memberBan.update).toHaveBeenCalledWith({
      where: { id: 'member-ban-1' },
      data: expect.objectContaining({
        removedByMemberId: null,
      }),
    });
  });

  it('creates IP bans with canonical host values and M2M audit metadata', async () => {
    const { db, service } = createService();
    const ban = makeIpBan({ createdByMemberId: null });
    db.$queryRaw.mockResolvedValueOnce([{ ipAddress: '203.0.113.10' }]);
    db.ipBan.findFirst.mockResolvedValueOnce(null);
    db.ipBan.create.mockResolvedValue(ban);

    await expect(
      service.banIpAddress(
        '203.0.113.10',
        makeUser({ isMachine: true, userId: undefined }),
      ),
    ).resolves.toEqual({
      id: 'ip-ban-1',
      ipAddress: '203.0.113.10',
      active: true,
      createdAt,
      createdByMemberId: null,
      removedAt: null,
      removedByMemberId: null,
    });
    expectCanonicalIpHostQuery(db.$queryRaw.mock.calls[0][0], '203.0.113.10');
    expect(db.ipBan.create).toHaveBeenCalledWith({
      data: {
        ipAddress: '203.0.113.10',
        createdByMemberId: null,
      },
    });
  });

  it.each([
    ['IPv4', '203.0.113.10', '203.0.113.10'],
    ['IPv6', '2001:0db8:0000:0000:0000:0000:0000:0001', '2001:db8::1'],
  ])(
    'accepts exact bare %s IP ban targets and stores the canonical host value',
    async (_label, ipAddress, canonicalIpAddress) => {
      const { db, service } = createService();
      const ban = makeIpBan({ ipAddress: canonicalIpAddress });
      db.$queryRaw.mockResolvedValueOnce([{ ipAddress: canonicalIpAddress }]);
      db.ipBan.findFirst.mockResolvedValueOnce(null);
      db.ipBan.create.mockResolvedValueOnce(ban);

      await expect(
        service.banIpAddress(ipAddress, makeUser()),
      ).resolves.toEqual(makeIpBanState(ban));
      expectCanonicalIpHostQuery(db.$queryRaw.mock.calls[0][0], ipAddress);
      expect(db.ipBan.findFirst).toHaveBeenCalledWith({
        where: { ipAddress: canonicalIpAddress, removedAt: null },
      });
      expect(db.ipBan.create).toHaveBeenCalledWith({
        data: {
          ipAddress: canonicalIpAddress,
          createdByMemberId: '1',
        },
      });
    },
  );

  it.each([
    ['CIDR', '192.0.2.0/24'],
    ['wildcard', '192.0.2.*'],
    ['bracket and port', '[2001:db8::1]:443'],
    ['comma-delimited', '203.0.113.10,203.0.113.11'],
    ['quoted', '"203.0.113.10"'],
    ['whitespace-padded', ' 203.0.113.10'],
    ['non-IP', 'not-an-ip'],
  ])(
    'rejects %s IP ban targets before IP ban persistence',
    async (_label, ipAddress) => {
      const { db, service } = createService();

      await expect(service.banIpAddress(ipAddress, makeUser())).rejects.toThrow(
        'ipAddress must be an exact bare IPv4 or IPv6 host value.',
      );
      expect(db.$queryRaw).not.toHaveBeenCalled();
      expect(db.ipBan.findFirst).not.toHaveBeenCalled();
      expect(db.ipBan.create).not.toHaveBeenCalled();
    },
  );

  it('keeps exactly one active IP ban through repeat ban, unban, and re-ban', async () => {
    const { db, service } = createService();
    const removedAt = new Date('2026-06-04T03:00:00.000Z');
    const rebannedAt = new Date('2026-06-04T04:00:00.000Z');
    const initialBan = makeIpBan({
      id: 'ip-ban-1',
      ipAddress: '203.0.113.10',
      createdByMemberId: '1',
    });
    const removedBan = makeIpBan({
      id: 'ip-ban-1',
      ipAddress: '203.0.113.10',
      createdByMemberId: '1',
      removedAt,
      removedByMemberId: '1',
    });
    const rebannedBan = makeIpBan({
      id: 'ip-ban-2',
      ipAddress: '203.0.113.10',
      createdAt: rebannedAt,
      createdByMemberId: '1',
    });
    db.$queryRaw
      .mockResolvedValueOnce([{ ipAddress: '203.0.113.10' }])
      .mockResolvedValueOnce([{ ipAddress: '203.0.113.10' }])
      .mockResolvedValueOnce([{ ipAddress: '203.0.113.10' }])
      .mockResolvedValueOnce([{ ipAddress: '203.0.113.10' }]);
    db.ipBan.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(initialBan)
      .mockResolvedValueOnce(initialBan)
      .mockResolvedValueOnce(null);
    db.ipBan.create
      .mockResolvedValueOnce(initialBan)
      .mockResolvedValueOnce(rebannedBan);
    db.ipBan.update.mockResolvedValueOnce(removedBan);

    await expect(
      service.banIpAddress('203.0.113.10', makeUser()),
    ).resolves.toEqual(makeIpBanState(initialBan));
    await expect(
      service.banIpAddress('203.0.113.10', makeUser()),
    ).resolves.toEqual(makeIpBanState(initialBan));
    await expect(
      service.unbanIpAddress('203.0.113.10', makeUser()),
    ).resolves.toEqual(makeIpBanState(removedBan));
    await expect(
      service.banIpAddress('203.0.113.10', makeUser()),
    ).resolves.toEqual(makeIpBanState(rebannedBan));
    expect(db.ipBan.findFirst).toHaveBeenCalledTimes(4);
    expect(db.ipBan.findFirst).toHaveBeenNthCalledWith(1, {
      where: { ipAddress: '203.0.113.10', removedAt: null },
    });
    expect(db.ipBan.findFirst).toHaveBeenNthCalledWith(2, {
      where: { ipAddress: '203.0.113.10', removedAt: null },
    });
    expect(db.ipBan.findFirst).toHaveBeenNthCalledWith(3, {
      where: { ipAddress: '203.0.113.10', removedAt: null },
    });
    expect(db.ipBan.findFirst).toHaveBeenNthCalledWith(4, {
      where: { ipAddress: '203.0.113.10', removedAt: null },
    });
    expect(db.ipBan.create).toHaveBeenCalledTimes(2);
    expect(db.ipBan.create).toHaveBeenNthCalledWith(1, {
      data: {
        ipAddress: '203.0.113.10',
        createdByMemberId: '1',
      },
    });
    expect(db.ipBan.create).toHaveBeenNthCalledWith(2, {
      data: {
        ipAddress: '203.0.113.10',
        createdByMemberId: '1',
      },
    });
    expect(db.ipBan.update).toHaveBeenCalledWith({
      where: { id: 'ip-ban-1' },
      data: {
        removedAt: expect.any(Date),
        removedByMemberId: '1',
      },
    });
  });

  it('returns the same active IP ban for concurrent duplicate creates', async () => {
    const { db, service } = createService();
    const ban = makeIpBan({ createdByMemberId: '1' });
    const expectedState = makeIpBanState(ban);
    db.$queryRaw
      .mockResolvedValueOnce([{ ipAddress: '203.0.113.10' }])
      .mockResolvedValueOnce([{ ipAddress: '203.0.113.10' }]);
    db.ipBan.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(ban);
    db.ipBan.create
      .mockResolvedValueOnce(ban)
      .mockRejectedValueOnce(
        makeUniqueConstraintError('IpBan_ipAddress_active_key'),
      );

    await expect(
      Promise.all([
        service.banIpAddress('203.0.113.10', makeUser()),
        service.banIpAddress('203.0.113.10', makeUser()),
      ]),
    ).resolves.toEqual([expectedState, expectedState]);
    expect(db.ipBan.findFirst).toHaveBeenCalledTimes(3);
  });
});
