import { VanillaSourceReaderService } from './vanilla-source-reader.service';

/**
 * Collects all values from an async generator.
 *
 * @param generator Async generator to drain.
 * @returns Array of yielded values.
 * @throws Propagates generator errors.
 */
async function collect<T>(generator: AsyncGenerator<T>): Promise<T[]> {
  const values: T[] = [];

  for await (const value of generator) {
    values.push(value);
  }

  return values;
}

describe('VanillaSourceReaderService', () => {
  it('reads discussions in batches and normalizes projected source fields', async () => {
    const mysqlService = {
      query: jest
        .fn()
        .mockResolvedValueOnce([
          {
            discussionId: 1,
            challengeId: ' challenge-1 ',
            title: ' Title ',
            body: 'Body with /uploads/file.png',
            isAnnouncement: 1,
            locked: 1,
            createdAt: '2020-01-01T00:00:00.000Z',
            updatedAt: '2020-01-02T00:00:00.000Z',
            legacyUserId: 10,
            handle: ' legacy ',
            email: ' legacy@example.com ',
          },
        ])
        .mockResolvedValueOnce([]),
    };
    const service = new VanillaSourceReaderService(mysqlService as any);

    await expect(collect(service.readDiscussions(1))).resolves.toEqual([
      {
        discussionId: '1',
        challengeId: 'challenge-1',
        title: 'Title',
        body: 'Body with /uploads/file.png',
        isAnnouncement: true,
        locked: true,
        createdAt: new Date('2020-01-01T00:00:00.000Z'),
        updatedAt: new Date('2020-01-02T00:00:00.000Z'),
        actor: {
          legacyUserId: '10',
          handle: 'legacy',
          email: 'legacy@example.com',
        },
      },
    ]);
    expect(mysqlService.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('FROM GDN_Discussion'),
      ['0', 1],
    );
    expect(mysqlService.query.mock.calls[0][0]).toEqual(
      expect.stringContaining('LEFT JOIN GDN_Category c'),
    );
    expect(mysqlService.query.mock.calls[0][0]).toEqual(
      expect.stringContaining('LEFT JOIN GDN_Category pc'),
    );
    expect(mysqlService.query.mock.calls[0][0]).toEqual(
      expect.stringContaining('LEFT JOIN GDN_Group g'),
    );
    expect(mysqlService.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('FROM GDN_Discussion'),
      ['1', 1],
    );
  });

  it('projects challenge ids from legacy category and group linkage while preserving general discussions', async () => {
    const mysqlService = {
      query: jest
        .fn()
        .mockResolvedValueOnce([
          {
            discussionId: 1,
            challengeId: ' 0f4d5111-4a48-4ddf-90f1-d58b94e0bf1d ',
            title: 'Challenge thread',
            body: null,
            isAnnouncement: 0,
            locked: 0,
            createdAt: '2020-01-01T00:00:00.000Z',
            updatedAt: '2020-01-01T00:00:00.000Z',
            legacyUserId: 10,
            handle: 'challenge-user',
            email: 'challenge@example.com',
          },
          {
            discussionId: 2,
            challengeId: null,
            title: 'General thread',
            body: null,
            isAnnouncement: 0,
            locked: 0,
            createdAt: '2020-01-02T00:00:00.000Z',
            updatedAt: '2020-01-02T00:00:00.000Z',
            legacyUserId: 11,
            handle: 'general-user',
            email: 'general@example.com',
          },
        ])
        .mockResolvedValueOnce([]),
    };
    const service = new VanillaSourceReaderService(mysqlService as any);

    await expect(collect(service.readDiscussions(2))).resolves.toEqual([
      expect.objectContaining({
        discussionId: '1',
        challengeId: '0f4d5111-4a48-4ddf-90f1-d58b94e0bf1d',
      }),
      expect.objectContaining({
        discussionId: '2',
        challengeId: null,
      }),
    ]);

    const sql = mysqlService.query.mock.calls[0][0];
    expect(sql).toEqual(expect.stringContaining('g.ChallengeID'));
    expect(sql).toEqual(expect.stringContaining('c.UrlCode'));
    expect(sql).toEqual(expect.stringContaining('pc.UrlCode'));
    expect(sql).toEqual(expect.stringContaining('REGEXP'));
  });

  it('reads replies for one discussion without reparenting source parents', async () => {
    const mysqlService = {
      query: jest.fn().mockResolvedValue([
        {
          replyId: 20,
          discussionId: 1,
          parentReplyId: 19,
          body: 'Nested reply',
          createdAt: '2020-01-03T00:00:00.000Z',
          updatedAt: '2020-01-04T00:00:00.000Z',
          legacyUserId: 11,
          handle: 'replyUser',
          email: 'reply@example.com',
        },
      ]),
    };
    const service = new VanillaSourceReaderService(mysqlService as any);

    await expect(service.readRepliesForDiscussion('1')).resolves.toEqual([
      {
        replyId: '20',
        discussionId: '1',
        parentReplyId: '19',
        body: 'Nested reply',
        createdAt: new Date('2020-01-03T00:00:00.000Z'),
        updatedAt: new Date('2020-01-04T00:00:00.000Z'),
        actor: {
          legacyUserId: '11',
          handle: 'replyUser',
          email: 'reply@example.com',
        },
      },
    ]);
  });

  it('uses source state user ids for watch and read-state pagination', async () => {
    const mysqlService = {
      query: jest
        .fn()
        .mockResolvedValueOnce([
          {
            discussionId: 1,
            createdAt: '2020-01-05T00:00:00.000Z',
            legacyUserId: 20,
            handle: null,
            email: null,
          },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            discussionId: 2,
            readAt: '2020-01-06T00:00:00.000Z',
            legacyUserId: 21,
            handle: null,
            email: null,
          },
        ])
        .mockResolvedValueOnce([]),
    };
    const service = new VanillaSourceReaderService(mysqlService as any);

    await expect(collect(service.readWatches(1))).resolves.toEqual([
      {
        discussionId: '1',
        createdAt: new Date('2020-01-05T00:00:00.000Z'),
        actor: {
          legacyUserId: '20',
          handle: null,
          email: null,
        },
      },
    ]);
    await expect(collect(service.readReadStates(1))).resolves.toEqual([
      {
        discussionId: '2',
        readAt: new Date('2020-01-06T00:00:00.000Z'),
        actor: {
          legacyUserId: '21',
          handle: null,
          email: null,
        },
      },
    ]);

    expect(mysqlService.query.mock.calls[0][0]).toEqual(
      expect.stringContaining('ud.UserID AS legacyUserId'),
    );
    expect(mysqlService.query.mock.calls[0][0]).toEqual(
      expect.stringContaining(
        'COALESCE(ud.DateLastViewed, NOW()) AS createdAt',
      ),
    );
    expect(mysqlService.query.mock.calls[0][0]).not.toEqual(
      expect.stringContaining('ud.DateInserted'),
    );
    expect(mysqlService.query.mock.calls[1][1]).toEqual(['1', '1', '20', 1]);
    expect(mysqlService.query.mock.calls[2][0]).toEqual(
      expect.stringContaining('ud.UserID AS legacyUserId'),
    );
    expect(mysqlService.query.mock.calls[3][1]).toEqual(['2', '2', '21', 1]);
  });

  it('reads IP ban rows without requiring a Vanilla active flag column', async () => {
    const mysqlService = {
      query: jest
        .fn()
        .mockResolvedValueOnce([
          {
            banId: 30,
            ipAddress: '192.0.2.10',
            createdAt: '2020-01-07T00:00:00.000Z',
          },
        ])
        .mockResolvedValueOnce([]),
    };
    const service = new VanillaSourceReaderService(mysqlService as any);

    await expect(collect(service.readIpBans(1))).resolves.toEqual([
      {
        banId: '30',
        ipAddress: '192.0.2.10',
        createdAt: new Date('2020-01-07T00:00:00.000Z'),
      },
    ]);

    expect(mysqlService.query.mock.calls[0][0]).toEqual(
      expect.stringContaining('FROM GDN_Ban b'),
    );
    expect(mysqlService.query.mock.calls[0][0]).not.toEqual(
      expect.stringContaining('b.Active'),
    );
    expect(mysqlService.query.mock.calls[1][1]).toEqual(['30', 1]);
  });
});
