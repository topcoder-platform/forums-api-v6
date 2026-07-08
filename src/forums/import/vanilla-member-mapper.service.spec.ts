import { ConfigService } from '@nestjs/config';
import { VanillaMemberMapperService } from './vanilla-member-mapper.service';

const mockMemberFindUnique = jest.fn();
const mockDisconnect = jest.fn();
const mockQueryRaw = jest.fn();

/**
 * Creates the member mapper with a configured Members database URL.
 *
 * @returns Mapper under test.
 * @throws Does not throw.
 */
function createMapper(): VanillaMemberMapperService {
  const mapper = new VanillaMemberMapperService({
    get: jest.fn().mockReturnValue('postgresql://members'),
  } as unknown as ConfigService);

  Object.assign(mapper as any, {
    client: {
      member: {
        findUnique: mockMemberFindUnique,
      },
      $disconnect: mockDisconnect,
      $queryRaw: mockQueryRaw,
    },
  });

  return mapper;
}

describe('VanillaMemberMapperService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves by handle first and caches by legacy user id', async () => {
    mockMemberFindUnique.mockResolvedValue({
      userId: 123n,
      handle: 'CurrentHandle',
    });
    const mapper = createMapper();

    const first = await mapper.mapActor({
      legacyUserId: '10',
      handle: 'LegacyHandle',
      email: 'legacy@example.com',
    });
    const second = await mapper.mapActor({
      legacyUserId: '10',
      handle: 'ChangedHandle',
      email: 'changed@example.com',
    });

    expect(first).toEqual({
      status: 'matched',
      legacyUserId: '10',
      memberId: '123',
      handle: 'CurrentHandle',
      matchedBy: 'handle',
    });
    expect(second).toEqual(first);
    expect(mockMemberFindUnique).toHaveBeenCalledTimes(1);
    expect(mockMemberFindUnique).toHaveBeenCalledWith({
      where: { handleLower: 'legacyhandle' },
      select: { userId: true, handle: true },
    });
  });

  it('falls back to unique email only when handle does not match', async () => {
    mockMemberFindUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
      userId: 456n,
      handle: 'EmailHandle',
    });
    const mapper = createMapper();

    await expect(
      mapper.mapActor({
        legacyUserId: '11',
        handle: 'MissingHandle',
        email: 'USER@EXAMPLE.COM',
      }),
    ).resolves.toEqual({
      status: 'matched',
      legacyUserId: '11',
      memberId: '456',
      handle: 'EmailHandle',
      matchedBy: 'email',
    });
    expect(mockMemberFindUnique).toHaveBeenNthCalledWith(2, {
      where: { email: 'user@example.com' },
      select: { userId: true, handle: true },
    });
  });

  it('returns unmatched when neither handle nor email resolves', async () => {
    mockMemberFindUnique.mockResolvedValue(null);
    const mapper = createMapper();

    await expect(
      mapper.mapActor({
        legacyUserId: '12',
        handle: 'MissingHandle',
        email: 'missing@example.com',
      }),
    ).resolves.toEqual({
      status: 'unmatched',
      legacyUserId: '12',
      reason: 'member_not_found',
    });
  });
});
