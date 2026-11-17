import { ConfigService } from '@nestjs/config';
import { ChallengeAccessService } from './challenge-access.service';
import { createChallengePrismaClient } from '../../../challenge-api-v6/packages/challenge-prisma-client';

jest.mock('../../../challenge-api-v6/packages/challenge-prisma-client', () => ({
  createChallengePrismaClient: jest.fn(),
}));

describe('completed Marathon forum archive access', () => {
  const approved = '0b11e0fd-3e2d-46dc-8f7b-27c9f49d63cb';
  function fixture(id = approved, status = 'COMPLETED') {
    const client = {
      challenge: { findUnique: jest.fn().mockResolvedValue({ id, status }) },
      memberChallengeAccess: { findFirst: jest.fn().mockResolvedValue(null) },
      challengeUserWhitelist: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    (createChallengePrismaClient as jest.Mock).mockReturnValue(client);
    return {
      client,
      service: new ChallengeAccessService({
        get: () => 'configured',
      } as unknown as ConfigService),
    };
  }
  it('admits an unregistered member without granting whitelist membership', async () => {
    const { service, client } = fixture();
    expect(
      await service.getChallengeAccessFacts(approved, 'new-member'),
    ).toEqual({
      configured: true,
      challengeExists: true,
      memberHasChallengeAccess: true,
      memberIsWhitelisted: false,
    });
    expect(client.memberChallengeAccess.findFirst).not.toHaveBeenCalled();
  });
  it('does not grant archive access to guests', async () => {
    expect(
      (await fixture().service.getChallengeAccessFacts(approved, null))
        .memberHasChallengeAccess,
    ).toBe(false);
  });
  it.each(['ACTIVE', 'DRAFT', 'DELETED'])(
    'does not open a %s challenge',
    async (status) => {
      expect(
        (
          await fixture(approved, status).service.getChallengeAccessFacts(
            approved,
            'viewer',
          )
        ).memberHasChallengeAccess,
      ).toBe(false);
    },
  );
  it.each([
    'eab5c386-3f0e-46c2-a4a8-475b72104f89',
    '0f483320-428b-4891-83e8-9caa80c7d931',
    'unapproved-challenge',
  ])('preserves restrictions for excluded or unapproved %s', async (id) => {
    expect(
      (await fixture(id).service.getChallengeAccessFacts(id, 'viewer'))
        .memberHasChallengeAccess,
    ).toBe(false);
  });
});
