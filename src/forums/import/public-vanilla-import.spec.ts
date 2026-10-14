import {
  publicCategories,
  publicImportId,
  publicMarkdown,
  planPublicImport,
  PublicImportSnapshot,
} from './public-vanilla-import';

const date = new Date('2020-01-01T00:00:00Z');
/** Creates a minimal public/private migration source. @returns Fixture. @throws Never. */
function fixture(): PublicImportSnapshot {
  return {
    categories: [
      {
        CategoryID: 1,
        ParentCategoryID: -1,
        Name: 'General',
        DisplayAs: 'Categories',
        Sort: 1,
        PermissionCategoryID: 1,
        InsertUserID: 1,
        DateInserted: date,
        DateUpdated: date,
        UrlCode: 'general',
      },
      {
        CategoryID: 2,
        ParentCategoryID: 1,
        Name: 'Reviewer Discussions',
        DisplayAs: 'Discussions',
        Sort: 2,
        PermissionCategoryID: 1,
        InsertUserID: 1,
        DateInserted: date,
        DateUpdated: date,
        UrlCode: 'reviewers',
      },
    ],
    roles: [{ RoleID: 2, Name: 'Guest', Type: 'guest' }],
    permissions: [{ JunctionID: 1, RoleID: 2, 'Vanilla.Discussions.View': 1 }],
    discussions: [
      {
        DiscussionID: 10,
        CategoryID: 2,
        Name: 'Review',
        Body: '@member ![file](https://cdn.filestackcontent.com/file)',
        Format: 'Markdown',
        InsertUserID: 1,
        DateInserted: date,
        DateUpdated: date,
      },
    ],
    comments: [
      {
        CommentID: 20,
        DiscussionID: 10,
        Body: 'Reply',
        Format: 'Markdown',
        InsertUserID: 1,
        DateInserted: date,
        DateUpdated: date,
        ParentCommentID: 0,
      },
    ],
    users: [{ UserID: 1, Name: 'missing' }],
    memberships: [],
    watches: [],
    categoryWatches: [],
    media: [],
  };
}

describe('insert-only public Vanilla planning', () => {
  it('excludes challenge and group descendants even if a child has no group', () => {
    expect(
      publicCategories([
        { CategoryID: -1 },
        { CategoryID: 1, ParentCategoryID: -1, UrlCode: 'general' },
        { CategoryID: 2, ParentCategoryID: -1, UrlCode: 'challenges-forums' },
        { CategoryID: 3, ParentCategoryID: 2 },
        { CategoryID: 4, ParentCategoryID: 1, GroupID: 3 },
        { CategoryID: 5, ParentCategoryID: 4 },
      ]).map((row) => row.CategoryID),
    ).toEqual([1]);
    expect(() =>
      publicCategories([{ CategoryID: 1, ParentCategoryID: 9 }]),
    ).toThrow('Missing category ancestor');
  });
  it('preserves every post, Markdown attachment/mention and anonymous legacy author without granting identity access', () => {
    const plan = planPublicImport(fixture(), new Map());
    expect(plan.entries.filter((row) => row.table === 'Post')).toHaveLength(2);
    expect(
      plan.entries.find((row) => row.type === 'starter')?.row,
    ).toMatchObject({
      authorMemberId: 'vanilla:1',
      authorHandle: 'missing',
      content: fixture().discussions[0].Body,
    });
    expect(
      plan.entries.find(
        (row) => row.type === 'category' && row.sourceId === '2',
      )?.row.readRoles,
    ).toEqual(['reviewer']);
    expect(
      plan.entries.filter(
        (row) =>
          row.type === 'closure' &&
          row.row.descendantTopicId === publicImportId('discussion', 10),
      ),
    ).toHaveLength(3);
  });
  it('rejects cross-thread reply parents and native media that have not been copied', () => {
    const source = fixture();
    source.comments[0].ParentCommentID = 999;
    expect(() => planPublicImport(source, new Map())).toThrow(
      'Invalid reply parent',
    );
    const media = fixture();
    media.media.push({ MediaID: 1, ForeignTable: 'discussion', ForeignID: 10 });
    expect(() => planPublicImport(media, new Map())).toThrow(
      'native media require migration',
    );
  });
  it('converts Quill links and retains Markdown unchanged, rejecting unsupported formats', () => {
    expect(
      publicMarkdown(
        '[{"insert":"Hi "},{"insert":"link","attributes":{"link":"https://example.org"}}]',
        'Rich',
      ),
    ).toBe('Hi [link](<https://example.org>)');
    expect(
      publicMarkdown('**Hi**\n![image](https://example.org/x)', 'Markdown'),
    ).toBe('**Hi**\n![image](https://example.org/x)');
    expect(() => publicMarkdown('<b>html</b>', 'Html')).toThrow('Unsupported');
  });
});
