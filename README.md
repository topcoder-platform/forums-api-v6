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
- `PUT /v6/forums/posts/:postId/reaction`
- `DELETE /v6/forums/posts/:postId/reaction`
- `PUT /v6/forums/moderation/topics/:topicId/lock`
- `DELETE /v6/forums/moderation/topics/:topicId/lock`
- `PUT /v6/forums/moderation/member-bans/:memberId`
- `DELETE /v6/forums/moderation/member-bans/:memberId`
- `PUT /v6/forums/moderation/ip-bans/:ipAddress`
- `DELETE /v6/forums/moderation/ip-bans/:ipAddress`

This service includes the forums schema, Prisma client export, topic read workflows, transactional command-side workflows, per-member post reactions, centralized forums authorization and runtime moderation for topics, posts, watches, and explicit read-state updates, plus best-effort watch notification publishing for new posts and successful allowed child-topic starter posts. The policy resolves inherited topic restrictions, challenge access, resource-role/copilot elevation, role matching, ownership, scoped M2M write access, and M2M on-behalf target-member visibility before writes, reads, or notification delivery. Runtime moderation enforces active member bans, trusted exact-IP bans for human request traffic, and locked-topic mutation rules.

Topic reads are exposed under `read:forums-topics`. `GET /v6/forums/topics` returns visible non-challenge root topics; `GET /v6/forums/topics/challenges/:challengeId` checks base challenge visibility before returning visible challenge roots; `GET /v6/forums/topics/:topicId/children` requires parent visibility before filtering direct children; and `GET /v6/forums/topics/:topicId` returns topic detail with an embedded post tree. Active member bans and trusted exact-IP bans return 403 before read policy or query work. Topic summaries include `locked`, `lockedBy`, and `lockedAt`; `lockedBy` and `lockedAt` may be null for imported legacy locked topics. Locked topics remain readable for callers that otherwise pass moderation and visibility checks. Detail embeds posts under `read:forums-topics`, keeps deleted post placeholders with null content, counts only non-deleted posts, derives unread state from `TopicReadState.lastReadAt`, and includes each post's shared `thumbsUpCount`/`thumbsDownCount` plus the authenticated member's nullable `viewerReaction`. `read:forums-posts` remains reserved for future post-specific read APIs in v1.

Human members set or switch their one-per-post reaction with `PUT /v6/forums/posts/:postId/reaction` and `{ "reaction": "THUMBS_UP" }` or `{ "reaction": "THUMBS_DOWN" }`. `DELETE` on the same route idempotently removes the member's reaction. Both commands return the resulting `viewerReaction` and current shared counts, enforce runtime bans and inherited post visibility, and reject deleted posts. They remain available on locked topics because reactions do not change discussion content. The reaction routes are human-member-only; M2M callers cannot own reaction state.

Top-level non-challenge topics may be created by human admins and scoped M2M callers. Top-level challenge topics may be created by eligible challenge members, challenge copilots, and admins; M2M callers cannot create challenge roots. Regular authenticated members may create child topics only under parents they can see and only when the resolved effective child context remains non-challenge; requests that inherit or introduce a non-null `challengeId` under a parent are rejected before writes. Allowed child topics must keep monotonic role restrictions: inherited roles cannot be cleared or replaced. Challenge-scoped visibility is verified through the configured challenge and resource adapters, including challenge-resource membership and challenge-copilot elevation. Challenge copilots may access or moderate challenge-scoped forums only when any effective `roleName` forum restriction is also satisfied; admin and scoped M2M bypass behavior is unchanged. Active member bans and trusted exact-IP bans return 403 for human writes before content, watch, or read-state changes. M2M on-behalf watch and read-state commands enforce active bans on the resolved target member and do not evaluate IP bans. Locked topics reject child-topic creation under the locked parent, replies, topic updates/deletes, and post updates/deletes unless the actor is an administrator or a human challenge copilot acting on a challenge-scoped topic.

Moderation management is exposed under `/v6/forums/moderation`. Human callers must have the case-insensitive `administrator` role; M2M callers must have `moderate:forums`. Human tokens do not gain moderation-route access from scopes alone, and M2M tokens do not gain access from roles alone. Challenge copilots do not gain moderation-endpoint access unless they are also administrators. Topic lock/unlock endpoints return `topicId`, `locked`, `lockedBy`, `lockedAt`, and `updatedAt`. Member and IP ban endpoints return the persisted ban row plus an `active` flag. Ban audit columns store the human administrator member id when available; M2M moderation stores null audit member ids. IP moderation accepts only exact bare IPv4 or IPv6 host values and rejects CIDR, wildcards, comma-delimited values, bracketed IPv6, host:port, quoted values, and invalid text.

## Notifications

Successful `POST /v6/forums/topics/:topicId/posts` commands publish a
best-effort watch notification after the post transaction commits. Successful
allowed child-topic `POST /v6/forums/topics` commands publish the same
notification for the created starter post. Top-level topic creation, updates,
deletes, watch mutations, and mark-read commands do not publish notifications.

Recipient resolution expands watches from the created content topic through all
ancestor topics using `TopicClosure`, dedupes by member id, excludes the
persisted author member id, loads recipient email and handle data from the
Members database, removes active member bans, and filters each candidate through
the shared forums access policy using the effective challenge, role, and
conflict state for the created content. IP bans are not evaluated for
notifications because delivery is not bound to a trusted request client IP. The
publisher emits one `external.action.email` event with the final deduped email
list and `SENDGRID_NOTIFICATION_TEMPLATE`. Missing template or missing
recipient email skips notification delivery and is logged without rolling back
the content write.

## Environment

```bash
FORUMS_DATABASE_URL="postgresql://user:password@localhost:5432/forums"
CHALLENGE_DB_URL="postgresql://user:password@localhost:5432/challenges"
CHALLENGES_DB_URL="postgresql://user:password@localhost:5432/challenges"
RESOURCE_DB_URL="postgresql://user:password@localhost:5432/resources"
RESOURCES_DB_URL="postgresql://user:password@localhost:5432/resources"
IDENTITY_DB_URL="postgresql://user:password@localhost:5432/identity"
MEMBER_DB_URL="postgresql://user:password@localhost:5432/members"
VANILLA_DB_URL="mysql://user:password@localhost:3306/vanilla"
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
TRUST_FORWARDED_CLIENT_IP=false
PORT=3000
```

`FORUMS_DATABASE_URL` is preferred for runtime database connectivity; `DATABASE_URL` is the supported fallback alias when `FORUMS_DATABASE_URL` is absent. If the connection URL does not include a `schema` query parameter, the Prisma driver adapter defaults to the dedicated `forums` schema.
`CHALLENGE_DB_URL` is used by the challenge adapter for challenge existence and member challenge-access facts; `CHALLENGES_DB_URL` is the supported alias.
`RESOURCE_DB_URL` is used by the resource adapter for challenge resource roles and challenge-copilot detection; `RESOURCES_DB_URL` is the supported alias.
`IDENTITY_DB_URL` is used by the identity adapter for strict target-member resolution and normalized role lookup during M2M on-behalf watch and read-state commands.
`MEMBER_DB_URL` is used for member handle lookups when a human token supplies a member id but omits the handle claim, for strict M2M target-member validation before watch and read-state writes, and for batch notification recipient email/handle lookups. Human create commands fail instead of persisting member ids into `authorHandle` snapshots when the handle cannot be resolved; M2M create commands use the fixed system author snapshot.
`VANILLA_DB_URL` is used only by the standalone Vanilla import CLI for legacy MySQL reads. The runtime HTTP service does not connect to Vanilla.
`AUTH_SECRET` is required; the service fails during startup when it is omitted.
`SENDGRID_NOTIFICATION_TEMPLATE` enables forum watch notification emails. When omitted, notification publishing is skipped and content writes still succeed.
`BUS_API_URL` or `BUSAPI_URL` configures the shared event-bus endpoint for `external.action.email`. `KAFKA_ERROR_TOPIC`, `AUTH0_URL`, `AUTH0_AUDIENCE`, `TOKEN_CACHE_TIME`, `M2M_CLIENT_ID`, `M2M_CLIENT_SECRET`, and `AUTH0_PROXY_SERVER_URL` are passed to the standard bus wrapper for outbound authenticated publishing.
`TRUST_FORWARDED_CLIENT_IP=true` enables forwarded client-IP moderation using the first exact IPv4/IPv6 host from trusted forwarding headers. When disabled, or when the forwarded value is missing, malformed, CIDR, wildcard, or otherwise non-exact, no client IP is resolved and IP-ban enforcement is skipped for that request. Do not enable this unless the service is behind infrastructure that strips or controls inbound forwarding headers.

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
- `moderate:forums` (standalone moderation management scope)

The Batch 1 broad scopes remain supported through explicit alias expansion:
`create:forums`, `read:forums`, `update:forums`, `delete:forums`, and
`all:forums` map to the granular content, watch, and read-state scopes in
`ALL_SCOPE_MAPPINGS`. `moderate:forums` is intentionally standalone and is not
included in `all:forums`. Mark-read is authorized by `update:forums-topics`;
there is no dedicated mark-read scope.
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

Moderation routes apply both `administrator` role metadata and the
`moderate:forums` scope. The guard interprets those by token type: human tokens
must satisfy the role, and M2M tokens must satisfy the scope. A human non-admin
with `moderate:forums` receives 403, and an M2M token with an administrator role
but without `moderate:forums` receives 403.

## Runtime moderation

Active `MemberBan` rows return 403 for reads, writes, human watch/read-state
commands, and M2M on-behalf watch/read-state commands targeting that member.
Active `IpBan` rows return 403 only for non-M2M requests with a trusted resolved
client IP; exact matching is performed by PostgreSQL `inet` equality. Locked
topics remain listable and readable but reject discussion content mutations.
Post reactions remain available to otherwise-authorized human members. Lock bypass
is limited to administrators everywhere and human challenge copilots on
challenge-scoped topics. Scoped M2M callers do not bypass locks unless they also
qualify as administrators.

Runtime moderation and moderation management are separate surfaces. The runtime
content flows still allow challenge-copilot lock bypass where described above,
but the `/moderation` endpoints require administrator role access for humans or
`moderate:forums` for M2M callers.

## Development

The supported local and container runtime is Node.js 26.5.1 with pnpm 11.15.1.
The checked-in `.nvmrc` selects the required Node.js release.
The production image installs Alpine's dynamically linked Node.js package and
runs as an unprivileged application user so patched system libraries are used at
runtime without shipping package-manager tooling.

```bash
nvm use
pnpm install
pnpm lint
pnpm build
pnpm test
```

## Vanilla import CLI

Build the project first, then run the importer with an operator-selected report
path:

```bash
pnpm build
pnpm import:vanilla -- --report ./vanilla-import-report.json
```

The importer starts an isolated Nest application context from
`src/forums/import/vanilla-import.module.ts`; it does not bootstrap
`AppModule`, auth, controllers, moderation routes, `ForumsCommandService`, or
watch notifications.

Preflight is strict and stops before any Vanilla source reads unless all target
tables are empty: `Topic`, `Post`, `TopicClosure`, `TopicWatch`,
`TopicReadState`, `MemberBan`, and `IpBan`. It also verifies Forums Postgres,
Members DB, Challenge DB, Vanilla MySQL, and report-path writability.

In scope: Vanilla discussions, replies, watches/subscriptions, read-state,
active member bans, and exact IPv4/IPv6 host ban rows. Discussions become root
topics plus starter posts and a depth-0 self closure. Replies preserve the
legacy parent graph; unmatched authors or unavailable parents skip the whole
descendant branch. Watches and read-state import only for imported topics and
mapped members. Read-state duplicates collapse to the latest legacy timestamp.
Member bans import only when the banned member maps. IP bans import matching
Vanilla ban rows only when they are exact bare host rules; CIDR, wildcard,
range, host:port, bracketed, and otherwise non-exact rules are skipped and
reported.

The CLI logs stage starts, completions, and progress every 500 source records or
reply discussion scans. The selected JSON report is written only when the run
completes or fails; while the import is active the report path can remain empty
because per-record details are staged in a temporary `.vanilla-import-report-*`
directory. There is no dry-run, resume, stage-select, or rerun flag. The JSON
report records preflight results, member mapping counts, and per-stage
imported/skipped/failed records. If results are unacceptable or the process is
interrupted, wipe the target forums dataset and rerun the full import.

## Prisma

The forums Prisma schema defines `Topic`, `Post`, `PostReaction`, `TopicClosure`, `TopicWatch`, `TopicReadState`, `MemberBan`, and `IpBan` in the dedicated `forums` schema. `PostReaction` uses a composite post/member key so each member has at most one thumbs-up or thumbs-down value per post; deleting a post cascades its reactions. Topics store an explicit lock state plus nullable lock timestamp and lock actor member id. Ban rows keep active and removed audit metadata; the migration enforces one active row per member or exact IP value and validates IP bans as single IPv4/IPv6 host values. `pnpm prisma:generate` emits the local client at `prisma/generated/client` and the reusable exported client at `packages/forums-prisma-client`.

Topic creation is transactional: it creates the topic, starter post, closure rows, and, for human authors, author watch and read-state rows together. M2M topic creation uses the system author and skips member watch/read-state side effects. Topic deletion is soft deletion, and post deletion preserves the post row while setting content to null for placeholder reads. Topic summary reads use side-effect-free raw queries for topic lock state, visible-post counts, nullable latest visible activity, and unread derivation, then apply centralized forums policy filtering before pagination.
