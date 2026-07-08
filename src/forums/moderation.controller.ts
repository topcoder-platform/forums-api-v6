import { Controller, Delete, Param, Put } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Scopes } from '../auth/decorators/scopes.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { JwtUser } from '../auth/jwt.service';
import { FORUMS_SCOPE_MODERATE } from '../auth/scope-mappings';
import { FORUMS_ADMIN_ROLE } from './forums-access.types';
import {
  IpBanParamDto,
  MemberBanParamDto,
  TopicModerationParamDto,
} from './dto/forums-moderation.dto';
import {
  IpBanStateDto,
  MemberBanStateDto,
  TopicLockStateDto,
} from './dto/forums-moderation-response.dto';
import { ForumsModerationService } from './forums-moderation.service';

const MODERATION_ACCESS_DESCRIPTION =
  'Human moderation is administrator-only. M2M callers must use `moderate:forums`. Challenge copilots do not gain moderation-endpoint access.';

/**
 * Controller for forums moderation management routes.
 *
 * Routes are mounted under the global `/v6/forums` prefix and expose topic
 * lock management plus active member/IP ban management. The route guard
 * enforces administrator roles for human tokens and `moderate:forums` for M2M
 * tokens.
 */
@ApiTags('Forums moderation')
@ApiBearerAuth()
@Controller('moderation')
export class ModerationController {
  /**
   * Creates a moderation controller.
   *
   * @param moderationService Service that manages topic locks and ban rows.
   * @throws Does not throw directly; dependencies are resolved by Nest.
   */
  constructor(private readonly moderationService: ForumsModerationService) {}

  /**
   * Locks a topic.
   *
   * @param params Route parameters containing the topic id.
   * @param user Authenticated moderator token payload.
   * @returns Topic lock state after the operation.
   * @throws UnauthorizedException when no authenticated token is present.
   * @throws ForbiddenException when the caller is neither a human admin nor scoped M2M moderator.
   * @throws NotFoundException when the topic is missing, deleted, or hidden by a deleted ancestor.
   */
  @Put('topics/:topicId/lock')
  @Roles(FORUMS_ADMIN_ROLE)
  @Scopes(FORUMS_SCOPE_MODERATE)
  @ApiOperation({
    summary: 'Lock a forum topic',
    description: `${MODERATION_ACCESS_DESCRIPTION} Locks an active topic for future discussion mutations without applying forum visibility restrictions.`,
  })
  @ApiParam({ name: 'topicId', description: 'Topic id to lock.' })
  @ApiResponse({
    status: 200,
    description: 'Topic lock state.',
    type: TopicLockStateDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid topic id.' })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({
    description:
      'Administrator role required for human callers; `moderate:forums` required for M2M callers. Challenge copilots receive 403.',
  })
  @ApiNotFoundResponse({
    description:
      'Topic not found, soft-deleted, or hidden by a deleted ancestor.',
  })
  lockTopic(
    @Param() params: TopicModerationParamDto,
    @CurrentUser() user?: JwtUser,
  ): Promise<TopicLockStateDto> {
    return this.moderationService.lockTopic(params.topicId, user);
  }

  /**
   * Unlocks a topic.
   *
   * @param params Route parameters containing the topic id.
   * @param user Authenticated moderator token payload.
   * @returns Topic lock state after the operation.
   * @throws UnauthorizedException when no authenticated token is present.
   * @throws ForbiddenException when the caller is neither a human admin nor scoped M2M moderator.
   * @throws NotFoundException when the topic is missing, deleted, or hidden by a deleted ancestor.
   */
  @Delete('topics/:topicId/lock')
  @Roles(FORUMS_ADMIN_ROLE)
  @Scopes(FORUMS_SCOPE_MODERATE)
  @ApiOperation({
    summary: 'Unlock a forum topic',
    description: `${MODERATION_ACCESS_DESCRIPTION} Unlocks an active topic for future discussion mutations without applying forum visibility restrictions.`,
  })
  @ApiParam({ name: 'topicId', description: 'Topic id to unlock.' })
  @ApiResponse({
    status: 200,
    description: 'Topic lock state.',
    type: TopicLockStateDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid topic id.' })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({
    description:
      'Administrator role required for human callers; `moderate:forums` required for M2M callers. Challenge copilots receive 403.',
  })
  @ApiNotFoundResponse({
    description:
      'Topic not found, soft-deleted, or hidden by a deleted ancestor.',
  })
  unlockTopic(
    @Param() params: TopicModerationParamDto,
    @CurrentUser() user?: JwtUser,
  ): Promise<TopicLockStateDto> {
    return this.moderationService.unlockTopic(params.topicId, user);
  }

  /**
   * Bans a member from forum runtime access.
   *
   * @param params Route parameters containing the member id.
   * @param user Authenticated moderator token payload.
   * @returns Member ban state after the operation.
   * @throws BadRequestException when the member id is invalid.
   * @throws UnauthorizedException when no authenticated token is present.
   * @throws ForbiddenException when the caller is neither a human admin nor scoped M2M moderator.
   */
  @Put('member-bans/:memberId')
  @Roles(FORUMS_ADMIN_ROLE)
  @Scopes(FORUMS_SCOPE_MODERATE)
  @ApiOperation({
    summary: 'Ban a forums member',
    description: `${MODERATION_ACCESS_DESCRIPTION} Creates an active member ban when one does not already exist.`,
  })
  @ApiParam({ name: 'memberId', description: 'Member id to ban.' })
  @ApiResponse({
    status: 200,
    description: 'Member ban state.',
    type: MemberBanStateDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid member id.' })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({
    description:
      'Administrator role required for human callers; `moderate:forums` required for M2M callers. Challenge copilots receive 403.',
  })
  banMember(
    @Param() params: MemberBanParamDto,
    @CurrentUser() user?: JwtUser,
  ): Promise<MemberBanStateDto> {
    return this.moderationService.banMember(params.memberId, user);
  }

  /**
   * Removes the active ban for a member.
   *
   * @param params Route parameters containing the member id.
   * @param user Authenticated moderator token payload.
   * @returns Member ban state after the operation.
   * @throws BadRequestException when the member id is invalid.
   * @throws UnauthorizedException when no authenticated token is present.
   * @throws ForbiddenException when the caller is neither a human admin nor scoped M2M moderator.
   * @throws NotFoundException when no member ban row exists for the target.
   */
  @Delete('member-bans/:memberId')
  @Roles(FORUMS_ADMIN_ROLE)
  @Scopes(FORUMS_SCOPE_MODERATE)
  @ApiOperation({
    summary: 'Unban a forums member',
    description: `${MODERATION_ACCESS_DESCRIPTION} Removes the active member ban when present and returns the resulting ban state.`,
  })
  @ApiParam({ name: 'memberId', description: 'Member id to unban.' })
  @ApiResponse({
    status: 200,
    description: 'Member ban state.',
    type: MemberBanStateDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid member id.' })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({
    description:
      'Administrator role required for human callers; `moderate:forums` required for M2M callers. Challenge copilots receive 403.',
  })
  @ApiNotFoundResponse({ description: 'Member ban not found.' })
  unbanMember(
    @Param() params: MemberBanParamDto,
    @CurrentUser() user?: JwtUser,
  ): Promise<MemberBanStateDto> {
    return this.moderationService.unbanMember(params.memberId, user);
  }

  /**
   * Bans an exact bare IP host from forum runtime access.
   *
   * @param params Route parameters containing the IP address.
   * @param user Authenticated moderator token payload.
   * @returns IP ban state after the operation.
   * @throws BadRequestException when the IP target is not an exact bare host.
   * @throws UnauthorizedException when no authenticated token is present.
   * @throws ForbiddenException when the caller is neither a human admin nor scoped M2M moderator.
   */
  @Put('ip-bans/:ipAddress')
  @Roles(FORUMS_ADMIN_ROLE)
  @Scopes(FORUMS_SCOPE_MODERATE)
  @ApiOperation({
    summary: 'Ban a forums client IP',
    description: `${MODERATION_ACCESS_DESCRIPTION} Creates an active IP ban for an exact bare IPv4 or IPv6 host. CIDR, wildcard, comma-delimited, bracketed IPv6, host:port, quoted, and invalid text values are rejected.`,
  })
  @ApiParam({
    name: 'ipAddress',
    description:
      'Exact bare IPv4 or IPv6 host value only. CIDR, wildcards, comma-delimited values, bracketed IPv6, host:port, quoted values, and invalid text are rejected.',
  })
  @ApiResponse({
    status: 200,
    description: 'IP ban state.',
    type: IpBanStateDto,
  })
  @ApiBadRequestResponse({
    description:
      'Invalid IP target; only exact bare IPv4 or IPv6 hosts are accepted.',
  })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({
    description:
      'Administrator role required for human callers; `moderate:forums` required for M2M callers. Challenge copilots receive 403.',
  })
  banIpAddress(
    @Param() params: IpBanParamDto,
    @CurrentUser() user?: JwtUser,
  ): Promise<IpBanStateDto> {
    return this.moderationService.banIpAddress(params.ipAddress, user);
  }

  /**
   * Removes the active ban for an exact bare IP host.
   *
   * @param params Route parameters containing the IP address.
   * @param user Authenticated moderator token payload.
   * @returns IP ban state after the operation.
   * @throws BadRequestException when the IP target is not an exact bare host.
   * @throws UnauthorizedException when no authenticated token is present.
   * @throws ForbiddenException when the caller is neither a human admin nor scoped M2M moderator.
   * @throws NotFoundException when no IP ban row exists for the target.
   */
  @Delete('ip-bans/:ipAddress')
  @Roles(FORUMS_ADMIN_ROLE)
  @Scopes(FORUMS_SCOPE_MODERATE)
  @ApiOperation({
    summary: 'Unban a forums client IP',
    description: `${MODERATION_ACCESS_DESCRIPTION} Removes the active IP ban for an exact bare IPv4 or IPv6 host when present. CIDR, wildcard, comma-delimited, bracketed IPv6, host:port, quoted, and invalid text values are rejected.`,
  })
  @ApiParam({
    name: 'ipAddress',
    description:
      'Exact bare IPv4 or IPv6 host value only. CIDR, wildcards, comma-delimited values, bracketed IPv6, host:port, quoted values, and invalid text are rejected.',
  })
  @ApiResponse({
    status: 200,
    description: 'IP ban state.',
    type: IpBanStateDto,
  })
  @ApiBadRequestResponse({
    description:
      'Invalid IP target; only exact bare IPv4 or IPv6 hosts are accepted.',
  })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({
    description:
      'Administrator role required for human callers; `moderate:forums` required for M2M callers. Challenge copilots receive 403.',
  })
  @ApiNotFoundResponse({ description: 'IP ban not found.' })
  unbanIpAddress(
    @Param() params: IpBanParamDto,
    @CurrentUser() user?: JwtUser,
  ): Promise<IpBanStateDto> {
    return this.moderationService.unbanIpAddress(params.ipAddress, user);
  }
}
