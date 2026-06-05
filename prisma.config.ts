import { defineConfig } from 'prisma/config';

const databaseUrl = process.env.FORUMS_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'FORUMS_DATABASE_URL or DATABASE_URL must be configured for Prisma commands.',
  );
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
});
