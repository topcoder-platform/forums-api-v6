import { defineConfig } from 'prisma/config';

const databaseUrl = process.env.FORUMS_DATABASE_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
});
