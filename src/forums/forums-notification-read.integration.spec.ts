import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { Post, PostReactionType, Topic } from '../../prisma/generated/client';
import { DbService } from '../db/db.service';
import { ChallengeAccessService } from './challenge-access.service';
import { EventBusService } from './event-bus.service';
import { ForumsMemberDirectoryService } from './forums-member-directory.service';
import { ForumsModule } from './forums.module';
import { IdentityAccessService } from './identity-access.service';
import { MemberHandleService } from './member-handle.service';
import { ResourceAccessService } from './resource-access.service';

const createdAt = new Date('2026-06-04T00:00:00.000Z');

interface TopicClosureSeed {
  ancestorTopicId: string;
  descendantTopicId: string;
  depth: number;
}

interface TopicWatchSeed {
  topicId: string;
  memberId: string;
}

interface TopicReadStateSeed {
  topicId: string;
  memberId: string;
  lastReadAt: Date;
}

interface MemberBanSeed {
  id: string;
  memberId: string;
  removedAt: Date | null;
}

interface IpBanSeed {
  id: string;
  ipAddress: string;
  removedAt: Date | null;
}

interface PostReactionSeed {
  postId: string;
  memberId: string;
  reaction: PostReactionType;
}

interface SeededForumsData {
  topics: Topic[];
  posts: Post[];
  postReactions: PostReactionSeed[];
  topicClosures: TopicClosureSeed[];
  topicWatches: TopicWatchSeed[];
  topicReadStates: TopicReadStateSeed[];
  memberBans: MemberBanSeed[];
  ipBans: IpBanSeed[];
}

/**
 * Builds a persisted topic row for the notification/read integration spec.
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
 * Builds a persisted post row for the notification/read integration spec.
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
 * Creates a Prisma-shaped in-memory forums database for integration tests.
 *
 * @param seed Mutable seed data used by command, notification, and read services.
 * @returns Minimal DbService double backed by the supplied seed data.
 * @throws Does not throw directly; unsupported query shapes return empty results.
 */
function createSeededForumsDb(seed: SeededForumsData) {
  let nextTopicId = 1;
  let nextPostId = 1;
  const topicById = () =>
    new Map(seed.topics.map((topic) => [topic.id, topic]));
  const db = {
    $transaction: (callback: (transaction: typeof db) => Promise<unknown>) =>
      callback(db),
    $queryRaw: (query: { strings?: string[]; values?: unknown[] }) => {
      const queryText = Array.isArray(query.strings)
        ? query.strings.join('')
        : '';
      const values = Array.isArray(query.values) ? query.values : [];
      const topicId = values
        .map((value) => queryValueToString(value))
        .find((value) => topicById().has(value));

      if (queryText.includes('FROM "IpBan"')) {
        const trustedClientIp = queryValueToString(values[0]);
        const ban = seed.ipBans.find(
          (ipBan) => !ipBan.removedAt && ipBan.ipAddress === trustedClientIp,
        );

        return ban ? [{ id: ban.id }] : [];
      }

      if (queryText.includes('SELECT\n        p.id')) {
        const viewerMemberId = queryValueToString(values[0]);

        return seed.posts
          .filter((post) => post.topicId === topicId)
          .sort(compareCreatedAtThenId)
          .map((post) => {
            const reactions = seed.postReactions.filter(
              (reaction) => reaction.postId === post.id,
            );

            return {
              id: post.id,
              topicId: post.topicId,
              parentType: post.parentType,
              parentId: post.parentId,
              authorMemberId: post.authorMemberId,
              authorHandle: post.authorHandle,
              authorPostsCount: seed.posts.filter(
                (candidate) =>
                  candidate.topicId === post.topicId &&
                  candidate.authorMemberId === post.authorMemberId &&
                  !candidate.deletedAt,
              ).length,
              content: post.content,
              createdAt: post.createdAt,
              updatedAt: post.updatedAt,
              deletedAt: post.deletedAt,
              thumbsUpCount: reactions.filter(
                (reaction) =>
                  reaction.reaction === PostReactionType.THUMBS_UP,
              ).length,
              thumbsDownCount: reactions.filter(
                (reaction) =>
                  reaction.reaction === PostReactionType.THUMBS_DOWN,
              ).length,
              viewerReaction:
                reactions.find(
                  (reaction) => reaction.memberId === viewerMemberId,
                )?.reaction ?? null,
            };
          });
      }

      if (queryText.includes('SELECT EXISTS')) {
        return [{ active: Boolean(topicId && isTopicActive(seed, topicId)) }];
      }

      if (queryText.includes('FROM "Topic" t') && topicId) {
        const topic = topicById().get(topicId);

        return topic && isTopicActive(seed, topic.id)
          ? [buildTopicSummaryRow(seed, topic, queryValueToString(values[0]))]
          : [];
      }

      return [];
    },
    memberBan: {
      findFirst: (args: {
        where: { memberId: string; removedAt: null };
        select: { id: boolean };
      }) => {
        const ban =
          seed.memberBans.find(
            (memberBan) =>
              memberBan.memberId === args.where.memberId &&
              memberBan.removedAt === args.where.removedAt,
          ) ?? null;

        return ban && args.select.id ? { id: ban.id } : ban;
      },
    },
    topic: {
      findUnique: (args: { where: { id: string } }) =>
        topicById().get(args.where.id) ?? null,
      create: (args: {
        data: {
          parentTopicId: string | null;
          challengeId: string | null;
          roleName: string | null;
          title: string;
          isAnnouncement: boolean;
          authorMemberId: string;
          authorHandle: string;
        };
      }) => {
        const topic = makeTopic({
          id: `child-${nextTopicId}`,
          parentTopicId: args.data.parentTopicId,
          challengeId: args.data.challengeId,
          roleName: args.data.roleName,
          title: args.data.title,
          isAnnouncement: args.data.isAnnouncement,
          authorMemberId: args.data.authorMemberId,
          authorHandle: args.data.authorHandle,
          createdAt: new Date(`2026-06-04T00:0${nextTopicId}:00.000Z`),
          updatedAt: new Date(`2026-06-04T00:0${nextTopicId}:00.000Z`),
        });

        nextTopicId += 1;
        seed.topics.push(topic);
        return topic;
      },
    },
    post: {
      create: (args: {
        data: {
          topicId: string;
          parentType: string;
          parentId: string;
          authorMemberId: string;
          authorHandle: string;
          content: string;
        };
      }) => {
        const post = makePost({
          id: `starter-${nextPostId}`,
          topicId: args.data.topicId,
          parentType: args.data.parentType,
          parentId: args.data.parentId,
          authorMemberId: args.data.authorMemberId,
          authorHandle: args.data.authorHandle,
          content: args.data.content,
          createdAt: new Date(`2026-06-04T00:1${nextPostId}:00.000Z`),
          updatedAt: new Date(`2026-06-04T00:1${nextPostId}:00.000Z`),
        });

        nextPostId += 1;
        seed.posts.push(post);
        return post;
      },
      findFirst: (args: { where: { id: string; topicId: string } }) =>
        seed.posts.find(
          (post) =>
            post.id === args.where.id && post.topicId === args.where.topicId,
        ) ?? null,
      findUnique: (args: { where: { id: string } }) =>
        seed.posts.find((post) => post.id === args.where.id) ?? null,
    },
    postReaction: {
      upsert: (args: {
        where: {
          postId_memberId: { postId: string; memberId: string };
        };
        create: PostReactionSeed;
        update: { reaction: PostReactionType };
      }) => {
        const existing = seed.postReactions.find(
          (reaction) =>
            reaction.postId === args.where.postId_memberId.postId &&
            reaction.memberId === args.where.postId_memberId.memberId,
        );

        if (existing) {
          existing.reaction = args.update.reaction;
          return existing;
        }

        seed.postReactions.push(args.create);
        return args.create;
      },
      deleteMany: (args: {
        where: { postId: string; memberId: string };
      }) => {
        const index = seed.postReactions.findIndex(
          (reaction) =>
            reaction.postId === args.where.postId &&
            reaction.memberId === args.where.memberId,
        );

        if (index < 0) {
          return { count: 0 };
        }

        seed.postReactions.splice(index, 1);
        return { count: 1 };
      },
      count: (args: {
        where: { postId: string; reaction: PostReactionType };
      }) =>
        seed.postReactions.filter(
          (reaction) =>
            reaction.postId === args.where.postId &&
            reaction.reaction === args.where.reaction,
        ).length,
    },
    topicClosure: {
      findMany: (args: {
        where?: {
          ancestorTopicId?: string | { not?: string };
          descendantTopicId?: string | { not?: string };
          ancestorTopic?: { deletedAt?: { not?: null } };
        };
        include?: { ancestorTopic?: boolean };
        orderBy?: { depth?: 'asc' | 'desc' };
        select?: { ancestorTopicId?: boolean; depth?: boolean };
      }) => {
        const rows = seed.topicClosures
          .filter((closure) => matchesClosureWhere(seed, closure, args.where))
          .sort((left, right) =>
            args.orderBy?.depth === 'desc'
              ? right.depth - left.depth
              : left.depth - right.depth,
          );

        return rows.map((closure) => {
          if (args.include?.ancestorTopic) {
            return {
              ...closure,
              ancestorTopic: topicById().get(closure.ancestorTopicId),
            };
          }

          if (args.select?.ancestorTopicId && args.select?.depth) {
            return {
              ancestorTopicId: closure.ancestorTopicId,
              depth: closure.depth,
            };
          }

          if (args.select?.ancestorTopicId) {
            return { ancestorTopicId: closure.ancestorTopicId };
          }

          return closure;
        });
      },
      findFirst: (args: {
        where?: {
          ancestorTopicId?: string | { not?: string };
          descendantTopicId?: string | { not?: string };
          ancestorTopic?: { deletedAt?: { not?: null } };
        };
        select?: { ancestorTopicId?: boolean };
      }) => {
        const row =
          seed.topicClosures.find((closure) =>
            matchesClosureWhere(seed, closure, args.where),
          ) ?? null;

        return row && args.select?.ancestorTopicId
          ? { ancestorTopicId: row.ancestorTopicId }
          : row;
      },
      createMany: (args: { data: TopicClosureSeed[] }) => {
        seed.topicClosures.push(...args.data);
        return { count: args.data.length };
      },
    },
    topicWatch: {
      findMany: (args: {
        where: { topicId: { in: string[] }; memberId: { not: string } };
        select: { memberId: boolean };
      }) =>
        seed.topicWatches
          .filter(
            (watch) =>
              args.where.topicId.in.includes(watch.topicId) &&
              watch.memberId !== args.where.memberId.not,
          )
          .map((watch) => ({ memberId: watch.memberId })),
      upsert: (args: {
        where: { topicId_memberId: TopicWatchSeed };
        create: TopicWatchSeed;
      }) => {
        const existing = seed.topicWatches.find(
          (watch) =>
            watch.topicId === args.where.topicId_memberId.topicId &&
            watch.memberId === args.where.topicId_memberId.memberId,
        );

        if (existing) {
          return existing;
        }

        seed.topicWatches.push(args.create);
        return args.create;
      },
    },
    topicReadState: {
      upsert: (args: {
        where: { topicId_memberId: { topicId: string; memberId: string } };
        create: TopicReadStateSeed;
        update: { lastReadAt: Date };
      }) => {
        const existing = seed.topicReadStates.find(
          (readState) =>
            readState.topicId === args.where.topicId_memberId.topicId &&
            readState.memberId === args.where.topicId_memberId.memberId,
        );

        if (existing) {
          existing.lastReadAt = args.update.lastReadAt;
          return existing;
        }

        seed.topicReadStates.push(args.create);
        return args.create;
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
  if (typeof value === 'string') {
    return value;
  }

  if (
    typeof value === 'number' ||
    typeof value === 'bigint' ||
    typeof value === 'boolean'
  ) {
    return value.toString();
  }

  return '';
}

/**
 * Checks whether a closure row satisfies the Prisma-like where subset used here.
 *
 * @param seed Mutable seed data containing topics and closure rows.
 * @param closure Closure row being evaluated.
 * @param where Minimal Prisma where object used by forums services.
 * @returns True when the closure row matches the where subset.
 * @throws Does not throw.
 */
function matchesClosureWhere(
  seed: SeededForumsData,
  closure: TopicClosureSeed,
  where:
    | {
        ancestorTopicId?: string | { not?: string };
        descendantTopicId?: string | { not?: string };
        ancestorTopic?: { deletedAt?: { not?: null } };
      }
    | undefined,
): boolean {
  if (!where) {
    return true;
  }

  return (
    matchesStringFilter(closure.ancestorTopicId, where.ancestorTopicId) &&
    matchesStringFilter(closure.descendantTopicId, where.descendantTopicId) &&
    matchesDeletedAncestorFilter(seed, closure, where.ancestorTopic)
  );
}

/**
 * Checks a string against the exact/not filter subset used by the fake DB.
 *
 * @param value Row value being evaluated.
 * @param filter Exact string or `{ not }` string filter.
 * @returns True when the value satisfies the filter.
 * @throws Does not throw.
 */
function matchesStringFilter(
  value: string,
  filter: string | { not?: string } | undefined,
): boolean {
  if (!filter) {
    return true;
  }

  if (typeof filter === 'string') {
    return value === filter;
  }

  if (filter.not !== undefined) {
    return value !== filter.not;
  }

  return true;
}

/**
 * Applies the deleted-ancestor relation filter used by active-topic checks.
 *
 * @param seed Mutable seed data containing topics and closure rows.
 * @param closure Closure row being evaluated.
 * @param filter Minimal relation filter for ancestor topic deletion.
 * @returns True when no relation filter is present or the ancestor is deleted.
 * @throws Does not throw.
 */
function matchesDeletedAncestorFilter(
  seed: SeededForumsData,
  closure: TopicClosureSeed,
  filter: { deletedAt?: { not?: null } } | undefined,
): boolean {
  if (!filter?.deletedAt) {
    return true;
  }

  return Boolean(
    seed.topics.find((topic) => topic.id === closure.ancestorTopicId)
      ?.deletedAt,
  );
}

/**
 * Builds the topic summary row returned by the real read query service.
 *
 * @param seed Mutable seed data containing topics, posts, and read states.
 * @param topic Topic row to summarize.
 * @param memberId Member id used for unread derivation.
 * @returns Read-query summary row shape consumed by ForumsReadService.
 * @throws Does not throw.
 */
function buildTopicSummaryRow(
  seed: SeededForumsData,
  topic: Topic,
  memberId: string,
) {
  const posts = seed.posts
    .filter((post) => post.topicId === topic.id && !post.deletedAt)
    .sort(compareCreatedAtThenId);
  const latestPost = posts[posts.length - 1] ?? null;
  const readState = seed.topicReadStates.find(
    (state) => state.topicId === topic.id && state.memberId === memberId,
  );
  const participantsByMemberId = new Map<
    string,
    { memberId: string; handle: string }
  >();

  for (const post of posts) {
    participantsByMemberId.set(post.authorMemberId, {
      memberId: post.authorMemberId,
      handle: post.authorHandle,
    });
  }

  const participants = Array.from(participantsByMemberId.values());

  return {
    id: topic.id,
    parentTopicId: topic.parentTopicId,
    challengeId: topic.challengeId,
    roleName: topic.roleName,
    title: topic.title,
    isAnnouncement: topic.isAnnouncement,
    locked: topic.locked,
    lockedBy: topic.lockedByMemberId,
    lockedAt: topic.lockedAt,
    authorMemberId: topic.authorMemberId,
    authorHandle: topic.authorHandle,
    createdAt: topic.createdAt,
    updatedAt: topic.updatedAt,
    postsCount: posts.length,
    viewsCount: seed.topicReadStates.filter(
      (state) => state.topicId === topic.id,
    ).length,
    watching: seed.topicWatches.some(
      (watch) => watch.topicId === topic.id && watch.memberId === memberId,
    ),
    starterPostExcerpt: posts[0]?.content?.slice(0, 280) ?? null,
    participantsCount: participants.length,
    participants: participants.slice(0, 5),
    latestPostId: latestPost?.id ?? null,
    latestPostAuthorMemberId: latestPost?.authorMemberId ?? null,
    latestPostAuthorHandle: latestPost?.authorHandle ?? null,
    latestActivityAt: latestPost?.createdAt ?? null,
    unread: Boolean(
      memberId &&
      latestPost &&
      (!readState || readState.lastReadAt < latestPost.createdAt),
    ),
  };
}

/**
 * Determines whether a topic and all of its ancestors are active.
 *
 * @param seed Mutable seed data containing topics and closure rows.
 * @param topicId Topic id to evaluate.
 * @returns True when the topic exists and no topic in its active chain is deleted.
 * @throws Does not throw.
 */
function isTopicActive(seed: SeededForumsData, topicId: string): boolean {
  const topicById = new Map(seed.topics.map((topic) => [topic.id, topic]));
  const topic = topicById.get(topicId);

  if (!topic || topic.deletedAt) {
    return false;
  }

  return !seed.topicClosures.some(
    (closure) =>
      closure.descendantTopicId === topicId &&
      closure.ancestorTopicId !== topicId &&
      Boolean(topicById.get(closure.ancestorTopicId)?.deletedAt),
  );
}

/**
 * Sorts persisted rows by created date and id for deterministic tree assembly.
 *
 * @param left First row with createdAt and id fields.
 * @param right Second row with createdAt and id fields.
 * @returns Negative, zero, or positive sort value.
 * @throws Does not throw.
 */
function compareCreatedAtThenId(
  left: { createdAt: Date; id: string },
  right: { createdAt: Date; id: string },
): number {
  const createdAtDelta = left.createdAt.getTime() - right.createdAt.getTime();

  return createdAtDelta || left.id.localeCompare(right.id);
}

describe('forums notification/read integration', () => {
  let app: INestApplication;
  let seedData: SeededForumsData;
  const rolesByMemberId = new Map<string, string[]>([
    ['1', ['reviewer']],
    ['2', ['reviewer']],
    ['3', []],
    ['4', ['reviewer']],
    ['5', ['reviewer']],
    ['6', ['reviewer']],
    ['7', []],
  ]);
  const challengeMembers = new Set(['1', '2', '3', '5']);
  const challengeCopilots = new Set(['6', '7']);
  const emailsByMemberId = new Map<string, string>([
    ['1', 'author@example.com'],
    ['2', 'two@example.com'],
    ['3', 'three@example.com'],
    ['4', 'four@example.com'],
    ['5', 'five@example.com'],
    ['6', 'six@example.com'],
    ['7', 'seven@example.com'],
  ]);
  const publishedEvents: { topic: string; payload: any }[] = [];

  beforeEach(async () => {
    publishedEvents.length = 0;

    seedData = {
      topics: [
        makeTopic({
          id: 'parent-1',
          title: 'General root',
        }),
        makeTopic({
          id: 'legacy-locked',
          title: 'Imported locked topic',
          locked: true,
          lockedAt: null,
          lockedByMemberId: null,
        }),
      ],
      posts: [],
      postReactions: [],
      topicClosures: [
        {
          ancestorTopicId: 'parent-1',
          descendantTopicId: 'parent-1',
          depth: 0,
        },
        {
          ancestorTopicId: 'legacy-locked',
          descendantTopicId: 'legacy-locked',
          depth: 0,
        },
      ],
      topicWatches: [
        { topicId: 'parent-1', memberId: '1' },
        { topicId: 'parent-1', memberId: '2' },
        { topicId: 'parent-1', memberId: '3' },
        { topicId: 'parent-1', memberId: '4' },
        { topicId: 'parent-1', memberId: '5' },
        { topicId: 'parent-1', memberId: '6' },
        { topicId: 'parent-1', memberId: '7' },
      ],
      topicReadStates: [],
      memberBans: [],
      ipBans: [],
    };
    const db = createSeededForumsDb(seedData);
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          isGlobal: true,
          load: [
            () => ({
              notifications: {
                sendgridNotificationTemplate: 'template-id',
              },
            }),
          ],
        }),
        ForumsModule,
      ],
    })
      .overrideProvider(DbService)
      .useValue(db)
      .overrideProvider(ChallengeAccessService)
      .useValue({
        getChallengeAccessFacts: jest.fn(
          (_challengeId: string, memberId: string | null) => ({
            configured: true,
            challengeExists: true,
            memberHasChallengeAccess: Boolean(
              memberId && challengeMembers.has(memberId),
            ),
            memberIsWhitelisted: false,
          }),
        ),
      })
      .overrideProvider(ResourceAccessService)
      .useValue({
        getResourceAccessFacts: jest.fn(
          (_challengeId: string, memberId: string | null) => ({
            configured: true,
            hasChallengeResource: Boolean(
              memberId && challengeCopilots.has(memberId),
            ),
            isChallengeCopilot: Boolean(
              memberId && challengeCopilots.has(memberId),
            ),
            hasFullReadAccess: false,
            hasFullWriteAccess: false,
            roleNames: [],
          }),
        ),
      })
      .overrideProvider(IdentityAccessService)
      .useValue({
        getMemberRoleNames: jest.fn(
          (memberId: string) => rolesByMemberId.get(memberId) ?? [],
        ),
      })
      .overrideProvider(ForumsMemberDirectoryService)
      .useValue({
        getMembersByIds: jest.fn((memberIds: readonly string[]) =>
          memberIds.map((memberId) => ({
            memberId,
            email: emailsByMemberId.get(memberId) ?? null,
            handle: `member-${memberId}`,
          })),
        ),
      })
      .overrideProvider(MemberHandleService)
      .useValue({
        resolveHandleByMemberId: jest.fn((memberId: string) =>
          memberId === '1' ? 'author' : undefined,
        ),
      })
      .overrideProvider(EventBusService)
      .useValue({
        postEvent: jest.fn((topic: string, payload: any) => {
          publishedEvents.push({ topic, payload });
        }),
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.use((req: any, _res: any, next: () => void) => {
      const memberId = req.header('x-member-id') ?? '1';

      req.resolvedClientIp = req.header('x-resolved-client-ip') ?? undefined;
      req.user = {
        userId: memberId,
        handle: memberId === '1' ? 'author' : `member-${memberId}`,
        roles: rolesByMemberId.get(memberId) ?? [],
        scopes: [],
        isMachine: false,
      };
      next();
    });
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('matches role-restricted child-topic notification recipients to read-visible ancestor watchers while excluding the author', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/topics')
      .set('x-member-id', '1')
      .send({
        title: 'Restricted child',
        content: 'Restricted starter content',
        parentTopicId: 'parent-1',
        roleName: 'reviewer',
      })
      .expect(201);

    const childTopicId = createResponse.body.topic.id as string;
    const visibleWatchedMemberIds: string[] = [];

    for (const memberId of ['2', '3', '4', '5', '6', '7']) {
      const detailResponse = await request(app.getHttpServer())
        .get(`/topics/${childTopicId}`)
        .set('x-member-id', memberId);

      if (detailResponse.status === 200) {
        visibleWatchedMemberIds.push(memberId);
      } else {
        expect(detailResponse.status).toBe(403);
      }
    }

    const authorDetailResponse = await request(app.getHttpServer())
      .get(`/topics/${childTopicId}`)
      .set('x-member-id', '1')
      .expect(200);

    expect(authorDetailResponse.body.topic).toEqual(
      expect.objectContaining({
        locked: false,
        lockedBy: null,
        lockedAt: null,
        participants: [
          { handle: 'author', memberId: '1' },
        ],
        participantsCount: 1,
        starterPostExcerpt: 'Restricted starter content',
        viewsCount: 1,
        watching: true,
      }),
    );
    expect(authorDetailResponse.body.posts[0]).toEqual(
      expect.objectContaining({ authorPostsCount: 1 }),
    );
    expect(publishedEvents).toHaveLength(1);
    expect(publishedEvents[0]).toEqual(
      expect.objectContaining({ topic: 'external.action.email' }),
    );

    const notifiedMemberIds = publishedEvents[0].payload.recipients.map(
      (email: string) =>
        Array.from(emailsByMemberId.entries()).find(
          ([, memberEmail]) => memberEmail === email,
        )?.[0],
    );

    expect(visibleWatchedMemberIds).toEqual(['2', '4', '5', '6']);
    expect(notifiedMemberIds).toEqual(visibleWatchedMemberIds);
    expect(publishedEvents[0].payload.recipients).not.toContain(
      'author@example.com',
    );
  });

  it('returns 403 for banned reads', async () => {
    seedData.memberBans.push({
      id: 'member-ban-2',
      memberId: '2',
      removedAt: null,
    });

    await request(app.getHttpServer())
      .get('/topics/parent-1')
      .set('x-member-id', '2')
      .expect(403);
  });

  it('returns 403 for trusted-header IP bans', async () => {
    seedData.ipBans.push({
      id: 'ip-ban-1',
      ipAddress: '203.0.113.10',
      removedAt: null,
    });

    await request(app.getHttpServer())
      .get('/topics/parent-1')
      .set('x-member-id', '1')
      .set('x-resolved-client-ip', '203.0.113.10')
      .expect(403);
  });

  it('ignores IP bans when no trusted client IP is resolved', async () => {
    seedData.ipBans.push({
      id: 'ip-ban-1',
      ipAddress: '203.0.113.10',
      removedAt: null,
    });

    await request(app.getHttpServer())
      .get('/topics/parent-1')
      .set('x-member-id', '1')
      .expect(200);
  });

  it('does not send watch notifications to banned users', async () => {
    seedData.memberBans.push({
      id: 'member-ban-4',
      memberId: '4',
      removedAt: null,
    });

    await request(app.getHttpServer())
      .post('/topics')
      .set('x-member-id', '1')
      .send({
        title: 'Restricted child',
        content: 'Restricted starter content',
        parentTopicId: 'parent-1',
        roleName: 'reviewer',
      })
      .expect(201);

    expect(publishedEvents).toHaveLength(1);
    expect(publishedEvents[0].payload.recipients).toEqual([
      'two@example.com',
      'five@example.com',
      'six@example.com',
    ]);
    expect(publishedEvents[0].payload.recipients).not.toContain(
      'four@example.com',
    );
  });

  it('returns imported locked topics with nullable legacy lock metadata', async () => {
    const response = await request(app.getHttpServer())
      .get('/topics/legacy-locked')
      .set('x-member-id', '1')
      .expect(200);

    expect(response.body.topic).toEqual(
      expect.objectContaining({
        id: 'legacy-locked',
        locked: true,
        lockedBy: null,
        lockedAt: null,
      }),
    );
  });

  it('shares post reaction counts while preserving each member viewer state', async () => {
    seedData.posts.push(makePost({ topicId: 'parent-1', parentId: 'parent-1' }));
    seedData.postReactions.push(
      {
        postId: 'post-1',
        memberId: '1',
        reaction: PostReactionType.THUMBS_UP,
      },
      {
        postId: 'post-1',
        memberId: '2',
        reaction: PostReactionType.THUMBS_DOWN,
      },
    );

    const memberOneDetail = await request(app.getHttpServer())
      .get('/topics/parent-1')
      .set('x-member-id', '1')
      .expect(200);

    expect(memberOneDetail.body.posts[0]).toEqual(
      expect.objectContaining({
        thumbsUpCount: 1,
        thumbsDownCount: 1,
        viewerReaction: PostReactionType.THUMBS_UP,
      }),
    );

    await request(app.getHttpServer())
      .put('/posts/post-1/reaction')
      .set('x-member-id', '1')
      .send({ reaction: PostReactionType.THUMBS_DOWN })
      .expect(200)
      .expect({
        postId: 'post-1',
        viewerReaction: PostReactionType.THUMBS_DOWN,
        thumbsUpCount: 0,
        thumbsDownCount: 2,
      });

    const memberTwoDetail = await request(app.getHttpServer())
      .get('/topics/parent-1')
      .set('x-member-id', '2')
      .expect(200);

    expect(memberTwoDetail.body.posts[0]).toEqual(
      expect.objectContaining({
        thumbsUpCount: 0,
        thumbsDownCount: 2,
        viewerReaction: PostReactionType.THUMBS_DOWN,
      }),
    );

    await request(app.getHttpServer())
      .delete('/posts/post-1/reaction')
      .set('x-member-id', '1')
      .expect(200)
      .expect({
        postId: 'post-1',
        viewerReaction: null,
        thumbsUpCount: 0,
        thumbsDownCount: 1,
      });
  });
});
