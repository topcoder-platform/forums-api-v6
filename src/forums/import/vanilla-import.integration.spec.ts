import { VanillaImportWriterService } from './vanilla-import-writer.service';
import {
  VanillaDiscussionRow,
  VanillaMatchedMember,
  VanillaReadStateRow,
} from './vanilla-import.types';

describe('VanillaImportWriterService integration behavior', () => {
  it('preserves topic/post historical fields without seeding watches or notifications', async () => {
    const createdAt = new Date('2019-01-01T00:00:00.000Z');
    const updatedAt = new Date('2019-01-02T00:00:00.000Z');
    const tx = {
      topic: {
        create: jest.fn().mockResolvedValue({ id: 'topic-1' }),
      },
      post: {
        create: jest.fn().mockResolvedValue({ id: 'starter-post-1' }),
      },
      topicClosure: {
        create: jest.fn().mockResolvedValue({}),
      },
    };
    const db = {
      $transaction: jest.fn((callback) => callback(tx)),
      topicWatch: {
        create: jest.fn(),
      },
      topicReadState: {
        create: jest.fn(),
      },
    };
    const writer = new VanillaImportWriterService(db as any);
    const discussion: VanillaDiscussionRow = {
      discussionId: 'legacy-1',
      challengeId: 'challenge-1',
      title: 'Historical topic',
      body: 'Keep embedded https://example.com/uploads/file.zip',
      isAnnouncement: true,
      locked: true,
      createdAt,
      updatedAt,
      actor: {
        legacyUserId: '10',
        handle: 'legacy',
        email: 'legacy@example.com',
      },
    };
    const author: VanillaMatchedMember = {
      status: 'matched',
      legacyUserId: '10',
      memberId: '1000',
      handle: 'CurrentHandle',
      matchedBy: 'handle',
    };

    await expect(writer.importDiscussion(discussion, author)).resolves.toEqual({
      topicId: 'topic-1',
      starterPostId: 'starter-post-1',
    });
    expect(tx.topic.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        parentTopicId: null,
        challengeId: 'challenge-1',
        roleName: null,
        title: 'Historical topic',
        isAnnouncement: true,
        locked: true,
        lockedAt: null,
        lockedByMemberId: null,
        authorMemberId: '1000',
        authorHandle: 'CurrentHandle',
        createdAt,
        updatedAt,
      }),
    });
    expect(tx.post.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        topicId: 'topic-1',
        parentType: 'TOPIC',
        parentId: 'topic-1',
        content: 'Keep embedded https://example.com/uploads/file.zip',
        createdAt,
        updatedAt,
      }),
    });
    expect(tx.topicClosure.create).toHaveBeenCalledWith({
      data: {
        ancestorTopicId: 'topic-1',
        descendantTopicId: 'topic-1',
        depth: 0,
      },
    });
    expect(db.topicWatch.create).not.toHaveBeenCalled();
    expect(db.topicReadState.create).not.toHaveBeenCalled();
  });

  it('preserves historical read-state timestamps on direct writes', async () => {
    const readAt = new Date('2019-02-01T00:00:00.000Z');
    const db = {
      topicReadState: {
        create: jest.fn().mockResolvedValue({}),
      },
    };
    const writer = new VanillaImportWriterService(db as any);
    const readState: VanillaReadStateRow = {
      discussionId: 'legacy-1',
      readAt,
      actor: {
        legacyUserId: '10',
        handle: 'legacy',
        email: 'legacy@example.com',
      },
    };
    const member: VanillaMatchedMember = {
      status: 'matched',
      legacyUserId: '10',
      memberId: '1000',
      handle: 'CurrentHandle',
      matchedBy: 'handle',
    };

    await writer.importReadState(readState, 'topic-1', member);

    expect(db.topicReadState.create).toHaveBeenCalledWith({
      data: {
        topicId: 'topic-1',
        memberId: '1000',
        lastReadAt: readAt,
        updatedAt: readAt,
      },
    });
  });

  it('normalizes exact IP hosts and rejects unsupported non-exact rules', async () => {
    const db = {
      $queryRaw: jest.fn().mockResolvedValue([{ ipAddress: '2001:db8::1' }]),
    };
    const writer = new VanillaImportWriterService(db as any);

    await expect(
      writer.normalizeBareIpAddress('2001:0db8:0000:0000::1'),
    ).resolves.toBe('2001:db8::1');
    await expect(writer.normalizeBareIpAddress('192.0.2.0/24')).rejects.toThrow(
      'unsupported_non_exact_ip_rule',
    );
    await expect(
      writer.normalizeBareIpAddress('[2001:db8::1]'),
    ).rejects.toThrow('unsupported_non_exact_ip_rule');
  });
});
