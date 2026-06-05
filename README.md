# Topcoder Forums API v6

NestJS service for the Topcoder Forums API topic reads, command-side workflows,
and post-commit watch notifications.

## Routes

- `GET /v6/forums/health`
- `GET /v6/forums/readiness`
- `GET /v6/forums/api-docs`
- `GET /v6/forums/topics`
- `GET /v6/forums/topics/challenges/:challengeId`
- `GET /v6/forums/topics/:topicId/children`
- `GET /v6/forums/topics/:topicId`
- `POST /v6/forums/topics`
- `PATCH /v6/forums/topics/:topicId`
- `DELETE /v6/forums/topics/:topicId`
- `POST /v6/forums/topics/:topicId/posts`
- `PUT /v6/forums/topics/:topicId/watch`
- `DELETE /v6/forums/topics/:topicId/watch`
- `PUT /v6/forums/topics/:topicId/read-state`
- `PATCH /v6/forums/posts/:postId`
- `DELETE /v6/forums/posts/:postId`

This service includes the forums schema, Prisma client export, topic read workflows, transactional command-side workflows, centralized forums authorization for topics, posts, watches, and explicit read-state updates, plus best-effort watch notification publishing for new posts and successful allowed child-topic starter posts. The policy resolves inherited topic restrictions, challenge access, resource-role/copilot elevation, role matching, ownership, scoped M2M write access, and M2M on-behalf target-member visibility before writes, reads, or notification delivery.

Topic reads are exposed under `read:forums-topics`. `GET /v6/forums/topics` returns visible non-challenge root topics; `GET /v6/forums/topics/challenges/:challengeId` checks base challenge visibility before returning visible challenge roots; `GET /v6/forums/topics/:topicId/children` requires parent visibility before filtering direct children; and `GET /v6/forums/topics/:topicId` returns topic detail with an embedded post tree. Detail embeds posts under `read:forums-topics`, keeps deleted post placeholders with null content, counts only non-deleted posts, and derives unread state from `TopicReadState.lastReadAt`. `read:forums-posts` remains reserved for future post-specific read APIs in v1.

Top-level non-challenge topics may be created by human admins and scoped M2M callers. Top-level challenge topics may be created by eligible challenge members, challenge copilots, and admins; M2M callers cannot create challenge roots. Regular authenticated members may create child topics only under parents they can see and only when the resolved effective child context remains non-challenge; requests that inherit or introduce a non-null `challengeId` under a parent are rejected before writes. Allowed child topics must keep monotonic role restrictions: inherited roles cannot be cleared or replaced. Challenge-scoped visibility is verified through the configured challenge and resource adapters, including challenge-resource membership and challenge-copilot elevation. Challenge copilots may access or moderate challenge-scoped forums only when any effective `roleName` forum restriction is also satisfied; admin and scoped M2M bypass behavior is unchanged.

## Notifications

Successful `POST /v6/forums/topics/:topicId/posts` commands publish a
best-effort watch notification after the post transaction commits. Successful
allowed child-topic `POST /v6/forums/topics` commands publish the same
notification for the created starter post. Top-level topic creation, updates,
deletes, watch mutations, and mark-read commands do not publish notifications.

Recipient resolution expands watches from the created content topic through all
ancestor topics using `TopicClosure`, dedupes by member id, excludes the
persisted author member id, loads recipient email and handle data from the
Members database, and filters each candidate through the shared forums access
policy using the effective challenge, role, and conflict state for the created
content. The publisher emits one `external.action.email` event with the final
deduped email list and `SENDGRID_NOTIFICATION_TEMPLATE`. Missing template or
missing recipient email skips notification delivery and is logged without
rolling back the content write.

## Environment

```bash
FORUMS_DATABASE_URL="postgresql://user:password@localhost:5432/forums"
CHALLENGE_DB_URL="postgresql://user:password@localhost:5432/challenges"
CHALLENGES_DB_URL="postgresql://user:password@localhost:5432/challenges"
RESOURCE_DB_URL="postgresql://user:password@localhost:5432/resources"
RESOURCES_DB_URL="postgresql://user:password@localhost:5432/resources"
IDENTITY_DB_URL="postgresql://user:password@localhost:5432/identity"
MEMBER_DB_URL="postgresql://user:password@localhost:5432/members"
DATABASE_URL="postgresql://user:password@localhost:5432/forums"
AUTH_SECRET="replace-with-a-secure-secret"
VALID_ISSUERS='["https://topcoder-dev.auth0.com/","https://auth.topcoder-dev.com/","https://topcoder.auth0.com/","https://auth.topcoder.com/","https://api.topcoder.com","https://api.topcoder-dev.com"]'
SENDGRID_NOTIFICATION_TEMPLATE="sendgrid-template-id"
BUS_API_URL="http://localhost:4000/eventBus"
BUSAPI_URL="http://localhost:4000/eventBus"
KAFKA_ERROR_TOPIC="common.error.reporting"
AUTH0_URL="https://auth.topcoder-dev.com/"
AUTH0_AUDIENCE="https://m2m.topcoder-dev.com/"
TOKEN_CACHE_TIME=86400
M2M_CLIENT_ID="replace-with-client-id"
M2M_CLIENT_SECRET="replace-with-client-secret"
AUTH0_PROXY_SERVER_URL="http://optional-auth0-proxy"
PORT=3000
```

`FORUMS_DATABASE_URL` is preferred for runtime database connectivity; `DATABASE_URL` is the supported fallback alias when `FORUMS_DATABASE_URL` is absent. If the connection URL does not include a `schema` query parameter, the Prisma driver adapter defaults to the dedicated `forums` schema.
`CHALLENGE_DB_URL` is used by the challenge adapter for challenge existence and member challenge-access facts; `CHALLENGES_DB_URL` is the supported alias.
`RESOURCE_DB_URL` is used by the resource adapter for challenge resource roles and challenge-copilot detection; `RESOURCES_DB_URL` is the supported alias.
`IDENTITY_DB_URL` is used by the identity adapter for strict target-member resolution and normalized role lookup during M2M on-behalf watch and read-state commands.
`MEMBER_DB_URL` is used for member handle lookups when a human token supplies a member id but omits the handle claim, for strict M2M target-member validation before watch and read-state writes, and for batch notification recipient email/handle lookups. Human create commands fail instead of persisting member ids into `authorHandle` snapshots when the handle cannot be resolved; M2M create commands use the fixed system author snapshot.
`AUTH_SECRET` is required; the service fails during startup when it is omitted.
`SENDGRID_NOTIFICATION_TEMPLATE` enables forum watch notification emails. When omitted, notification publishing is skipped and content writes still succeed.
`BUS_API_URL` or `BUSAPI_URL` configures the shared event-bus endpoint for `external.action.email`. `KAFKA_ERROR_TOPIC`, `AUTH0_URL`, `AUTH0_AUDIENCE`, `TOKEN_CACHE_TIME`, `M2M_CLIENT_ID`, `M2M_CLIENT_SECRET`, and `AUTH0_PROXY_SERVER_URL` are passed to the standard bus wrapper for outbound authenticated publishing.

Health and readiness checks intentionally remain DB-only; they do not validate
event-bus, SendGrid template, producer, or outbound Auth0 readiness.

## Authentication

Bearer tokens are validated with `tc-core-library-js` and normalized before guards
read roles or scopes.

Role claims are accepted from `roles`, `role`, or namespaced/suffixed claim keys
ending in `roles` or `role`. Each role claim may be an array, a JSON-array
string, a single string, or a comma-delimited string. Role names are not split on
whitespace, so multi-word roles stay intact.

Scope claims are accepted from `scopes` or `scope` and split on whitespace. Batch
3 routes use granular forums M2M scopes:

- `read:forums-topics`
- `create:forums-topics`
- `update:forums-topics`
- `delete:forums-topics`
- `read:forums-posts` (reserved for future post-specific read APIs)
- `create:forums-posts`
- `update:forums-posts`
- `delete:forums-posts`
- `add:forums-topic-watch`
- `remove:forums-topic-watch`

The Batch 1 broad scopes remain supported through explicit alias expansion:
`create:forums`, `read:forums`, `update:forums`, `delete:forums`, and
`all:forums` map to the granular scopes in `ALL_SCOPE_MAPPINGS`. Mark-read is
authorized by `update:forums-topics`; there is no dedicated mark-read scope.
Unknown `all:*` scopes are kept as provided and are not synthesized into CRUD or
`write` scopes.

Scoped M2M tokens satisfy route guards with the endpoint scope. M2M topic and
post creation writes the fixed `system` author snapshot and does not create
author watch or read-state rows. M2M watch and read-state commands must include
`memberId` in the request body, and that id must resolve in both external
Members and Identity data before topic context loading, policy evaluation, or
state writes occur. After the target resolves, the command authorizes inherited
challenge and role visibility for that target member and writes the row for that
member. Admin JWTs use the case-insensitive `administrator` role. Challenge
copilot elevation is derived from challenge resource assignment, not from a
global JWT role, and does not bypass an effective forum `roleName`.
Read routes do not write `TopicReadState`; explicit mark-read remains on
`PUT /v6/forums/topics/:topicId/read-state` and is authorized by
`update:forums-topics`.

## Development

```bash
nvm use
pnpm install
pnpm lint
pnpm build
pnpm test
```

## Prisma

The forums Prisma schema defines `Topic`, `Post`, `TopicClosure`, `TopicWatch`, and `TopicReadState` in the dedicated `forums` schema. `pnpm prisma:generate` emits the local client at `prisma/generated/client` and the reusable exported client at `packages/forums-prisma-client`.

Topic creation is transactional: it creates the topic, starter post, closure rows, and, for human authors, author watch and read-state rows together. M2M topic creation uses the system author and skips member watch/read-state side effects. Topic deletion is soft deletion, and post deletion preserves the post row while setting content to null for placeholder reads. Topic summary reads use side-effect-free raw queries for visible-post counts, nullable latest visible activity, and unread derivation, then apply centralized forums policy filtering before pagination.
