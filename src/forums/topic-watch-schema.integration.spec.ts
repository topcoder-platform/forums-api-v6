import { ConfigService } from '@nestjs/config';
import { DbService } from '../db/db.service';
import { ForumsReadQueryService } from './forums-read-query.service';

const databaseUrl = process.env.FORUMS_DATABASE_URL ?? process.env.DATABASE_URL;
const itWithDatabase = databaseUrl ? it : it.skip;
const challengeId = `watch-schema-${process.pid}-${Date.now()}`;

/** Verifies topic preference persistence and raw SQL projections against migrated PostgreSQL. */
describe('topic watch schema persistence', () => {
  let db: DbService;
  let queries: ForumsReadQueryService;
  const topicIds: string[] = [];

  beforeAll(async () => {
    if (!databaseUrl) return;
    const url = new URL(databaseUrl);
    url.searchParams.set('options', '-c search_path=forums,public');
    db = new DbService(new ConfigService({ database: { url: url.href } }));
    await db.$connect();
    queries = new ForumsReadQueryService(db);
    for (const title of ['Inherited', 'Watched', 'Unwatched']) {
      const topic = await db.topic.create({
        data: {
          challengeId,
          title,
          authorMemberId: 'watch-author',
          authorHandle: 'watch-author',
        },
      });
      topicIds.push(topic.id);
      await db.topicClosure.create({
        data: {
          ancestorTopicId: topic.id,
          descendantTopicId: topic.id,
          depth: 0,
        },
      });
    }
    await db.topicWatch.create({
      data: { topicId: topicIds[1], memberId: 'watch-member' },
    });
    await db.topicWatch.create({
      data: { topicId: topicIds[2], memberId: 'watch-member', watching: false },
    });
  });

  afterAll(async () => {
    if (!db) return;
    await db.topic.deleteMany({ where: { challengeId } });
    await db.challengeForumWatch.deleteMany({ where: { challengeId } });
    await db.$disconnect();
  });

  itWithDatabase(
    'distinguishes inherited, explicit watched and explicit unwatched topics in list and detail SQL',
    async () => {
      for (const watching of [false, true]) {
        await db.challengeForumWatch.upsert({
          where: {
            challengeId_memberId: { challengeId, memberId: 'watch-member' },
          },
          create: { challengeId, memberId: 'watch-member', watching },
          update: { watching },
        });
        const rows = await queries.findChallengeRootTopicSummaries(
          challengeId,
          'watch-member',
        );
        expect(
          topicIds.map((id) => rows.find((row) => row.id === id)?.watching),
        ).toEqual([null, true, false]);
        const detail = await queries.findTopicDetailSnapshot(
          topicIds[2],
          'watch-member',
        );
        expect(detail?.summaryRow.watching).toBe(false);
      }
      expect(
        await db.topicWatch.count({ where: { topicId: { in: topicIds } } }),
      ).toBe(2);
      const anonymousRows = await queries.findChallengeRootTopicSummaries(
        challengeId,
        null,
      );
      expect(anonymousRows.every((row) => row.watching === null)).toBe(true);
    },
  );

  itWithDatabase(
    'updates the same explicit opt-out row when a topic is watched again',
    async () => {
      const where = {
        topicId_memberId: { topicId: topicIds[2], memberId: 'watch-member' },
      };
      for (const watching of [false, false, true]) {
        await db.topicWatch.upsert({
          where,
          create: { ...where.topicId_memberId, watching },
          update: { watching },
        });
      }
      expect(await db.topicWatch.count({ where: where.topicId_memberId })).toBe(
        1,
      );
      expect(
        (await queries.findTopicDetailSnapshot(topicIds[2], 'watch-member'))
          ?.summaryRow.watching,
      ).toBe(true);
    },
  );
});
