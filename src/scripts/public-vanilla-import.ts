import { writeFile } from 'fs/promises';
import { Client } from 'pg';
import {
  planPublicImport,
  readPublicVanilla,
  writePublicImport,
} from '../forums/import/public-vanilla-import';

/** Runs an explicit-source, explicit-target public import; dry-run unless --apply is supplied.
 * Required env: VANILLA_DB_URL, FORUMS_DATABASE_URL, MEMBER_DB_URL, PUBLIC_IMPORT_TARGET_HOST.
 * @returns Completion after an owner-only report is written. @throws Configuration, audit, SQL and file errors.
 */
async function main(): Promise<void> {
  process.env.TZ = 'UTC';
  const {
    VANILLA_DB_URL,
    FORUMS_DATABASE_URL,
    MEMBER_DB_URL,
    PUBLIC_IMPORT_TARGET_HOST,
  } = process.env;
  if (
    !VANILLA_DB_URL ||
    !FORUMS_DATABASE_URL ||
    !MEMBER_DB_URL ||
    !PUBLIC_IMPORT_TARGET_HOST
  )
    throw new Error(
      'Explicit Vanilla, forums, members URLs and expected target host are required',
    );
  if (new URL(FORUMS_DATABASE_URL).hostname !== PUBLIC_IMPORT_TARGET_HOST)
    throw new Error('Target host does not match the explicit migration target');
  if (new URL(MEMBER_DB_URL).hostname !== PUBLIC_IMPORT_TARGET_HOST)
    throw new Error('Member mapping must use the target environment');
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--apply' && !arg.startsWith('--report=')))
    throw new Error(
      'Usage: public-vanilla-import [--apply] [--report=path.json]',
    );
  const reportPath =
    args
      .find((arg) => arg.startsWith('--report='))
      ?.slice('--report='.length) ?? 'public-forums-import-report.json';
  const source = await readPublicVanilla(VANILLA_DB_URL);
  const membersDb = new Client({ connectionString: MEMBER_DB_URL });
  const target = new Client({ connectionString: FORUMS_DATABASE_URL });
  try {
    await membersDb.connect();
    await target.connect();
    const handles = [
      ...new Set(
        source.users.map((user) => String(user.Name).trim().toLowerCase()),
      ),
    ];
    const rows = (
      await membersDb.query<{ userId: string; handle: string }>(
        'SELECT "userId"::text,handle FROM members.member WHERE "handleLower"=ANY($1::text[])',
        [handles],
      )
    ).rows;
    const members = new Map(
      rows.map((member) => [member.handle.toLowerCase(), member]),
    );
    const plan = planPublicImport(source, members);
    const result = await writePublicImport(
      target,
      plan.entries,
      args.includes('--apply'),
    );
    const report = {
      ...result,
      source: {
        categories: source.categories.length,
        discussions: source.discussions.length,
        comments: source.comments.length,
      },
      unmappedAuthorIds: plan.unmappedAuthorIds,
      unmappedStates: plan.unmappedStates,
      generatedAt: new Date().toISOString(),
    };
    await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', {
      mode: 0o600,
    });
    console.log(JSON.stringify({ ...result, reportPath }));
  } finally {
    await membersDb.end();
    await target.end();
  }
}
void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Import failed');
  process.exitCode = 1;
});
