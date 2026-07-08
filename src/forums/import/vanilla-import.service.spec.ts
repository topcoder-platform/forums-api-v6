import { chmod, mkdir, mkdtemp, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  VanillaImportPreflightError,
  VanillaImportPreflightService,
} from './vanilla-import-preflight.service';
import { VanillaImportService } from './vanilla-import.service';
import {
  VanillaDiscussionRow,
  VanillaIpBanRow,
  VanillaMemberBanRow,
  VanillaReadStateRow,
  VanillaReplyRow,
  VanillaWatchRow,
} from './vanilla-import.types';

/**
 * Creates an async generator for mocked source reader stages.
 *
 * @param values Values to yield.
 * @returns Async generator of the supplied values.
 * @throws Does not throw.
 */
async function* generator<T>(values: T[]): AsyncGenerator<T> {
  for (const value of values) {
    await Promise.resolve();
    yield value;
  }
}

/**
 * Builds a normalized legacy actor for import service tests.
 *
 * @param legacyUserId Legacy user id.
 * @returns Legacy actor DTO.
 * @throws Does not throw.
 */
function actor(legacyUserId: string) {
  return {
    legacyUserId,
    handle: `user-${legacyUserId}`,
    email: `user-${legacyUserId}@example.com`,
  };
}

/**
 * Builds a normalized source discussion for import service tests.
 *
 * @param overrides Discussion overrides.
 * @returns Normalized discussion row.
 * @throws Does not throw.
 */
function discussion(
  overrides: Partial<VanillaDiscussionRow> = {},
): VanillaDiscussionRow {
  const createdAt = new Date('2020-01-01T00:00:00.000Z');

  return {
    discussionId: '1',
    challengeId: null,
    title: 'Topic',
    body: 'Body',
    isAnnouncement: false,
    locked: false,
    createdAt,
    updatedAt: createdAt,
    actor: actor('10'),
    ...overrides,
  };
}

/**
 * Builds a normalized source reply for import service tests.
 *
 * @param overrides Reply overrides.
 * @returns Normalized reply row.
 * @throws Does not throw.
 */
function reply(overrides: Partial<VanillaReplyRow> = {}): VanillaReplyRow {
  const createdAt = new Date('2020-01-02T00:00:00.000Z');

  return {
    replyId: '100',
    discussionId: '1',
    parentReplyId: null,
    body: 'Reply',
    createdAt,
    updatedAt: createdAt,
    actor: actor('11'),
    ...overrides,
  };
}

/**
 * Creates a minimal report service mock for orchestration assertions.
 *
 * @returns Mocked report service.
 * @throws Does not throw.
 */
function createReportService() {
  return {
    start: jest.fn(),
    setPreflight: jest.fn(),
    recordRead: jest.fn(),
    recordImported: jest.fn(),
    recordSkipped: jest.fn(),
    recordFailed: jest.fn(),
    recordMemberMapping: jest.fn(),
    flush: jest.fn().mockResolvedValue({
      reportPath: '/tmp/report.json',
      status: 'completed',
      stages: {
        topics: { read: 0, imported: 0, skipped: 0, failed: 0 },
        replies: { read: 0, imported: 0, skipped: 0, failed: 0 },
        watches: { read: 0, imported: 0, skipped: 0, failed: 0 },
        readState: { read: 0, imported: 0, skipped: 0, failed: 0 },
        memberBans: { read: 0, imported: 0, skipped: 0, failed: 0 },
        ipBans: { read: 0, imported: 0, skipped: 0, failed: 0 },
      },
    }),
  };
}

/**
 * Creates the import service with default passing mocks.
 *
 * @param overrides Dependency overrides.
 * @returns Service and mocks.
 * @throws Does not throw.
 */
function createImportService(
  overrides: {
    discussions?: VanillaDiscussionRow[];
    replies?: Record<string, VanillaReplyRow[]>;
    watches?: VanillaWatchRow[];
    readStates?: VanillaReadStateRow[];
    memberBans?: VanillaMemberBanRow[];
    ipBans?: VanillaIpBanRow[];
  } = {},
) {
  const reportService = createReportService();
  const sourceReader = {
    readDiscussions: jest
      .fn()
      .mockImplementation(() => generator(overrides.discussions ?? [])),
    readRepliesForDiscussion: jest
      .fn()
      .mockImplementation((discussionId: string) =>
        Promise.resolve(overrides.replies?.[discussionId] ?? []),
      ),
    readWatches: jest
      .fn()
      .mockImplementation(() => generator(overrides.watches ?? [])),
    readReadStates: jest
      .fn()
      .mockImplementation(() => generator(overrides.readStates ?? [])),
    readMemberBans: jest
      .fn()
      .mockImplementation(() => generator(overrides.memberBans ?? [])),
    readIpBans: jest
      .fn()
      .mockImplementation(() => generator(overrides.ipBans ?? [])),
  };
  const preflightService = {
    run: jest.fn().mockResolvedValue({
      ok: true,
      targetCounts: {
        topics: 0,
        posts: 0,
        topicClosures: 0,
        topicWatches: 0,
        topicReadStates: 0,
        memberBans: 0,
        ipBans: 0,
      },
      forumsDb: { ok: true },
      membersDb: { ok: true },
      challengeDb: { ok: true },
      vanillaDb: { ok: true },
      reportPath: { ok: true },
    }),
  };
  const memberMapper = {
    mapActor: jest
      .fn()
      .mockImplementation((sourceActor: { legacyUserId: string }) =>
        Promise.resolve(
          sourceActor.legacyUserId.startsWith('unmatched')
            ? {
                status: 'unmatched',
                legacyUserId: sourceActor.legacyUserId,
                reason: 'member_not_found',
              }
            : {
                status: 'matched',
                legacyUserId: sourceActor.legacyUserId,
                memberId: sourceActor.legacyUserId,
                handle: `handle-${sourceActor.legacyUserId}`,
                matchedBy: 'handle',
              },
        ),
      ),
  };
  const challengeLookup = {
    exists: jest
      .fn()
      .mockImplementation((challengeId: string) =>
        Promise.resolve(challengeId !== 'missing-challenge'),
      ),
  };
  const writer = {
    importDiscussion: jest.fn().mockResolvedValue({
      topicId: 'topic-1',
      starterPostId: 'post-1',
    }),
    importReply: jest.fn().mockResolvedValue('reply-post-1'),
    importWatch: jest.fn().mockResolvedValue(undefined),
    importReadState: jest.fn().mockResolvedValue(undefined),
    importMemberBan: jest.fn().mockResolvedValue(undefined),
    normalizeBareIpAddress: jest
      .fn()
      .mockImplementation((ipAddress: string) =>
        ipAddress.includes('/')
          ? Promise.reject(new Error('unsupported_non_exact_ip_rule'))
          : Promise.resolve(ipAddress),
      ),
    importIpBan: jest.fn().mockResolvedValue(undefined),
  };
  const service = new VanillaImportService(
    preflightService as any,
    sourceReader as any,
    memberMapper as any,
    challengeLookup as any,
    writer as any,
    reportService as any,
  );

  return {
    challengeLookup,
    memberMapper,
    preflightService,
    reportService,
    service,
    sourceReader,
    writer,
  };
}

describe('VanillaImportPreflightService', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vanilla-import-preflight-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('fails when the target forums dataset is not empty', async () => {
    const db = {
      ping: jest.fn().mockResolvedValue(undefined),
      topic: { count: jest.fn().mockResolvedValue(1) },
      post: { count: jest.fn().mockResolvedValue(0) },
      topicClosure: { count: jest.fn().mockResolvedValue(0) },
      topicWatch: { count: jest.fn().mockResolvedValue(0) },
      topicReadState: { count: jest.fn().mockResolvedValue(0) },
      memberBan: { count: jest.fn().mockResolvedValue(0) },
      ipBan: { count: jest.fn().mockResolvedValue(0) },
    };
    const service = new VanillaImportPreflightService(
      db as any,
      { ping: jest.fn().mockResolvedValue(undefined) } as any,
      { ping: jest.fn().mockResolvedValue(undefined) } as any,
      { ping: jest.fn().mockResolvedValue(undefined) } as any,
    );

    await expect(
      service.run(join(tempDir, 'report.json')),
    ).rejects.toMatchObject({
      preflight: {
        targetCounts: expect.objectContaining({ topics: 1 }),
      },
    });
  });

  it('fails when a dependency is unreachable and the report target is invalid', async () => {
    await mkdir(join(tempDir, 'report-directory'));
    const db = {
      ping: jest.fn().mockResolvedValue(undefined),
      topic: { count: jest.fn().mockResolvedValue(0) },
      post: { count: jest.fn().mockResolvedValue(0) },
      topicClosure: { count: jest.fn().mockResolvedValue(0) },
      topicWatch: { count: jest.fn().mockResolvedValue(0) },
      topicReadState: { count: jest.fn().mockResolvedValue(0) },
      memberBan: { count: jest.fn().mockResolvedValue(0) },
      ipBan: { count: jest.fn().mockResolvedValue(0) },
    };
    const service = new VanillaImportPreflightService(
      db as any,
      {
        ping: jest.fn().mockRejectedValue(new Error('missing members DB')),
      } as any,
      { ping: jest.fn().mockResolvedValue(undefined) } as any,
      { ping: jest.fn().mockResolvedValue(undefined) } as any,
    );

    await expect(
      service.run(join(tempDir, 'report-directory')),
    ).rejects.toMatchObject({
      preflight: {
        membersDb: { ok: false, message: 'missing members DB' },
        reportPath: { ok: false },
      },
    });
  });

  it('fails an existing read-only report file before source rows are processed', async () => {
    if (process.getuid?.() === 0) {
      return;
    }

    const reportPath = join(tempDir, 'readonly-report.json');
    await writeFile(reportPath, '{}', 'utf8');
    await chmod(reportPath, 0o400);

    const db = {
      ping: jest.fn().mockResolvedValue(undefined),
      topic: { count: jest.fn().mockResolvedValue(0) },
      post: { count: jest.fn().mockResolvedValue(0) },
      topicClosure: { count: jest.fn().mockResolvedValue(0) },
      topicWatch: { count: jest.fn().mockResolvedValue(0) },
      topicReadState: { count: jest.fn().mockResolvedValue(0) },
      memberBan: { count: jest.fn().mockResolvedValue(0) },
      ipBan: { count: jest.fn().mockResolvedValue(0) },
    };
    const preflightService = new VanillaImportPreflightService(
      db as any,
      { ping: jest.fn().mockResolvedValue(undefined) } as any,
      { ping: jest.fn().mockResolvedValue(undefined) } as any,
      { ping: jest.fn().mockResolvedValue(undefined) } as any,
    );
    const reportService = createReportService();
    const sourceReader = {
      readDiscussions: jest.fn(),
    };
    const service = new VanillaImportService(
      preflightService,
      sourceReader as any,
      {} as any,
      {} as any,
      {} as any,
      reportService as any,
    );

    try {
      await expect(
        service.run({ reportPath, command: ['cmd'] }),
      ).rejects.toMatchObject({
        preflight: {
          reportPath: { ok: false },
        },
      });
      expect(sourceReader.readDiscussions).not.toHaveBeenCalled();
    } finally {
      await chmod(reportPath, 0o600).catch(() => undefined);
    }
  });
});

describe('VanillaImportService', () => {
  it('flushes a failed report and does not read source rows when preflight fails', async () => {
    const { preflightService, reportService, service, sourceReader } =
      createImportService();
    const preflight = {
      ok: false,
      targetCounts: {
        topics: 1,
        posts: 0,
        topicClosures: 0,
        topicWatches: 0,
        topicReadStates: 0,
        memberBans: 0,
        ipBans: 0,
      },
      forumsDb: { ok: true },
      membersDb: { ok: true },
      challengeDb: { ok: true },
      vanillaDb: { ok: true },
      reportPath: { ok: true },
    };

    preflightService.run.mockRejectedValue(
      new VanillaImportPreflightError(preflight, 'non-empty target'),
    );

    await expect(
      service.run({ reportPath: '/tmp/report.json', command: ['cmd'] }),
    ).rejects.toThrow('non-empty target');
    expect(reportService.setPreflight).toHaveBeenCalledWith(preflight);
    expect(reportService.flush).toHaveBeenCalledWith(
      'failed',
      'non-empty target',
    );
    expect(sourceReader.readDiscussions).not.toHaveBeenCalled();
  });

  it('skips missing challenge targets and unmatched discussion authors', async () => {
    const { challengeLookup, reportService, service, writer } =
      createImportService({
        discussions: [
          discussion({
            discussionId: '1',
            challengeId: 'missing-challenge',
          }),
          discussion({
            discussionId: '2',
            actor: actor('unmatched-author'),
          }),
          discussion({
            discussionId: '3',
            actor: actor('30'),
          }),
        ],
      });

    await service.run({ reportPath: '/tmp/report.json', command: ['cmd'] });

    expect(writer.importDiscussion).toHaveBeenCalledTimes(1);
    expect(challengeLookup.exists).toHaveBeenCalledWith('missing-challenge');
    expect(reportService.recordSkipped).toHaveBeenCalledWith('topics', {
      sourceId: '1',
      reason: 'missing_challenge',
      detail: { challengeId: 'missing-challenge' },
    });
    expect(reportService.recordSkipped).toHaveBeenCalledWith('topics', {
      sourceId: '2',
      reason: 'unmatched_discussion_author',
      detail: { legacyUserId: 'unmatched-author' },
    });
  });

  it('skips an unmatched reply and its descendant branch without reparenting', async () => {
    const { reportService, service, writer } = createImportService({
      discussions: [discussion({ discussionId: '1', actor: actor('10') })],
      replies: {
        '1': [
          reply({
            replyId: '100',
            actor: actor('unmatched-reply'),
          }),
          reply({
            replyId: '101',
            parentReplyId: '100',
            actor: actor('11'),
          }),
        ],
      },
    });

    await service.run({ reportPath: '/tmp/report.json', command: ['cmd'] });

    expect(writer.importReply).not.toHaveBeenCalled();
    expect(reportService.recordSkipped).toHaveBeenCalledWith('replies', {
      sourceId: '100',
      reason: 'unmatched_reply_author',
    });
    expect(reportService.recordSkipped).toHaveBeenCalledWith('replies', {
      sourceId: '101',
      reason: 'unmatched_reply_author',
      detail: { ancestorReplyId: '100' },
    });
  });

  it('skips unmatched state and ban rows plus unsupported IP rules', async () => {
    const { reportService, service } = createImportService({
      discussions: [discussion({ discussionId: '1', actor: actor('10') })],
      watches: [
        {
          discussionId: '1',
          createdAt: new Date('2020-01-03T00:00:00.000Z'),
          actor: actor('unmatched-watch'),
        },
      ],
      readStates: [
        {
          discussionId: '1',
          readAt: new Date('2020-01-04T00:00:00.000Z'),
          actor: actor('unmatched-read'),
        },
      ],
      memberBans: [
        {
          banId: 'ban-1',
          createdAt: new Date('2020-01-05T00:00:00.000Z'),
          actor: actor('unmatched-ban'),
        },
      ],
      ipBans: [
        {
          banId: 'ip-ban-1',
          ipAddress: '192.0.2.0/24',
          createdAt: new Date('2020-01-06T00:00:00.000Z'),
        },
      ],
    });

    await service.run({ reportPath: '/tmp/report.json', command: ['cmd'] });

    expect(reportService.recordSkipped).toHaveBeenCalledWith('watches', {
      sourceId: '1:unmatched-watch',
      reason: 'unmatched_watch_member',
    });
    expect(reportService.recordSkipped).toHaveBeenCalledWith('readState', {
      sourceId: '1:unmatched-read',
      reason: 'unmatched_read_state_member',
    });
    expect(reportService.recordSkipped).toHaveBeenCalledWith('memberBans', {
      sourceId: 'ban-1',
      reason: 'unmatched_member_ban_member',
    });
    expect(reportService.recordSkipped).toHaveBeenCalledWith('ipBans', {
      sourceId: 'ip-ban-1',
      reason: 'unsupported_non_exact_ip_rule',
      detail: { ipAddress: '192.0.2.0/24' },
    });
  });
});
