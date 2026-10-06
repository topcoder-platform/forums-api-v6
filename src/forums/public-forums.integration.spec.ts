import {
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Client } from 'pg';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { JwtService } from '../auth/jwt.service';
import { DbService } from '../db/db.service';
import { EventBusService } from './event-bus.service';
import { ForumsWatchNotificationService } from './forums-watch-notification.service';
import {
  challengeFingerprint,
  planPublicImport,
  PublicImportSnapshot,
  writePublicImport,
} from './import/public-vanilla-import';

const url = process.env.PUBLIC_FORUMS_TEST_DATABASE_URL;
const integration = url ? describe : describe.skip;
/** Local-only HTTP and migration regression suite. It owns the entire *_http_test database.
 * Runs against real Prisma/SQL, middleware, guards, controllers and policies; JWT validation and email delivery are isolated.
 */
integration('public forums PostgreSQL/HTTP access boundaries', () => {
  let app: INestApplication;
  let db: DbService;
  let sql: Client;
  let createdId: string;
  beforeAll(async () => {
    const parsed = new URL(url!);
    if (
      !['127.0.0.1', 'localhost'].includes(parsed.hostname) ||
      !parsed.pathname.endsWith('_http_test')
    ) {
      throw new Error(
        'Integration tests require a dedicated local *_http_test database',
      );
    }
    sql = new Client({ connectionString: url });
    await sql.connect();
    await sql.query(
      'TRUNCATE forums."Topic", forums."PublicForumCategory", forums."PublicForumRoleMember", forums."PublicForumImportRecord" CASCADE',
    );
    parsed.searchParams.set('options', '-c search_path=forums,public');
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ConfigService)
      .useValue(
        new ConfigService({
          database: { url: parsed.href },
          auth: {},
          notifications: {},
        }),
      )
      .overrideProvider(JwtService)
      .useValue({
        validateToken: async (token: string) => {
          if (token === 'invalid')
            throw new UnauthorizedException('Invalid token');
          return {
            userId: token === 'local' ? '202' : '101',
            handle: 'test-member',
            roles:
              token === 'copilot'
                ? ['copilot']
                : token === 'reviewer'
                  ? ['reviewer']
                  : token === 'admin'
                    ? ['administrator']
                    : [],
            isMachine: token === 'machine',
            scopes: [],
          };
        },
      })
      .overrideProvider(EventBusService)
      .useValue({})
      .overrideProvider(ForumsWatchNotificationService)
      .useValue({
        publishPostNotification: jest
          .fn()
          .mockResolvedValue({ published: false }),
      })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    db = app.get(DbService);
    for (const [id, parent, role, local] of [
      ['pfpublic', null, '$public', false],
      ['pfcopilot', null, 'copilot', false],
      ['pfreviewer', null, 'reviewer', false],
      ['pfprivate', null, '$authenticated', false],
      ['pflocal', 'pfprivate', 'vanilla-role:69', true],
    ] as const) {
      await db.topic.create({
        data: {
          id,
          parentTopicId: parent,
          title: id,
          authorMemberId: '101',
          authorHandle: 'test-member',
        },
      });
      await db.topicClosure.create({
        data: { ancestorTopicId: id, descendantTopicId: id, depth: 0 },
      });
      if (parent)
        await db.topicClosure.create({
          data: { ancestorTopicId: parent, descendantTopicId: id, depth: 1 },
        });
      await db.publicForumCategory.create({
        data: {
          topicId: id,
          legacyId: [
            'pfpublic',
            'pfcopilot',
            'pfreviewer',
            'pfprivate',
            'pflocal',
          ].indexOf(id),
          legacySlug: id,
          source: {},
          description: '',
          displayAs: 'Discussions',
          sortOrder: 0,
          readRoles: [role],
          createRoles: [role === '$public' ? '$authenticated' : role],
          replyRoles: [role === '$public' ? '$authenticated' : role],
        },
      });
      const tid = `${id}t`;
      await db.topic.create({
        data: {
          id: tid,
          parentTopicId: id,
          title: `${id} secret-search`,
          authorMemberId: '101',
          authorHandle: 'test-member',
        },
      });
      await db.topicClosure.createMany({
        data: [
          { ancestorTopicId: tid, descendantTopicId: tid, depth: 0 },
          { ancestorTopicId: id, descendantTopicId: tid, depth: 1 },
          ...(parent
            ? [{ ancestorTopicId: parent, descendantTopicId: tid, depth: 2 }]
            : []),
        ],
      });
      await db.post.create({
        data: {
          id: `${id}p`,
          topicId: tid,
          parentType: 'TOPIC',
          parentId: tid,
          authorMemberId: '101',
          authorHandle: `${id}-author`,
          content: `${id} content secret-search`,
        },
      });
      await db.topicWatch.create({ data: { topicId: tid, memberId: '101' } });
      if (local)
        await db.publicForumRoleMember.create({
          data: { roleName: role, memberId: '202' },
        });
    }
    await db.topic.create({
      data: {
        id: 'pfchallenge',
        title: 'Existing challenge',
        challengeId: 'challenge-id',
        authorMemberId: '101',
        authorHandle: 'test-member',
      },
    });
    await db.topicClosure.create({
      data: {
        ancestorTopicId: 'pfchallenge',
        descendantTopicId: 'pfchallenge',
        depth: 0,
      },
    });
  }, 30000);
  afterAll(async () => {
    await app?.close();
    await sql?.end();
  });

  it('allows anonymous public reads but hides roles, private parents, search results and identities', async () => {
    const categories = await request(app.getHttpServer())
      .get('/public/categories')
      .expect(200);
    expect(
      categories.body.map((category: { id: string }) => category.id),
    ).toEqual(['pfpublic']);
    expect(categories.body[0]).toMatchObject({
      topicsCount: 1,
      postsCount: 1,
      participantsCount: 1,
      canCreate: false,
    });
    const search = await request(app.getHttpServer())
      .get('/public/topics?search=secret-search')
      .expect(200);
    expect(JSON.stringify(search.body)).not.toMatch(
      /copilot|reviewer|private|local/,
    );
    const detail = await request(app.getHttpServer())
      .get('/topics/pfpublict')
      .expect(200);
    expect(detail.body.permissions).toMatchObject({
      createPost: false,
      watch: false,
    });
    for (const id of [
      'pfcopilott',
      'pfreviewert',
      'pflocalt',
      'pfprivatet',
      'pfchallenge',
    ]) {
      await request(app.getHttpServer()).get(`/topics/${id}`).expect(403);
    }
    await request(app.getHttpServer())
      .get('/topics/pfprivate/children')
      .expect(403);
    await request(app.getHttpServer())
      .get('/public/topics?categoryId=pfprivate')
      .expect(403);
  });
  it('enforces roles and local memberships without granting identity privileges', async () => {
    await request(app.getHttpServer())
      .get('/topics/pfcopilott')
      .set('Authorization', 'Bearer copilot')
      .expect(200);
    await request(app.getHttpServer())
      .get('/topics/pfreviewert')
      .set('Authorization', 'Bearer reviewer')
      .expect(200);
    await request(app.getHttpServer())
      .get('/topics/pfreviewert')
      .set('Authorization', 'Bearer copilot')
      .expect(403);
    await request(app.getHttpServer())
      .get('/topics/pflocalt')
      .set('Authorization', 'Bearer local')
      .expect(200);
    await request(app.getHttpServer())
      .get('/topics/pflocalt')
      .set('Authorization', 'Bearer member')
      .expect(403);
    const watches = await request(app.getHttpServer())
      .get('/public/topics?watching=true')
      .set('Authorization', 'Bearer member')
      .expect(200);
    expect(JSON.stringify(watches.body)).not.toMatch(/copilot|reviewer|local/);
    await request(app.getHttpServer())
      .post('/topics')
      .set('Authorization', 'Bearer local')
      .send({ title: 'Root', content: 'No escalation' })
      .expect(403);
  });
  it('requires authentication for mutations and rejects invalid/scopeless credentials', async () => {
    await request(app.getHttpServer())
      .post('/topics/pfpublict/posts')
      .send({ content: 'Guest' })
      .expect(401);
    await request(app.getHttpServer())
      .put('/topics/pfpublict/watch')
      .send({})
      .expect(401);
    await request(app.getHttpServer())
      .put('/posts/pfpublicp/reaction')
      .send({ reaction: 'THUMBS_UP' })
      .expect(401);
    await request(app.getHttpServer())
      .get('/public/categories')
      .set('Authorization', 'Bearer invalid')
      .expect(401);
    await request(app.getHttpServer())
      .get('/public/categories')
      .set('Authorization', 'Bearer machine')
      .expect(403);
  });
  it('supports member creation, replies, reactions, watch and read state while rejecting forbidden categories', async () => {
    const created = await request(app.getHttpServer())
      .post('/topics')
      .set('Authorization', 'Bearer member')
      .send({
        parentTopicId: 'pfpublic',
        title: 'New member thread',
        content: '**Markdown** @test-member',
      })
      .expect(201);
    createdId = created.body.topic.id;
    await request(app.getHttpServer())
      .post(`/topics/${createdId}/posts`)
      .set('Authorization', 'Bearer member')
      .send({ content: 'needle-in-reply' })
      .expect(201);
    const matches = await request(app.getHttpServer())
      .get('/public/topics?search=needle-in-reply')
      .expect(200);
    expect(
      matches.body.data.map((topic: { id: string }) => topic.id),
    ).toContain(createdId);
    await request(app.getHttpServer())
      .put(`/topics/${createdId}/watch`)
      .set('Authorization', 'Bearer member')
      .send({})
      .expect(200);
    await request(app.getHttpServer())
      .put(`/topics/${createdId}/read-state`)
      .set('Authorization', 'Bearer member')
      .send({})
      .expect(200);
    await request(app.getHttpServer())
      .put('/posts/pfpublicp/reaction')
      .set('Authorization', 'Bearer member')
      .send({ reaction: 'THUMBS_UP' })
      .expect(200);
    await request(app.getHttpServer())
      .post('/topics')
      .set('Authorization', 'Bearer member')
      .send({ parentTopicId: 'pfcopilot', title: 'Denied', content: 'Denied' })
      .expect(403);
    await request(app.getHttpServer())
      .post('/topics/pfcopilott/posts')
      .set('Authorization', 'Bearer member')
      .send({ content: 'Denied' })
      .expect(403);
  });
  it('imports atomically, preserves challenge rows, reruns safely, and refuses changed targets/source', async () => {
    const date = new Date('2026-01-01T00:00:00Z');
    const source: PublicImportSnapshot = {
      categories: [
        {
          CategoryID: 99001,
          ParentCategoryID: -1,
          Name: 'Import test',
          UrlCode: 'import-test',
          DisplayAs: 'Discussions',
          Sort: 1,
          PermissionCategoryID: 99001,
          InsertUserID: 1,
          DateInserted: date,
          DateUpdated: date,
        },
      ],
      roles: [{ RoleID: 2, Name: 'Guest', Type: 'guest' }],
      permissions: [
        { JunctionID: 99001, RoleID: 2, 'Vanilla.Discussions.View': 1 },
      ],
      discussions: [
        {
          DiscussionID: 99001,
          CategoryID: 99001,
          Name: 'Import thread',
          Body: '**original**',
          Format: 'Markdown',
          InsertUserID: 1,
          DateInserted: date,
          DateUpdated: date,
        },
      ],
      comments: [],
      users: [{ UserID: 1, Name: 'unknown' }],
      memberships: [],
      watches: [],
      categoryWatches: [],
      media: [],
    };
    const plan = planPublicImport(source, new Map());
    const before = await challengeFingerprint(sql);
    expect((await writePublicImport(sql, plan.entries, false)).inserted).toBe(
      0,
    );
    expect((await writePublicImport(sql, plan.entries, true)).inserted).toBe(
      plan.entries.length,
    );
    expect((await writePublicImport(sql, plan.entries, true)).inserted).toBe(0);
    expect(await challengeFingerprint(sql)).toEqual(before);
    const changed = plan.entries.map((entry) => ({
      ...entry,
      row: { ...entry.row },
    }));
    changed.find((entry) => entry.type === 'starter')!.row.content =
      'Source changed';
    await expect(writePublicImport(sql, changed, true)).rejects.toThrow(
      'Provenance conflict',
    );
    const postId = plan.entries.find((entry) => entry.type === 'starter')!.row
      .id;
    await db.post.update({
      where: { id: postId },
      data: { content: 'A real user edit' },
    });
    await expect(writePublicImport(sql, plan.entries, true)).rejects.toThrow(
      'Provenance conflict',
    );
    expect((await db.post.findUnique({ where: { id: postId } }))?.content).toBe(
      'A real user edit',
    );
    expect(await challengeFingerprint(sql)).toEqual(before);
  });
});
