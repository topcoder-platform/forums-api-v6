import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ChallengeForumWatchService } from './challenge-forum-watch.service';

/**
 * Creates the watch service with isolated storage and authorization dependencies.
 * @returns Service plus mocks for resource defaults, preferences, visibility, and bans.
 * @throws Does not throw.
 */
function setup() {
  const db = {
    challengeForumWatch: {
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn().mockResolvedValue({}),
    },
  };
  const resources = {
    getChallengeDefaultWatcherMemberIds: jest
      .fn()
      .mockResolvedValue(['member']),
  };
  const policy = {
    decideForRestrictionVisibility: jest
      .fn()
      .mockResolvedValue({ allowed: true }),
  };
  const moderation = {
    decideForRequestActorBan: jest.fn().mockResolvedValue({ allowed: true }),
  };
  const service = new ChallengeForumWatchService(
    db as any,
    resources as any,
    policy as any,
    moderation as any,
  );
  return { db, resources, policy, moderation, service };
}
const user = { userId: 'member', isMachine: false, roles: ['Topcoder User'] };

describe('ChallengeForumWatchService', () => {
  it('defaults resource members to watching before any topics or preferences exist', async () => {
    const { service, resources, db } = setup();
    await expect(service.watchState('challenge', user)).resolves.toEqual({
      challengeId: 'challenge',
      memberId: 'member',
      watching: true,
    });
    expect(resources.getChallengeDefaultWatcherMemberIds).toHaveBeenCalledWith(
      'challenge',
      'member',
    );
    expect(db.challengeForumWatch.upsert).not.toHaveBeenCalled();
  });

  it('does not default other challenge viewers to watching', async () => {
    const { service, resources } = setup();
    resources.getChallengeDefaultWatcherMemberIds.mockResolvedValue([]);
    await expect(service.watchState('challenge', user)).resolves.toHaveProperty(
      'watching',
      false,
    );
  });

  it.each([false, true])(
    'persists the explicit %s choice idempotently for the caller',
    async (watching) => {
      const { service, db, resources } = setup();
      await service.watchState('challenge', user, '127.0.0.1', watching);
      expect(db.challengeForumWatch.upsert).toHaveBeenCalledWith({
        where: {
          challengeId_memberId: {
            challengeId: 'challenge',
            memberId: 'member',
          },
        },
        create: { challengeId: 'challenge', memberId: 'member', watching },
        update: { watching },
      });
      db.challengeForumWatch.findUnique.mockResolvedValue({ watching });
      await expect(
        service.watchState('challenge', user),
      ).resolves.toHaveProperty('watching', watching);
      expect(
        resources.getChallengeDefaultWatcherMemberIds,
      ).not.toHaveBeenCalled();
    },
  );

  it('merges registrants, copilots, and explicit watches while preserving opt-outs', async () => {
    const { service, db, resources } = setup();
    resources.getChallengeDefaultWatcherMemberIds.mockResolvedValue([
      'registrant',
      'copilot',
      'opted-out',
      'copilot',
    ]);
    db.challengeForumWatch.findMany.mockResolvedValue([
      { memberId: 'opted-out', watching: false },
      { memberId: 'other-viewer', watching: true },
      { memberId: 'copilot', watching: true },
    ]);
    await expect(service.getWatcherMemberIds('challenge')).resolves.toEqual([
      'registrant',
      'copilot',
      'other-viewer',
    ]);
    expect(db.challengeForumWatch.findMany).toHaveBeenCalledWith({
      where: { challengeId: 'challenge' },
    });
  });

  it.each([undefined, { ...user, isMachine: true }, { ...user, userId: '' }])(
    'rejects callers without a human member identity',
    async (caller) => {
      const { service, db } = setup();
      await expect(
        service.watchState('challenge', caller, undefined, true),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(db.challengeForumWatch.upsert).not.toHaveBeenCalled();
    },
  );

  it('rejects bans and inaccessible challenges before reading or changing preferences', async () => {
    const { service, db, policy, moderation } = setup();
    moderation.decideForRequestActorBan.mockResolvedValue({ allowed: false });
    await expect(
      service.watchState('challenge', user, '127.0.0.1', true),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(policy.decideForRestrictionVisibility).not.toHaveBeenCalled();
    moderation.decideForRequestActorBan.mockResolvedValue({ allowed: true });
    policy.decideForRestrictionVisibility.mockResolvedValue({ allowed: false });
    await expect(service.watchState('challenge', user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(db.challengeForumWatch.findUnique).not.toHaveBeenCalled();
    expect(db.challengeForumWatch.upsert).not.toHaveBeenCalled();
  });
});
