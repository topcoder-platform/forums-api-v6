import { createHash } from 'crypto';
import { Client } from 'pg';
import { Connection, createConnection, RowDataPacket } from 'mysql2/promise';

export type LegacyRow = Record<string, any>;
export interface PublicImportSnapshot {
  categories: LegacyRow[];
  permissions: LegacyRow[];
  roles: LegacyRow[];
  discussions: LegacyRow[];
  comments: LegacyRow[];
  users: LegacyRow[];
  memberships: LegacyRow[];
  watches: LegacyRow[];
  categoryWatches: LegacyRow[];
  media: LegacyRow[];
}
export interface PublicImportEntry {
  table: string;
  type: string;
  sourceId: string;
  key: string[];
  row: LegacyRow;
}

/** Computes stable JSON for provenance comparisons, including database timestamps.
 * @param value JSON-compatible data. @returns Canonical JSON. @throws Invalid cyclic inputs.
 */
export function canonical(value: any): string {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(',')}}`;
  return JSON.stringify(value);
}
/** Hashes source/target projections without exposing their text in reports.
 * @param value JSON input. @returns SHA-256 hex. @throws Canonicalization errors.
 */
export function publicImportHash(value: any): string {
  return createHash('sha256').update(canonical(value)).digest('hex');
}
/** Creates a deterministic ID in a distinct public-import namespace.
 * @param type Entity kind. @param sourceId Vanilla ID. @returns 14-character target ID. @throws Never.
 */
export function publicImportId(
  type: string,
  sourceId: string | number,
): string {
  return (
    'pf' +
    createHash('sha256')
      .update(`vanilla-public-v1:${type}:${sourceId}`)
      .digest('base64url')
      .slice(0, 12)
  );
}
/** Selects non-challenge/non-group category subtrees, checking the entire ancestry.
 * @param categories Full Vanilla category inventory. @returns Eligible categories in source sort order.
 * @throws Missing ancestors or cyclic categories, rather than accidentally publishing an unknown subtree.
 */
export function publicCategories(categories: LegacyRow[]): LegacyRow[] {
  const byId = new Map(categories.map((row) => [Number(row.CategoryID), row]));
  return categories
    .filter((row) => {
      if (Number(row.CategoryID) === -1 || row.UrlCode === 'groups')
        return false;
      let current: LegacyRow | undefined = row;
      const seen = new Set<number>();
      while (current && Number(current.CategoryID) !== -1) {
        const id = Number(current.CategoryID);
        if (seen.has(id)) throw new Error(`Category cycle at ${id}`);
        seen.add(id);
        if (
          current.GroupID ||
          current.UrlCode === 'challenges-forums' ||
          current.UrlCode === 'groups'
        )
          return false;
        if (current.ParentCategoryID === null)
          throw new Error(`Missing parent for category ${id}`);
        current = byId.get(Number(current.ParentCategoryID));
        if (!current) throw new Error(`Missing category ancestor for ${id}`);
      }
      return true;
    })
    .sort((a, b) => Number(a.Sort) - Number(b.Sort));
}
/** Converts the legacy Rich (Quill Delta) format to Markdown while preserving supported formatting.
 * Markdown input is retained byte for byte, including attachment URLs and mentions.
 * @param body Source text. @param format Vanilla format. @returns Markdown. @throws Unsupported formats/embeds/attributes.
 */
export function publicMarkdown(
  body: string | null,
  format: string | null,
): string | null {
  if (!body || !format || format.toLowerCase() === 'markdown') return body;
  if (format.toLowerCase() !== 'rich')
    throw new Error(`Unsupported Vanilla format: ${format}`);
  const parsed = JSON.parse(body) as LegacyRow[];
  if (!Array.isArray(parsed)) throw new Error('Invalid Rich document');
  let output = '';
  for (const operation of parsed) {
    const attributes = operation.attributes ?? {};
    if (typeof operation.insert !== 'string')
      throw new Error('Unsupported Rich embed; review required');
    let text = operation.insert as string;
    for (const key of Object.keys(attributes)) {
      if (
        ![
          'bold',
          'italic',
          'underline',
          'strike',
          'link',
          'code',
          'header',
          'list',
          'blockquote',
          'code-block',
        ].includes(key)
      )
        throw new Error(`Unsupported Rich attribute ${key}`);
    }
    if (attributes.link)
      text = `[${text}](<${String(attributes.link).replace(/>/g, '%3E')}>)`;
    if (attributes.bold) text = `**${text}**`;
    if (attributes.italic) text = `_${text}_`;
    if (attributes.underline) text = `<u>${text}</u>`;
    if (attributes.strike) text = `~~${text}~~`;
    if (attributes.code) text = '`' + text + '`';
    if (text === '\n' && Object.keys(attributes).length) {
      const start = output.lastIndexOf('\n') + 1;
      const prefix = attributes.header
        ? '#'.repeat(Number(attributes.header)) + ' '
        : attributes.list === 'ordered'
          ? '1. '
          : attributes.list
            ? '- '
            : attributes.blockquote
              ? '> '
              : '';
      output = output.slice(0, start) + prefix + output.slice(start);
      if (attributes['code-block'])
        throw new Error('Rich code block requires review');
    }
    output += text;
  }
  return output;
}

/** Reads a consistent, explicitly read-only source snapshot with no global bans or challenge content.
 * @param url Authorized production Vanilla URL. @returns Public source snapshot. @throws SQL/inventory errors.
 */
export async function readPublicVanilla(
  url: string,
): Promise<PublicImportSnapshot> {
  const connection = await createConnection({ uri: url, timezone: 'Z' });
  try {
    await connection.query(
      'SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ',
    );
    await connection.query('SET SESSION TRANSACTION READ ONLY');
    await connection.query('START TRANSACTION WITH CONSISTENT SNAPSHOT');
    const allCategories = await rows(connection, 'SELECT * FROM GDN_Category');
    const categories = publicCategories(allCategories);
    const ids = categories.map((row) => row.CategoryID);
    if (!ids.length) throw new Error('No public categories found');
    const snapshot: PublicImportSnapshot = {
      categories,
      permissions: await rows(
        connection,
        "SELECT * FROM GDN_Permission WHERE JunctionTable = 'Category'",
      ),
      roles: await rows(connection, 'SELECT RoleID,Name,Type FROM GDN_Role'),
      discussions: await rows(
        connection,
        'SELECT DiscussionID,CategoryID,InsertUserID,Name,Body,Format,Closed,Announce,CountViews,DateInserted,DateUpdated,GroupID FROM GDN_Discussion WHERE CategoryID IN (?)',
        [ids],
      ),
      comments: await rows(
        connection,
        'SELECT c.CommentID,c.DiscussionID,c.InsertUserID,c.Body,c.Format,c.DateInserted,c.DateUpdated,c.DateDeleted,c.DeleteUserID,c.ParentCommentID FROM GDN_Comment c JOIN GDN_Discussion d ON d.DiscussionID=c.DiscussionID WHERE d.CategoryID IN (?)',
        [ids],
      ),
      users: await rows(connection, 'SELECT UserID,Name FROM GDN_User'),
      memberships: await rows(
        connection,
        "SELECT UserID,RoleID FROM GDN_UserRole WHERE RoleID IN (SELECT RoleID FROM GDN_Role WHERE Type IS NULL OR Type <> 'topcoder')",
      ),
      watches: await rows(
        connection,
        'SELECT u.* FROM GDN_UserDiscussion u JOIN GDN_Discussion d ON d.DiscussionID=u.DiscussionID WHERE d.CategoryID IN (?) AND (u.Bookmarked=1 OR u.DateLastViewed IS NOT NULL)',
        [ids],
      ),
      categoryWatches: await rows(
        connection,
        'SELECT * FROM GDN_UserCategory WHERE CategoryID IN (?)',
        [ids],
      ),
      media: await rows(connection, 'SELECT * FROM GDN_Media'),
    };
    if (snapshot.discussions.some((row) => row.GroupID))
      throw new Error(
        'Group-linked discussion under public category; review required',
      );
    await connection.query('COMMIT');
    return snapshot;
  } finally {
    await connection.end();
  }
}
/** Executes an importer SELECT using bound parameters. @param db Read-only connection. @param sql SQL. @param values Parameters.
 * @returns Rows. @throws MySQL errors.
 */
async function rows(
  db: Connection,
  sql: string,
  values: unknown[] = [],
): Promise<LegacyRow[]> {
  return (await db.query<RowDataPacket[]>(sql, values))[0];
}

/** Plans immutable public forum rows using target-member handle matches, preserving unknown authors with non-login IDs.
 * @param source Consistent Vanilla snapshot. @param members Target member projection keyed by lowercase handle.
 * @returns Insert plan and explicit identity/attachment exceptions. @throws Unresolvable nesting or source formats.
 */
export function planPublicImport(
  source: PublicImportSnapshot,
  members: Map<string, { userId: string; handle: string }>,
) {
  const entries: PublicImportEntry[] = [];
  const unmapped = new Set<number>();
  const users = new Map(source.users.map((row) => [Number(row.UserID), row]));
  const actor = (
    id: number,
    contentAuthor = true,
  ): { authorMemberId: string; authorHandle: string } => {
    const user = users.get(Number(id));
    const member = members.get(
      String(user?.Name ?? '')
        .trim()
        .toLowerCase(),
    );
    if (!member && contentAuthor) unmapped.add(Number(id));
    return {
      authorMemberId: member ? String(member.userId) : `vanilla:${id}`,
      authorHandle:
        member?.handle ??
        String(user?.Name || `Vanilla member ${id}`).slice(0, 128),
    };
  };
  const add = (
    table: string,
    type: string,
    sourceId: string | number,
    key: string[],
    row: LegacyRow,
  ): void => {
    entries.push({ table, type, sourceId: String(sourceId), key, row });
  };
  const topicRows = new Map<string, LegacyRow>();
  const categoryIds = new Map(
    source.categories.map((row) => [
      Number(row.CategoryID),
      publicImportId('category', row.CategoryID),
    ]),
  );
  const topic = (
    id: string,
    parentTopicId: string | null,
    title: string,
    authorId: number,
    createdAt: Date,
    updatedAt: Date,
    locked = false,
    announcement = false,
  ): LegacyRow => ({
    id,
    parentTopicId,
    challengeId: null,
    roleName: null,
    title,
    ...actor(authorId),
    createdAt,
    updatedAt: updatedAt ?? createdAt,
    isAnnouncement: announcement,
    locked,
    lockedAt: null,
    lockedByMemberId: null,
    deletedAt: null,
    deletedByMemberId: null,
  });
  const roleById = new Map(
    source.roles.map((role) => [Number(role.RoleID), role]),
  );
  const permissions = (category: LegacyRow, field: string): string[] =>
    [
      ...new Set(
        source.permissions
          .filter(
            (permission) =>
              Number(permission.JunctionID) ===
                Number(category.PermissionCategoryID) && !!permission[field],
          )
          .map((permission) => {
            const role = roleById.get(Number(permission.RoleID));
            if (!role) throw new Error('Missing Vanilla permission role');
            if (role.Type === 'guest') return '$public';
            if (role.RoleID === 8 || role.Name === 'Topcoder User')
              return '$authenticated';
            if (role.Type === 'topcoder')
              return String(role.Name).trim().toLowerCase();
            return `vanilla-role:${role.RoleID}`;
          }),
      ),
    ].sort();
  for (const category of source.categories) {
    const id = categoryIds.get(Number(category.CategoryID))!;
    const parentId =
      Number(category.ParentCategoryID) === -1
        ? null
        : categoryIds.get(Number(category.ParentCategoryID));
    if (parentId === undefined)
      throw new Error(`Excluded category parent ${category.CategoryID}`);
    const row = topic(
      id,
      parentId,
      category.Name,
      category.InsertUserID,
      category.DateInserted,
      category.DateUpdated,
    );
    topicRows.set(id, row);
    add('Topic', 'category-topic', category.CategoryID, ['id'], row);
    let readRoles = permissions(category, 'Vanilla.Discussions.View');
    let createRoles = permissions(category, 'Vanilla.Discussions.Add');
    let replyRoles = permissions(category, 'Vanilla.Comments.Add');
    // Explicit product requirements: new public forums reopen authenticated conversation.
    // Private membership ACLs remain exactly scoped; only ordinary public/member categories get this override.
    if (readRoles.includes('$public') || readRoles.includes('$authenticated')) {
      createRoles = ['$authenticated'];
      replyRoles = ['$authenticated'];
    }
    if (/^copilot discussions?$/i.test(category.Name)) {
      readRoles = ['copilot'];
      createRoles = ['copilot'];
      replyRoles = ['copilot'];
    }
    if (/^reviewer discussions?$/i.test(category.Name)) {
      readRoles = ['reviewer'];
      createRoles = ['reviewer'];
      replyRoles = ['reviewer'];
    }
    if (category.DisplayAs === 'Categories') createRoles = [];
    add('PublicForumCategory', 'category', category.CategoryID, ['topicId'], {
      topicId: id,
      description: category.Description ?? '',
      displayAs: category.DisplayAs,
      sortOrder: Number(category.Sort),
      readRoles,
      createRoles,
      replyRoles,
      legacyId: Number(category.CategoryID),
      legacySlug: category.UrlCode,
      source: {
        permissionCategoryId: category.PermissionCategoryID,
        archived: category.Archived,
        allowDiscussions: category.AllowDiscussions,
      },
    });
  }
  const discussions = new Map(
    source.discussions.map((row) => [Number(row.DiscussionID), row]),
  );
  const post = (
    id: string,
    topicId: string,
    parentType: string,
    parentId: string,
    sourceRow: LegacyRow,
  ): LegacyRow => ({
    id,
    topicId,
    parentType,
    parentId,
    ...actor(sourceRow.InsertUserID),
    content: publicMarkdown(sourceRow.Body, sourceRow.Format),
    createdAt: sourceRow.DateInserted,
    updatedAt: sourceRow.DateUpdated ?? sourceRow.DateInserted,
    deletedAt: sourceRow.DateDeleted ?? null,
    deletedByMemberId: sourceRow.DeleteUserID
      ? actor(sourceRow.DeleteUserID).authorMemberId
      : null,
  });
  for (const discussion of source.discussions) {
    const id = publicImportId('discussion', discussion.DiscussionID);
    const parent = categoryIds.get(Number(discussion.CategoryID));
    if (!parent) throw new Error('Discussion has excluded category');
    const row = topic(
      id,
      parent,
      discussion.Name,
      discussion.InsertUserID,
      discussion.DateInserted,
      discussion.DateUpdated,
      !!discussion.Closed,
      !!discussion.Announce,
    );
    topicRows.set(id, row);
    add('Topic', 'discussion', discussion.DiscussionID, ['id'], row);
    add(
      'Post',
      'starter',
      discussion.DiscussionID,
      ['id'],
      post(
        publicImportId('starter', discussion.DiscussionID),
        id,
        'TOPIC',
        id,
        discussion,
      ),
    );
  }
  const comments = new Map(
    source.comments.map((row) => [Number(row.CommentID), row]),
  );
  for (const comment of source.comments) {
    if (!discussions.has(Number(comment.DiscussionID)))
      throw new Error('Orphan comment');
    const topicId = publicImportId('discussion', comment.DiscussionID);
    const parent =
      Number(comment.ParentCommentID) > 0
        ? comments.get(Number(comment.ParentCommentID))
        : undefined;
    if (
      Number(comment.ParentCommentID) > 0 &&
      (!parent || Number(parent.DiscussionID) !== Number(comment.DiscussionID))
    )
      throw new Error(`Invalid reply parent ${comment.CommentID}`);
    const seen = new Set([Number(comment.CommentID)]);
    let ancestor = parent;
    while (ancestor) {
      if (seen.has(Number(ancestor.CommentID))) throw new Error('Reply cycle');
      seen.add(Number(ancestor.CommentID));
      ancestor = comments.get(Number(ancestor.ParentCommentID));
    }
    add(
      'Post',
      'comment',
      comment.CommentID,
      ['id'],
      post(
        publicImportId('comment', comment.CommentID),
        topicId,
        parent ? 'POST' : 'TOPIC',
        parent ? publicImportId('comment', parent.CommentID) : topicId,
        comment,
      ),
    );
  }
  for (const row of topicRows.values()) {
    let ancestor: LegacyRow | undefined = row;
    let depth = 0;
    while (ancestor) {
      add(
        'TopicClosure',
        'closure',
        `${row.id}:${ancestor.id}`,
        ['ancestorTopicId', 'descendantTopicId'],
        { ancestorTopicId: ancestor.id, descendantTopicId: row.id, depth },
      );
      ancestor = ancestor.parentTopicId
        ? topicRows.get(ancestor.parentTopicId)
        : undefined;
      depth += 1;
    }
  }
  const usedLocalRoles = new Set(
    entries
      .filter((entry) => entry.table === 'PublicForumCategory')
      .flatMap((entry) => [
        ...entry.row.readRoles,
        ...entry.row.createRoles,
        ...entry.row.replyRoles,
      ])
      .filter((role) => role.startsWith('vanilla-role:')),
  );
  for (const membership of source.memberships) {
    const roleName = `vanilla-role:${membership.RoleID}`;
    if (!usedLocalRoles.has(roleName)) continue;
    const memberId = actor(membership.UserID, false).authorMemberId;
    if (memberId.startsWith('vanilla:')) continue;
    add(
      'PublicForumRoleMember',
      'role-member',
      `${membership.RoleID}:${membership.UserID}`,
      ['roleName', 'memberId'],
      { roleName, memberId },
    );
  }
  let unmappedStates = 0;
  const state = (row: LegacyRow, category = false): void => {
    const memberId = actor(row.UserID, false).authorMemberId;
    if (memberId.startsWith('vanilla:')) {
      unmappedStates += 1;
      return;
    }
    const topicId = publicImportId(
      category ? 'category' : 'discussion',
      category ? row.CategoryID : row.DiscussionID,
    );
    const sourceId = `${category ? 'category' : 'discussion'}:${category ? row.CategoryID : row.DiscussionID}:${row.UserID}`;
    const read = category ? row.DateMarkedRead : row.DateLastViewed;
    if (category ? row.Followed && !row.Unfollow : row.Bookmarked)
      add('TopicWatch', 'watch', sourceId, ['topicId', 'memberId'], {
        topicId,
        memberId,
        createdAt: read ?? topicRows.get(topicId)!.createdAt,
      });
    if (read)
      add('TopicReadState', 'read', sourceId, ['topicId', 'memberId'], {
        topicId,
        memberId,
        lastReadAt: read,
        updatedAt: read,
      });
  };
  source.watches.forEach((row) => state(row));
  source.categoryWatches.forEach((row) => state(row, true));
  const referencedMedia = source.media.filter((media) =>
    /^discussion$/i.test(media.ForeignTable)
      ? discussions.has(Number(media.ForeignID))
      : /^comment$/i.test(media.ForeignTable) &&
        comments.has(Number(media.ForeignID)),
  );
  // Native Media URLs must remain reachable after cutover; stop for a separate attachment-copy plan.
  if (referencedMedia.length)
    throw new Error(
      `Public native media require migration: ${referencedMedia.map((row) => row.MediaID).join(',')}`,
    );
  return {
    entries,
    unmappedAuthorIds: [...unmapped].sort((a, b) => a - b),
    unmappedStates,
  };
}

const IMPORT_TABLES = [
  'Topic',
  'Post',
  'PublicForumCategory',
  'TopicClosure',
  'PublicForumRoleMember',
  'TopicWatch',
  'TopicReadState',
];
/** Validates existing provenance and inserts only new rows in one transaction.
 * @param db Target PostgreSQL connection. @param entries Audited plan. @param apply False for a read-only dry run.
 * @returns Counts, challenge fingerprints and plan digest. @throws Any conflict, source drift, target edit or SQL failure; rolls back all writes.
 */
export async function writePublicImport(
  db: Client,
  entries: PublicImportEntry[],
  apply: boolean,
) {
  await db.query(
    apply
      ? 'BEGIN ISOLATION LEVEL SERIALIZABLE'
      : 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY',
  );
  try {
    if (apply)
      await db.query(
        "SELECT pg_advisory_xact_lock(hashtext('vanilla-public-v1'))",
      );
    const before = await challengeFingerprint(db);
    const existingRecords = (
      await db.query<LegacyRow>(
        'SELECT * FROM forums."PublicForumImportRecord"',
      )
    ).rows;
    const provenance = new Map(
      existingRecords.map((row) => [`${row.entityType}:${row.sourceId}`, row]),
    );
    const newEntries: PublicImportEntry[] = [];
    for (const table of IMPORT_TABLES) {
      const planned = entries.filter((entry) => entry.table === table);
      if (!planned.length) continue;
      const existing = (
        await db.query<LegacyRow>(`SELECT * FROM forums."${table}"`)
      ).rows;
      const keys = planned[0].key;
      const keyOf = (row: LegacyRow): string =>
        canonical(keys.map((key) => row[key]));
      const byKey = new Map(existing.map((row) => [keyOf(row), row]));
      const seen = new Set<string>();
      for (const entry of planned) {
        const key = keyOf(entry.row);
        if (seen.has(key)) throw new Error(`Duplicate planned key in ${table}`);
        seen.add(key);
        const previous = provenance.get(`${entry.type}:${entry.sourceId}`);
        const target = byKey.get(key);
        const hash = publicImportHash(entry.row);
        if (previous) {
          if (
            !target ||
            previous.sourceHash !== hash ||
            previous.targetHash !==
              publicImportHash(
                Object.fromEntries(
                  Object.keys(entry.row).map((name) => [name, target[name]]),
                ),
              )
          )
            throw new Error(
              `Provenance conflict ${entry.type}:${entry.sourceId}; review required`,
            );
        } else {
          if (target)
            throw new Error(
              `Unowned existing ${entry.type}:${entry.sourceId}; refusing overwrite`,
            );
          newEntries.push(entry);
        }
      }
    }
    if (apply) {
      for (const table of IMPORT_TABLES) {
        const planned = newEntries.filter((entry) => entry.table === table);
        if (!planned.length) continue;
        const columns = Object.keys(planned[0].row)
          .map((column) => `"${column}"`)
          .join(',');
        await db.query(
          `INSERT INTO forums."${table}" (${columns}) SELECT ${columns} FROM jsonb_populate_recordset(NULL::forums."${table}",$1::jsonb)`,
          [JSON.stringify(planned.map((entry) => entry.row))],
        );
      }
      const records = newEntries.map((entry) => ({
        entityType: entry.type,
        sourceId: entry.sourceId,
        targetId: publicImportId(entry.type, entry.sourceId),
        sourceHash: publicImportHash(entry.row),
        targetHash: publicImportHash(entry.row),
        createdAt: new Date().toISOString(),
      }));
      if (records.length)
        await db.query(
          'INSERT INTO forums."PublicForumImportRecord" SELECT * FROM jsonb_populate_recordset(NULL::forums."PublicForumImportRecord",$1::jsonb)',
          [JSON.stringify(records)],
        );
    }
    const after = await challengeFingerprint(db);
    if (canonical(before) !== canonical(after))
      throw new Error('Challenge data fingerprint changed; rolling back');
    await db.query('COMMIT');
    return {
      applied: apply,
      planned: entries.length,
      inserted: apply ? newEntries.length : 0,
      pending: newEntries.length,
      existing: entries.length - newEntries.length,
      planHash: publicImportHash(entries),
      challengeBefore: before,
      challengeAfter: after,
      counts: Object.fromEntries(
        IMPORT_TABLES.map((table) => [
          table,
          entries.filter((entry) => entry.table === table).length,
        ]),
      ),
    };
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}
/** Computes content fingerprints covering every existing challenge topic and its related rows.
 * @param db Transaction connection. @returns Per-table count and hash. @throws SQL errors.
 */
export async function challengeFingerprint(
  db: Client,
): Promise<Record<string, { count: number; hash: string }>> {
  const output: Record<string, { count: number; hash: string }> = {};
  const scopes: Record<string, string> = {
    Topic: 'id',
    Post: '"topicId"',
    TopicWatch: '"topicId"',
    TopicReadState: '"topicId"',
    TopicClosure: '"descendantTopicId"',
  };
  for (const [table, column] of Object.entries(scopes)) {
    const result = (
      await db.query<{ value: LegacyRow }>(
        `SELECT to_jsonb(t) AS value FROM forums."${table}" t WHERE t.${column} IN (SELECT "descendantTopicId" FROM forums."TopicClosure" c JOIN forums."Topic" root ON root.id=c."ancestorTopicId" WHERE root."challengeId" IS NOT NULL)`,
      )
    ).rows
      .map((row) => canonical(row.value))
      .sort();
    output[table] = { count: result.length, hash: publicImportHash(result) };
  }
  return output;
}
