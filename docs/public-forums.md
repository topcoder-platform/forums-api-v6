# Public forums

Public categories and threads use the same Topic, Post, TopicClosure, watch,
read-state, moderation, reaction and notification services as challenge forums.
The public catalog is a projection over that engine, not a second post store.

## HTTP contract

- `GET /v6/forums/public/categories` returns the visible category tree, descriptions,
  ordering, authorized subtree counts/participants, latest activity and `canCreate`.
- `GET /v6/forums/public/topics` accepts `categoryId`, `search`, `watching=true`,
  `sort=active|recent|oldest`, `page` and `perPage` (maximum 100). Search includes
  non-deleted post content. Visibility is applied before totals and pagination.
  Identity-dependent read responses send `Cache-Control: private, no-store`.
- Existing general topic list, children and detail GET routes accept guests.
  Challenge-specific lists still require authentication, and challenge visibility
  still requires the existing challenge/resource checks. Supplied invalid tokens
  are rejected; a missing token creates a non-elevated anonymous principal.
- Detail includes `permissions` for create-post, create-topic, watch, update and
  delete. Clients should also respect `topic.locked`.
- Existing topic/post commands implement creation, replies, edits, reactions,
  watches and mark-read. Every mutation requires authentication and policy checks.
  Creating a public thread uses `parentTopicId` with the category ID and no
  `challengeId`. Ordinary members cannot create category roots or delete content.

`PublicForumCategory` holds ordered metadata and separate `readRoles`,
`createRoles` and `replyRoles` arrays. Entries within an array are alternatives;
every category ancestor must allow reading. `$public` permits guests,
`$authenticated` permits members, and other entries match normalized token roles
or imported forum-only membership rows. Empty arrays deny ordinary members.
Administrators and appropriately scoped machines retain elevated access.
Category containers cannot receive threads or posts. Threads cannot receive
child threads. Watches on categories cover descendant threads through the
existing closure-based notification recipient lookup. Recipient authorization
checks the category ACL again at delivery time.

`PublicForumRoleMember` preserves Vanilla-only memberships without granting
Identity API roles or access to any other application. Copilot Discussions and
Reviewer Discussions explicitly require `copilot` and `reviewer`, respectively.
Other Private descendants retain their source permission categories and custom
memberships. A private ancestor cannot be bypassed by a permissive child.

## Insert-only migration

The additive Prisma migration creates three public metadata/provenance tables.
It does not alter or reset existing Topic/Post/challenge rows. Deploy the new API
**before importing**: older API versions do not understand public category ACLs.
Do not roll the service back to an older policy implementation while imported
restricted content is present. Roll forward with a fix instead.

The public importer is separate from `import:vanilla` (the challenge importer).
It reads production MySQL in a read-only, repeatable-read consistent snapshot.
It excludes the challenge category subtree, all group-linked ancestry and the
obsolete empty Groups container. A group-linked discussion inside an otherwise
public category aborts the import for review.

Preserved data includes category ancestry/order/descriptions, thread titles,
starter posts, nested replies, source timestamps, announcements, locks, author
handles, Markdown/mention/attachment URLs, known-member bookmarks, category
follows and read states. The two observed Rich-format source posts are converted
from Quill text/link operations; unsupported formats or embeds stop the import.
Referenced native Vanilla Media rows also stop the import until their files have
an explicit copy plan. The audited source has no referenced native media and no
reactions; its 99 Filestack links remain unchanged.

Authors are mapped by unique lowercase handle against **target-environment**
Members data. Missing authors keep their source handle and a non-login
`vanilla:<id>` identity. Missing target members' watches/read states are omitted
and reported; they must never be attached to a coincidentally equal numeric ID.
Only mapped target members receive forum-only role memberships. Global Vanilla
member/IP bans and challenge data are not imported. Existing view metrics remain
the shared API's distinct-reader counts, rather than Vanilla's cumulative hit
counter. Source-wide user identities/credentials are not copied.

Deterministic `pf…` IDs and immutable provenance make an unchanged rerun a no-op.
The importer refuses unowned ID collisions, changed source projections, changed
target content, invalid reply parents and cyclic ancestry. It never overwrites a
user edit. All inserts occur in one serializable transaction with an advisory
lock. Challenge Topic, Post, TopicClosure, watch and read-state fingerprints must
match before and after or the transaction rolls back. Dry runs use read-only
transactions and make no data changes.

### Commands

Run `nvm use` in this project, install with `pnpm install --frozen-lockfile`, and
run `pnpm build`. Supply credentials through the environment or a secrets manager:

```sh
# VANILLA_DB_URL points to the authorized production Vanilla source.
# FORUMS_DATABASE_URL and MEMBER_DB_URL both point to the intended target tenant.
# PUBLIC_IMPORT_TARGET_HOST must exactly match both target URL hostnames.
pnpm import:vanilla:public --report=/secure/path/public-forums-dry-run.json
pnpm import:vanilla:public --apply --report=/secure/path/public-forums-applied.json
pnpm import:vanilla:public --apply --report=/secure/path/public-forums-rerun.json
```

Reports are owner-readable files containing counts, a plan digest, missing source
author IDs and challenge fingerprints, without credentials or post content. UTC
is used for migration timestamps. Keep reports outside the repository. Check
that dry-run counts match source inventory, apply fingerprints match and the
immediate rerun inserts zero rows. If a source/target changes later, the conflict
requires reconciliation; the tool does not silently refresh already imported
content. Preserve the original reports to distinguish subsequent user activity.

For production cutover, freeze Vanilla posting, repeat the source/target audit
against production Members, deploy the API first, run dry-run/apply/rerun, verify
anonymous/member/copilot/reviewer/private access and then switch the UI entry
point. Production import is a separate step after dev testing is accepted.

## Verification

`pnpm lint`, `pnpm build` and `pnpm test --runInBand` run normal checks. The real
PostgreSQL/HTTP suite also verifies anonymous read-only behavior, private search
and watch filtering, token errors, role/local-membership boundaries, member
commands, full-post search, migration reruns, conflict rollback and unchanged
challenge fingerprints.

Use a disposable local database whose name ends in `_http_test`, apply Prisma
migrations, then run:

```sh
TZ=UTC PUBLIC_FORUMS_TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:55439/public_forums_http_test \
  pnpm test --runInBand
```

That suite truncates its dedicated local test database, rejects remote hosts and
other database names, uses real SQL and policies, and substitutes JWT validation
and email publishing so it cannot notify real users. The standalone unit suite
runs without a database. Use `TZ=UTC` for the database suite so PostgreSQL
timestamps without time zones are compared consistently by the import checks.

## Catalog query behavior

Public catalog reads batch category ancestry, inherited ACLs, and imported role
memberships once per request. Topic lists apply visibility, direct topic roles,
search, watches, and sorting in PostgreSQL before pagination. Only the selected
page receives full post/participant summaries; totals remain available for an
out-of-range page. Search treats `%` and `_` as literal substring characters.

Category statistics are aggregated in SQL over authorized threads and their
non-deleted posts. Each response contains at most five participant previews per
category, selected by latest activity with deterministic ID tie-breaking. Counts
include all distinct authorized participants. Latest activity and unread state
exclude restricted or deleted descendants. No shared cache stores personalized
ACLs, watches, or unread state, so permission and membership changes are visible
on the next request.

## Development latency remediation — 7 October 2026

The public legacy import exposed full-catalog reads, per-category authorization
queries, CPU saturation and a Node heap crash. The read-path changes above are
implemented in source commit `a4691d4` on `codex/forum-catalog-latency`.

The development ECS service `tc-forums-serverless/forums-api-v6` now has a desired
count of **two tasks**, each retaining **1 vCPU / 2,048 MiB**. The existing deploy
suite updates only the task definition and therefore preserves the service's
desired count. There is no service autoscaling target overriding that count.
Both tasks retain the existing subnet placement; this adds process redundancy,
not multi-AZ redundancy.

The dev `services-alb` HTTPS listener default action now returns HTTP **404** with
`application/json` body `{"message":"Not found"}`. Its non-default route rules
are unchanged. Previously unmatched requests reached the empty retired
`tc-email-service-svc-tg` target group and generated HTTP 503. No monitoring or
alarm configuration was changed.

Deployment artifact:

- Task definition: `forums-api-v6:27`.
- Image tag: `forums-api-v6:catalog-latency-a4691d4`.
- Image digest: `sha256:5b38d36f40f2287d9b04a7d57beaeeef2aa12d707cca7cf231a274e8af3b4a65`.
- Runtime base: the existing `legacy-jive-catalog-4bee3af` image, pinned to
  `sha256:7e108dd776dba91546a2cfb057010f3b5bbf8a2871fceb9317508dec2f75e4fb`.

The release reuses the unchanged runtime/dependencies and copies the compiled
JavaScript and source maps for `forums-access-policy.service`,
`forums-topic-context.service`, `forums.module`, `public-forum-access.service`,
`public-forums.service`, and `public-forums-query.service` into
`/usr/src/app/dist/forums/`. Every copied artifact's SHA-256 was checked against
the local validated build. No database migration is required by this change.
The standard source Docker build includes the same implementation for subsequent
releases. Task revision 24 remains available as the previous application version;
an application rollback can preserve the two-task count and the default 404.

Validation includes `pnpm lint`, `pnpm build`, 173 passing tests (four optional
tests skipped), real local PostgreSQL/HTTP permission and pagination checks,
and read-only dev verification against the immutable migration source. The
source audit matched all 844 guest-visible and 854 member-visible legacy
categories, the respective thread/post counts, and private-thread denial.

The focused PR branch `codex/forum-catalog-latency-develop` carries the same
catalog implementation onto `develop` without the earlier Jive migration tools
or dependency changes. Its lint and build checks pass, and its UTC/local
PostgreSQL test run passes 170 tests across 21 suites (three optional tests
skipped); the additional Jive tests above belong to the original deployment
branch.

Initial live checks of the optimized read path measured topic pages at
1.7–2.2 seconds versus 14.6 seconds before remediation, and categories at
4.3–5.0 seconds versus 10.9 seconds. The category response still aggregates the
full authorized tree and is approximately 700 KB; these are sampled timings,
not a sustained-load benchmark. Verification artifacts and pre-change AWS
snapshots are retained in `/tmp/dev-latency-triage` on the operator workstation.
