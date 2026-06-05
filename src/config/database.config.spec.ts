import databaseConfig from './database.config';

const databaseEnvKeys = [
  'FORUMS_DATABASE_URL',
  'DATABASE_URL',
  'CHALLENGE_DB_URL',
  'CHALLENGES_DB_URL',
  'RESOURCE_DB_URL',
  'RESOURCES_DB_URL',
  'IDENTITY_DB_URL',
  'MEMBER_DB_URL',
] as const;

describe('databaseConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };

    for (const key of databaseEnvKeys) {
      delete process.env[key];
    }
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('loads forums and cross-service database URLs from runtime variables', () => {
    process.env.FORUMS_DATABASE_URL = 'postgresql://forums-primary';
    process.env.DATABASE_URL = 'postgresql://forums-fallback';
    process.env.CHALLENGE_DB_URL = 'postgresql://challenge-primary';
    process.env.CHALLENGES_DB_URL = 'postgresql://challenge-alias';
    process.env.RESOURCE_DB_URL = 'postgresql://resource-primary';
    process.env.RESOURCES_DB_URL = 'postgresql://resource-alias';
    process.env.IDENTITY_DB_URL = 'postgresql://identity';
    process.env.MEMBER_DB_URL = 'postgresql://member';

    expect(databaseConfig()).toEqual({
      database: {
        url: 'postgresql://forums-primary',
        challengeUrl: 'postgresql://challenge-primary',
        resourceUrl: 'postgresql://resource-primary',
        identityUrl: 'postgresql://identity',
        memberUrl: 'postgresql://member',
      },
    });
  });

  it('loads supported fallback aliases when primary URLs are absent', () => {
    process.env.DATABASE_URL = 'postgresql://forums-fallback';
    process.env.CHALLENGES_DB_URL = 'postgresql://challenge-alias';
    process.env.RESOURCES_DB_URL = 'postgresql://resource-alias';

    expect(databaseConfig()).toEqual({
      database: {
        url: 'postgresql://forums-fallback',
        challengeUrl: 'postgresql://challenge-alias',
        resourceUrl: 'postgresql://resource-alias',
        identityUrl: undefined,
        memberUrl: undefined,
      },
    });
  });
});
