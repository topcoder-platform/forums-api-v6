import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { IpBan, MemberBan, Topic } from '../../prisma/generated/client';
import { AuthModule } from '../auth/auth.module';
import { JwtService } from '../auth/jwt.service';
import {
  FORUMS_SCOPE_CREATE_TOPIC,
  FORUMS_SCOPE_MODERATE,
} from '../auth/scope-mappings';
import { DbService } from '../db/db.service';
import { ForumsModule } from './forums.module';

const createdAt = new Date('2026-06-04T00:00:00.000Z');

interface TopicClosureSeed {
  ancestorTopicId: string;
  descendantTopicId: string;
  depth: number;
}

interface ModerationSeedData {
  topics: Topic[];
  topicClosures: TopicClosureSeed[];
  memberBans: MemberBan[];
  ipBans: IpBan[];
}

/**
 * Builds a persisted topic row for moderation endpoint integration tests.
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
 * Builds a persisted member ban row for moderation endpoint integration tests.
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
 * Builds a persisted IP ban row for moderation endpoint integration tests.
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
    createdByMemberId: null,
    removedAt: null,
    removedByMemberId: null,
    ...overrides,
  };
}

/**
 * Creates a Prisma-shaped in-memory forums database for moderation endpoints.
 *
 * @param seed Mutable moderation seed data.
 * @returns Minimal DbService double backed by the supplied seed data.
 * @throws Does not throw directly; unsupported raw query shapes return empty results.
 */
function createModerationDb(seed: ModerationSeedData) {
  let memberBanCounter = 1;
  let ipBanCounter = 1;
  const topicById = () =>
    new Map(seed.topics.map((topic) => [topic.id, topic]));

  const db = {
    $queryRaw: (query: { strings?: string[]; values?: unknown[] }) => {
      const queryText = Array.isArray(query.strings)
        ? query.strings.join('')
        : '';
      const values = Array.isArray(query.values) ? query.values : [];

      if (queryText.includes('SELECT host')) {
        return [{ ipAddress: queryValueToString(values[0]) }];
      }

      return [];
    },
    topic: {
      findUnique: (args: { where: { id: string } }) =>
        topicById().get(args.where.id) ?? null,
      update: (args: {
        where: { id: string };
        data: Partial<Pick<Topic, 'locked' | 'lockedAt' | 'lockedByMemberId'>>;
      }) => {
        const topic = topicById().get(args.where.id);

        if (!topic) {
          return null;
        }

        Object.assign(topic, args.data, {
          updatedAt: new Date('2026-06-04T01:00:00.000Z'),
        });

        return topic;
      },
    },
    topicClosure: {
      findMany: (args: {
        where?: { descendantTopicId?: string };
        include?: { ancestorTopic?: boolean };
        orderBy?: { depth?: 'asc' | 'desc' };
      }) =>
        seed.topicClosures
          .filter(
            (closure) =>
              !args.where?.descendantTopicId ||
              closure.descendantTopicId === args.where.descendantTopicId,
          )
          .sort((left, right) =>
            args.orderBy?.depth === 'desc'
              ? right.depth - left.depth
              : left.depth - right.depth,
          )
          .map((closure) =>
            args.include?.ancestorTopic
              ? {
                  ...closure,
                  ancestorTopic: topicById().get(closure.ancestorTopicId),
                }
              : closure,
          ),
    },
    memberBan: {
      findFirst: (args: {
        where: { memberId: string; removedAt?: null };
        orderBy?: { createdAt?: 'desc'; id?: 'desc' }[];
      }) => {
        const rows = seed.memberBans
          .filter(
            (ban) =>
              ban.memberId === args.where.memberId &&
              (!('removedAt' in args.where) ||
                ban.removedAt === args.where.removedAt),
          )
          .sort(compareCreatedAtThenIdDesc);

        return rows[0] ?? null;
      },
      create: (args: {
        data: { memberId: string; createdByMemberId: string | null };
      }) => {
        const ban = makeMemberBan({
          id: `member-ban-${memberBanCounter}`,
          memberId: args.data.memberId,
          createdByMemberId: args.data.createdByMemberId,
          createdAt: new Date(
            `2026-06-04T00:${memberBanCounter.toString().padStart(2, '0')}:00.000Z`,
          ),
        });

        memberBanCounter += 1;
        seed.memberBans.push(ban);
        return ban;
      },
      update: (args: {
        where: { id: string };
        data: { removedAt: Date; removedByMemberId: string | null };
      }) => {
        const ban = seed.memberBans.find(
          (memberBan) => memberBan.id === args.where.id,
        );

        if (!ban) {
          return null;
        }

        Object.assign(ban, args.data);
        return ban;
      },
    },
    ipBan: {
      findFirst: (args: {
        where: { ipAddress: string; removedAt?: null };
        orderBy?: { createdAt?: 'desc'; id?: 'desc' }[];
      }) => {
        const rows = seed.ipBans
          .filter(
            (ban) =>
              ban.ipAddress === args.where.ipAddress &&
              (!('removedAt' in args.where) ||
                ban.removedAt === args.where.removedAt),
          )
          .sort(compareCreatedAtThenIdDesc);

        return rows[0] ?? null;
      },
      create: (args: {
        data: { ipAddress: string; createdByMemberId: string | null };
      }) => {
        const ban = makeIpBan({
          id: `ip-ban-${ipBanCounter}`,
          ipAddress: args.data.ipAddress,
          createdByMemberId: args.data.createdByMemberId,
          createdAt: new Date(
            `2026-06-04T00:${ipBanCounter.toString().padStart(2, '0')}:00.000Z`,
          ),
        });

        ipBanCounter += 1;
        seed.ipBans.push(ban);
        return ban;
      },
      update: (args: {
        where: { id: string };
        data: { removedAt: Date; removedByMemberId: string | null };
      }) => {
        const ban = seed.ipBans.find((ipBan) => ipBan.id === args.where.id);

        if (!ban) {
          return null;
        }

        Object.assign(ban, args.data);
        return ban;
      },
    },
  };

  return db;
}

/**
 * Converts primitive Prisma SQL values into strings for fake query matching.
 *
 * @param value Raw value from a Prisma SQL object.
 * @returns String value for primitive inputs, otherwise an empty string.
 * @throws Does not throw.
 */
function queryValueToString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Sorts ban rows by newest creation date and id.
 *
 * @param left First ban row.
 * @param right Second ban row.
 * @returns Negative, zero, or positive sort value.
 * @throws Does not throw.
 */
function compareCreatedAtThenIdDesc(
  left: { createdAt: Date; id: string },
  right: { createdAt: Date; id: string },
): number {
  return (
    right.createdAt.getTime() - left.createdAt.getTime() ||
    right.id.localeCompare(left.id)
  );
}

describe('forums moderation endpoints', () => {
  let app: INestApplication;
  let seedData: ModerationSeedData;

  beforeEach(async () => {
    seedData = {
      topics: [makeTopic()],
      topicClosures: [
        {
          ancestorTopicId: 'topic-1',
          descendantTopicId: 'topic-1',
          depth: 0,
        },
      ],
      memberBans: [],
      ipBans: [],
    };

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          isGlobal: true,
          load: [
            () => ({
              app: { trustForwardedClientIp: false },
              auth: { authSecret: 'test-secret', validIssuers: '[]' },
            }),
          ],
        }),
        AuthModule,
        ForumsModule,
      ],
    })
      .overrideProvider(DbService)
      .useValue(createModerationDb(seedData))
      .overrideProvider(JwtService)
      .useValue({ validateToken: jest.fn() })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.use((req: any, _res: any, next: () => void) => {
      const tokenType = req.header('x-token-type');

      if (tokenType === 'machine') {
        req.user = {
          roles: splitHeader(req.header('x-roles')),
          scopes: splitHeader(req.header('x-scopes')),
          isMachine: true,
        };
        next();
        return;
      }

      req.user = {
        userId: req.header('x-member-id') ?? '1',
        handle: req.header('x-handle') ?? 'admin',
        roles: splitHeader(req.header('x-roles')),
        scopes: splitHeader(req.header('x-scopes')),
        isMachine: false,
      };
      next();
    });
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('allows admin humans to lock and unlock topics', async () => {
    const lockResponse = await request(app.getHttpServer())
      .put('/moderation/topics/topic-1/lock')
      .set('x-member-id', '1')
      .set('x-roles', 'administrator')
      .expect(200);

    expect(lockResponse.body).toEqual(
      expect.objectContaining({
        topicId: 'topic-1',
        locked: true,
        lockedBy: '1',
      }),
    );
    expect(seedData.topics[0]).toEqual(
      expect.objectContaining({
        locked: true,
        lockedByMemberId: '1',
      }),
    );

    const unlockResponse = await request(app.getHttpServer())
      .delete('/moderation/topics/topic-1/lock')
      .set('x-member-id', '1')
      .set('x-roles', 'administrator')
      .expect(200);

    expect(unlockResponse.body).toEqual(
      expect.objectContaining({
        topicId: 'topic-1',
        locked: false,
        lockedBy: null,
        lockedAt: null,
      }),
    );
  });

  it('returns 403 for challenge copilots on moderation endpoints', async () => {
    await request(app.getHttpServer())
      .put('/moderation/topics/topic-1/lock')
      .set('x-member-id', '6')
      .set('x-roles', 'copilot')
      .expect(403);

    expect(seedData.topics[0].locked).toBe(false);
  });

  it('allows scoped M2M callers to ban and unban IP addresses with null audit member ids', async () => {
    const banResponse = await request(app.getHttpServer())
      .put('/moderation/ip-bans/203.0.113.10')
      .set('x-token-type', 'machine')
      .set('x-scopes', FORUMS_SCOPE_MODERATE)
      .expect(200);

    expect(banResponse.body).toEqual(
      expect.objectContaining({
        ipAddress: '203.0.113.10',
        active: true,
        createdByMemberId: null,
      }),
    );
    expect(seedData.ipBans).toHaveLength(1);

    const unbanResponse = await request(app.getHttpServer())
      .delete('/moderation/ip-bans/203.0.113.10')
      .set('x-token-type', 'machine')
      .set('x-scopes', FORUMS_SCOPE_MODERATE)
      .expect(200);

    expect(unbanResponse.body).toEqual(
      expect.objectContaining({
        ipAddress: '203.0.113.10',
        active: false,
        removedByMemberId: null,
      }),
    );
  });

  it('denies unscoped M2M callers on moderation endpoints', async () => {
    await request(app.getHttpServer())
      .put('/moderation/member-bans/2')
      .set('x-token-type', 'machine')
      .set('x-scopes', FORUMS_SCOPE_CREATE_TOPIC)
      .expect(403);

    expect(seedData.memberBans).toHaveLength(0);
  });

  it('creates idempotent audited member bans for admin humans', async () => {
    const firstResponse = await request(app.getHttpServer())
      .put('/moderation/member-bans/2')
      .set('x-member-id', '1')
      .set('x-roles', 'administrator')
      .expect(200);

    const secondResponse = await request(app.getHttpServer())
      .put('/moderation/member-bans/2')
      .set('x-member-id', '1')
      .set('x-roles', 'administrator')
      .expect(200);

    expect(firstResponse.body).toEqual(
      expect.objectContaining({
        id: 'member-ban-1',
        memberId: '2',
        active: true,
        createdByMemberId: '1',
      }),
    );
    expect(secondResponse.body).toEqual(
      expect.objectContaining({
        id: 'member-ban-1',
        active: true,
      }),
    );
    expect(seedData.memberBans).toHaveLength(1);
  });

  it('rejects invalid IP ban targets', async () => {
    await request(app.getHttpServer())
      .put('/moderation/ip-bans/not-an-ip')
      .set('x-member-id', '1')
      .set('x-roles', 'administrator')
      .expect(400);

    expect(seedData.ipBans).toHaveLength(0);
  });
});

/**
 * Splits comma-delimited test header values into role or scope arrays.
 *
 * @param value Raw test header value.
 * @returns Trimmed non-empty entries.
 * @throws Does not throw.
 */
function splitHeader(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}
