# Dev public-forums migration verification

Executed on 7 October 2026 (Australia/Hobart), using production Vanilla as a
read-only source and the AWS dev forums/Member databases as the target.
Production databases were not written to.

The API was deployed before importing restricted categories. The dev service
`forums-api-v6` is on task revision 18, using code commit `90f244a` and image tag
`public-forums-90f244a`. ECS reached a stable deployment and live public reads
return `Cache-Control: private, no-store`.

## Imported data

| Data | Rows |
| --- | ---: |
| Categories | 57 |
| Discussion threads | 1,355 |
| Starter posts and comments | 3,756 |
| Closure relationships | 4,295 |
| Mapped forum-only role memberships | 139 |
| Watches | 619 |
| Read states | 11,162 |
| Total imported data rows | 21,440 |

The immediate second apply found all 21,440 rows and inserted **zero** rows.
The dry-run, apply and rerun plan digest was:

`aeccd893e9d6486b0750dea69d9e00a51374772c309d3c9da08f342155dcab5b`

There were 1,079 source author IDs without a matching dev member. Their original
handles and content were preserved using non-login legacy IDs. 16,013 source
state records belonged to members absent from dev and were omitted. Production
mapping must be rerun against production Members; dev IDs must not be reused.
No native Vanilla media or reactions required copying. All 99 Filestack links
in the source post bodies were preserved unchanged.

## Existing challenge data

These counts and SHA-256 fingerprints were identical in dry-run, before and
after apply, and after the no-op rerun:

| Table | Rows | SHA-256 |
| --- | ---: | --- |
| Topic | 6,437 | `3dae055b315e049750e2aff4fbbed47cdfcd24f009792235709d950a3a012f83` |
| Post | 6,484 | `c0967e56431ddddbcdd832ad7e6f2cfa70274c9557781dcffdfd9dd4b394a5d3` |
| TopicWatch | 69 | `1e9c7c8269d3c4e6f6ecfefe7617e845f0f7b93f41f7c89e0e4d90ef90e84134` |
| TopicReadState | 6,522 | `ac0b498e58c2a643303783e8ba12d65a028487b474062a9c55bffcdf164ce21b` |
| TopicClosure | 6,437 | `2d1c882cb7691562120e1222254ecbf66500eb7f0924a216d951d7abc4079a9c` |

## Live dev verification

Read-only probes used short-lived dev tokens for a synthetic QA principal; no
member roles, posts, watches or read states were created by the probes. Category
IDs and topic totals matched an independently computed source ACL projection:

| Reader | Visible categories | Visible threads |
| --- | ---: | ---: |
| Guest | 30 | 1,111 |
| Member | 48 | 1,286 |
| Copilot | 52 | 1,323 |
| Reviewer | 49 | 1,288 |

Copilot and Reviewer Discussions returned 403 to guests, ordinary members and
the other role, and 200 to the required role. Invalid tokens returned 401.
Anonymous Watching returned zero results. Measured catalog requests completed
in approximately 1.4–3.5 seconds including network latency from the test host.

The API lint/build, production Docker build and 167 tests passed. Local real
PostgreSQL/HTTP tests cover posting, replies, reactions, watches, nested private
membership, migration conflicts and reruns without sending notifications.

## Remaining production gates

The [UI PR](https://github.com/topcoder-platform/platform-ui/pull/2444) contains
the new app and passed lint, dev/prod builds and 58 focused regression tests.
Connected Chrome verification covered desktop/mobile Figma layouts, category
navigation, search/pagination, guest login return URLs, signed-in composers,
live member suggestions and Markdown preview. The approved generated text
attachment uploaded to Filestack, inserted an HTTPS Markdown link, and rendered
in preview. No test posts were submitted to migrated discussions. Accept the dev
data/role mappings before production cutover. Follow
[the migration runbook](public-forums.md); production has not been migrated.

Full owner-readable reports were retained outside the repository at
`/tmp/public-forums-dev-{dry-run,applied,rerun}.json` and
`/tmp/public-forums-live-access.json`. No credentials, post contents or member
lists are included in this document.
