# Forums Prisma Client

Reusable Prisma client generated from `prisma/schema.prisma` for services that
need direct, typed access to forum data.

The package exports the Forums `Topic`, `Post`, `TopicClosure`, `TopicWatch`,
`TopicReadState`, `MemberBan`, and `IpBan` models. Consumers import this client
from the Forums API package and must supply the Prisma 7 PostgreSQL driver
adapter required by their runtime:

```ts
import { PrismaClient } from '@topcoder/forums-api-v6/packages/forums-prisma-client';
import { PrismaPg } from '@prisma/adapter-pg';

const forumsDbUrl = process.env.FORUMS_DB_URL;
if (!forumsDbUrl) {
  throw new Error('FORUMS_DB_URL is required');
}
const adapter = new PrismaPg(
  { connectionString: forumsDbUrl },
  { schema: 'forums' },
);
const forums = new PrismaClient({ adapter });
```

The caller owns the client lifecycle and must call `$disconnect()` during
shutdown. Regenerate this package with `pnpm prisma:generate` whenever the
Forums Prisma schema changes.
