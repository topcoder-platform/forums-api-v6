import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../prisma/generated/client';

const databaseUrl = process.env.FORUMS_DATABASE_URL ?? process.env.DATABASE_URL;
const itWithDatabase = databaseUrl ? it : it.skip;
const runSegment = ((Date.now() % 0xfffe) + 1).toString(16);
const processSegment = ((process.pid % 0xfffe) + 1).toString(16);
const memberBanPrefix = `ban-schema-${process.pid}-${Date.now().toString(36)}`;
const memberId = `${memberBanPrefix}-member`;
const ipBanAddress = `2001:db8:${processSegment}:${runSegment}::1`;
const acceptedIpv4Address = `192.0.2.${(process.pid % 200) + 1}`;
const acceptedIpv6Address = `2001:db8:${processSegment}:${runSegment}::2`;
const invalidIpAddresses = ['192.0.2.1/24', '192.0.2.*', 'not-an-ip'];
const cleanupIpAddresses = [
  ipBanAddress,
  acceptedIpv4Address,
  acceptedIpv6Address,
  ...invalidIpAddresses,
];

/**
 * Resolves the PostgreSQL schema used by the Prisma driver adapter.
 *
 * @param connectionString Configured forums database URL.
 * @returns The URL `schema` parameter when supplied, otherwise `forums`.
 * @throws Does not throw; malformed URLs fall back to the dedicated schema.
 */
function resolveSchema(connectionString: string): string {
  try {
    return new URL(connectionString).searchParams.get('schema') ?? 'forums';
  } catch {
    return 'forums';
  }
}

/**
 * Removes moderation rows created by this schema integration spec.
 *
 * @param client Generated Prisma client connected to the forums database.
 * @returns A promise that resolves after test rows are removed.
 * @throws Prisma errors when cleanup queries fail.
 */
async function cleanupModerationRows(client: PrismaClient): Promise<void> {
  await client.memberBan.deleteMany({
    where: {
      memberId: {
        startsWith: memberBanPrefix,
      },
    },
  });
  await client.ipBan.deleteMany({
    where: {
      ipAddress: {
        in: cleanupIpAddresses,
      },
    },
  });
}

describe('forums moderation schema persistence', () => {
  let client: PrismaClient | undefined;

  beforeAll(async () => {
    if (!databaseUrl) {
      return;
    }

    const adapter = new PrismaPg(
      { connectionString: databaseUrl },
      { schema: resolveSchema(databaseUrl) },
    );
    client = new PrismaClient({ adapter });
    await client.$connect();
  });

  beforeEach(async () => {
    if (client) {
      await cleanupModerationRows(client);
    }
  });

  afterEach(async () => {
    if (client) {
      await cleanupModerationRows(client);
    }
  });

  afterAll(async () => {
    if (!client) {
      return;
    }

    await cleanupModerationRows(client);
    await client.$disconnect();
  });

  itWithDatabase(
    'rejects a second active member ban and allows a new active ban after removal',
    async () => {
      const db = client as PrismaClient;
      const firstBan = await db.memberBan.create({
        data: {
          memberId,
          createdByMemberId: 'moderator-1',
        },
      });

      await expect(
        db.memberBan.create({
          data: {
            memberId,
            createdByMemberId: 'moderator-2',
          },
        }),
      ).rejects.toBeDefined();

      await db.memberBan.update({
        where: {
          id: firstBan.id,
        },
        data: {
          removedAt: new Date('2026-07-07T00:00:00.000Z'),
          removedByMemberId: 'moderator-1',
        },
      });

      await expect(
        db.memberBan.create({
          data: {
            memberId,
            createdByMemberId: 'moderator-2',
          },
        }),
      ).resolves.toMatchObject({
        memberId,
        removedAt: null,
      });
    },
  );

  itWithDatabase(
    'rejects a second active IP ban and allows a new active ban after removal',
    async () => {
      const db = client as PrismaClient;
      const firstBan = await db.ipBan.create({
        data: {
          ipAddress: ipBanAddress,
          createdByMemberId: 'moderator-1',
        },
      });

      await expect(
        db.ipBan.create({
          data: {
            ipAddress: ipBanAddress,
            createdByMemberId: 'moderator-2',
          },
        }),
      ).rejects.toBeDefined();

      await db.ipBan.update({
        where: {
          id: firstBan.id,
        },
        data: {
          removedAt: new Date('2026-07-07T00:00:00.000Z'),
          removedByMemberId: 'moderator-1',
        },
      });

      await expect(
        db.ipBan.create({
          data: {
            ipAddress: ipBanAddress,
            createdByMemberId: 'moderator-2',
          },
        }),
      ).resolves.toMatchObject({
        ipAddress: ipBanAddress,
        removedAt: null,
      });
    },
  );

  itWithDatabase(
    'accepts exact IPv4 and IPv6 host IP bans and rejects CIDR, wildcard, and invalid values',
    async () => {
      const db = client as PrismaClient;

      await expect(
        db.ipBan.create({
          data: {
            ipAddress: acceptedIpv4Address,
            createdByMemberId: 'moderator-1',
          },
        }),
      ).resolves.toMatchObject({
        ipAddress: acceptedIpv4Address,
      });

      await expect(
        db.ipBan.create({
          data: {
            ipAddress: acceptedIpv6Address,
            createdByMemberId: 'moderator-1',
          },
        }),
      ).resolves.toMatchObject({
        ipAddress: acceptedIpv6Address,
      });

      for (const ipAddress of invalidIpAddresses) {
        await expect(
          db.ipBan.create({
            data: {
              ipAddress,
              createdByMemberId: 'moderator-1',
            },
          }),
        ).rejects.toBeDefined();
      }
    },
  );
});
