import { Injectable } from '@nestjs/common';
import { Prisma, PublicForumCategory } from '../../prisma/generated/client';
import { DbService } from '../db/db.service';
import { ForumsPrincipal } from './forums-access.types';

/** Only ACL fields are loaded; migration provenance must not be copied per ancestor. */
type CategoryRules = Pick<
  PublicForumCategory,
  'topicId' | 'displayAs' | 'readRoles' | 'createRoles' | 'replyRoles'
>;

export interface PublicForumAccess {
  view: boolean;
  create: boolean;
  reply: boolean;
  category: boolean;
  managed: boolean;
}

/** Enforces public category ACLs for every read, command and notification.
 * Rules are inherited through TopicClosure; each ancestor must permit reading.
 * Vanilla-only memberships are scoped to forums and cannot elevate identity roles.
 */
@Injectable()
export class PublicForumAccessService {
  /** @param db Forums database used to read category ACLs and imported memberships. @throws Never. */
  constructor(private readonly db: DbService) {}

  /** Evaluates inherited read rules and the nearest category's posting rules.
   * @param principal Validated member, machine, or anonymous reader.
   * @param topicId Existing topic being authorized.
   * @returns Public access gates; unmanaged challenge topics retain their existing policy.
   * @throws Database errors; callers must fail closed.
   */
  async decide(
    principal: ForumsPrincipal,
    topicId: string,
  ): Promise<PublicForumAccess> {
    const categories = await this.db.$queryRaw<
      (PublicForumCategory & { depth: number })[]
    >`
      SELECT category.*, closure.depth FROM "forums"."PublicForumCategory" category
      JOIN "forums"."TopicClosure" closure ON closure."ancestorTopicId" = category."topicId"
      WHERE closure."descendantTopicId" = ${topicId} ORDER BY closure.depth ASC`;
    if (!categories.length)
      return this.evaluate(principal, topicId, [], new Set());
    const roles = await this.roles(principal);
    return this.evaluate(principal, topicId, categories, roles);
  }

  /** Evaluates catalog ACLs with one ancestor query and one membership query.
   * @param principal Reader identity. @param topicIds Existing category topic IDs.
   * @returns Access decisions keyed by topic ID; inherited rules match decide().
   * @throws Database errors; callers must fail closed.
   */
  async decideMany(
    principal: ForumsPrincipal,
    topicIds: string[],
  ): Promise<Map<string, PublicForumAccess>> {
    if (!topicIds.length) return new Map();
    const [categories, roles] = await Promise.all([
      this.db.$queryRaw<
        (CategoryRules & { descendantTopicId: string })[]
      >(Prisma.sql`
        SELECT category."topicId", category."displayAs", category."readRoles", category."createRoles", category."replyRoles", closure."descendantTopicId"
        FROM "forums"."PublicForumCategory" category
        JOIN "forums"."TopicClosure" closure ON closure."ancestorTopicId" = category."topicId"
        WHERE closure."descendantTopicId" IN (${Prisma.join(topicIds)})
        ORDER BY closure.depth ASC`),
      this.roles(principal),
    ]);
    const grouped = new Map<string, CategoryRules[]>();
    for (const category of categories) {
      const group = grouped.get(category.descendantTopicId) ?? [];
      group.push(category);
      grouped.set(category.descendantTopicId, group);
    }
    return new Map(
      topicIds.map((id) => [
        id,
        this.evaluate(principal, id, grouped.get(id) ?? [], roles),
      ]),
    );
  }

  /** Loads forum-only memberships once without elevating identity roles.
   * @param principal Reader identity. @returns Identity plus imported forum roles.
   * @throws Prisma errors when the membership read fails.
   */
  private async roles(principal: ForumsPrincipal): Promise<Set<string>> {
    const roles = new Set(principal.roles);
    if (principal.memberId) {
      const memberships = await this.db.publicForumRoleMember.findMany({
        where: { memberId: principal.memberId },
      });
      memberships.forEach((row) => roles.add(row.roleName));
    }
    return roles;
  }

  /** Applies inherited category rules to already-loaded facts.
   * @param principal Reader. @param topicId Target. @param categories Nearest-first category ancestors.
   * @param roles Identity and imported forum roles. @returns Read/create/reply decisions.
   * @throws Never; this is an in-memory policy evaluation.
   */
  private evaluate(
    principal: ForumsPrincipal,
    topicId: string,
    categories: CategoryRules[],
    roles: Set<string>,
  ): PublicForumAccess {
    if (!categories.length)
      return {
        view: true,
        create: true,
        reply: true,
        category: false,
        managed: false,
      };
    const elevated = principal.isAdmin || principal.isMachine;
    const matches = (allowed: string[]): boolean =>
      elevated ||
      allowed.some(
        (role) =>
          role === '$public' ||
          (role === '$authenticated' && !!principal.memberId) ||
          roles.has(role),
      );
    const view = categories.every((category) => matches(category.readRoles));
    const nearest = categories[0];
    const category = nearest.topicId === topicId;
    const authenticated = !!principal.memberId || principal.isMachine;
    return {
      view,
      category,
      managed: true,
      create:
        view &&
        authenticated &&
        category &&
        nearest.displayAs === 'Discussions' &&
        matches(nearest.createRoles),
      reply: view && authenticated && !category && matches(nearest.replyRoles),
    };
  }
}
