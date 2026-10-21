import { ResourceAccessService } from './resource-access.service';

describe('ResourceAccessService default forum watchers', () => {
  it('selects submitters and copilot roles only within the requested challenge', async () => {
    const service = new ResourceAccessService({ get: jest.fn() } as any);
    const findMany = jest
      .fn()
      .mockResolvedValue([
        { memberId: 'registrant' },
        { memberId: 'copilot' },
        { memberId: 'copilot' },
      ]);
    (service as any).initialized = true;
    (service as any).client = { resource: { findMany } };
    await expect(
      service.getChallengeDefaultWatcherMemberIds('challenge'),
    ).resolves.toEqual(['registrant', 'copilot']);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        challengeId: 'challenge',
        resourceRole: {
          OR: [
            { nameLower: 'submitter' },
            { nameLower: { contains: 'copilot' } },
          ],
        },
      },
      select: { memberId: true },
    });
    await service.getChallengeDefaultWatcherMemberIds('challenge', 'member');
    expect(findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ memberId: 'member' }),
      }),
    );
  });

  it('returns no defaults when the resource database is not configured', async () => {
    const service = new ResourceAccessService({ get: jest.fn() } as any);
    await expect(
      service.getChallengeDefaultWatcherMemberIds('challenge'),
    ).resolves.toEqual([]);
  });
});
