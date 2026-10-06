import { Injectable } from '@nestjs/common';
import { PublicForumCategory } from '../../prisma/generated/client';
import { DbService } from '../db/db.service';
import { ForumsPrincipal } from './forums-access.types';

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
      return {
        view: true,
        create: true,
        reply: true,
        category: false,
        managed: false,
      };
    const roles = new Set(principal.roles);
    if (principal.memberId) {
      const memberships = await this.db.publicForumRoleMember.findMany({
        where: { memberId: principal.memberId },
      });
      memberships.forEach((row) => roles.add(row.roleName));
    }
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
