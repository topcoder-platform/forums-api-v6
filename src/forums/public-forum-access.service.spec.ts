import { DbService } from '../db/db.service';
import { ForumsPrincipal } from './forums-access.types';
import { PublicForumAccessService } from './public-forum-access.service';

const guest: ForumsPrincipal = {
  memberId: null,
  roles: [],
  scopes: [],
  isAdmin: false,
  isMachine: false,
};
const member: ForumsPrincipal = { ...guest, memberId: '42' };
/** Builds isolated inherited ACL fixtures. @param rules Ancestor rows. @param roles Imported local grants.
 * @returns Real ACL service with database fixtures. @throws Never.
 */
function service(rules: unknown[], roles: string[] = []) {
  return new PublicForumAccessService({
    $queryRaw: jest.fn().mockResolvedValue(rules),
    publicForumRoleMember: {
      findMany: jest
        .fn()
        .mockResolvedValue(roles.map((roleName) => ({ roleName }))),
    },
  } as unknown as DbService);
}
const open = {
  topicId: 'category',
  depth: 1,
  readRoles: ['$public'],
  createRoles: ['$authenticated'],
  replyRoles: ['$authenticated'],
  displayAs: 'Discussions',
};

describe('public category ACLs', () => {
  it('allows anonymous reading and forbids all guest participation', async () => {
    expect(await service([open]).decide(guest, 'thread')).toMatchObject({
      view: true,
      create: false,
      reply: false,
    });
    expect(
      await service([{ ...open, depth: 0 }]).decide(guest, 'category'),
    ).toMatchObject({ view: true, create: false, reply: false });
  });
  it('permits members to start threads only in discussion categories and reply only in threads', async () => {
    expect(await service([open]).decide(member, 'thread')).toMatchObject({
      view: true,
      create: false,
      reply: true,
    });
    expect(await service([open]).decide(member, 'category')).toMatchObject({
      create: true,
      reply: false,
    });
    expect(
      await service([{ ...open, displayAs: 'Categories' }]).decide(
        member,
        'category',
      ),
    ).toMatchObject({ create: false, reply: false });
  });
  it('requires every ancestor ACL and does not treat local membership as a global role', async () => {
    const restricted = { ...open, readRoles: ['reviewer'] };
    const ancestor = {
      ...open,
      topicId: 'private',
      depth: 2,
      readRoles: ['vanilla-role:71'],
    };
    expect(
      (
        await service([restricted, ancestor], ['vanilla-role:71']).decide(
          member,
          'thread',
        )
      ).view,
    ).toBe(false);
    expect(
      (
        await service([restricted, ancestor]).decide(
          { ...member, roles: ['reviewer'] },
          'thread',
        )
      ).view,
    ).toBe(false);
    expect(
      (
        await service([restricted, ancestor], ['vanilla-role:71']).decide(
          { ...member, roles: ['reviewer'] },
          'thread',
        )
      ).view,
    ).toBe(true);
  });
  it('supports read-only custom roles and fails closed on empty grant lists', async () => {
    expect(
      await service([
        { ...open, readRoles: ['auditor'], replyRoles: [] },
      ]).decide({ ...member, roles: ['auditor'] }, 'thread'),
    ).toMatchObject({ view: true, reply: false });
    expect(
      (await service([{ ...open, readRoles: [] }]).decide(member, 'thread'))
        .view,
    ).toBe(false);
  });
  it('leaves challenge restrictions to the existing policy and propagates database failures', async () => {
    expect((await service([]).decide(guest, 'challenge')).managed).toBe(false);
    const failing = new PublicForumAccessService({
      $queryRaw: jest.fn().mockRejectedValue(new Error('offline')),
    } as unknown as DbService);
    await expect(failing.decide(member, 'thread')).rejects.toThrow('offline');
  });
});
