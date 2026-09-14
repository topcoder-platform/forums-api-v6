import { Body, Controller, Delete, Param, Patch, Put } from '@nestjs/common';
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
import {
  AUTHENTICATED_USER_ROLE,
  Roles,
} from '../auth/decorators/roles.decorator';
import { ClientIp } from '../auth/decorators/client-ip.decorator';
import { Scopes } from '../auth/decorators/scopes.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { JwtUser } from '../auth/jwt.service';
import {
  FORUMS_SCOPE_DELETE_POST,
  FORUMS_SCOPE_UPDATE_POST,
} from '../auth/scope-mappings';
import {
  SetPostReactionDto,
  UpdatePostDto,
} from './dto/forums-command.dto';
import {
  ForumPostCommandResponseDto,
  ForumPostReactionStateDto,
} from './dto/forums-command-response.dto';
import { ForumsCommandService } from './forums-command.service';

/**
 * Controller for command-side post mutation routes.
 *
 * The controller exposes update, delete, and human-member reaction commands.
 * Topic detail embeds post trees under `read:forums-topics`;
 * `read:forums-posts` remains reserved for future post-specific read routes.
 * Trusted client-IP context is forwarded as a string for runtime ban checks.
 */
@ApiTags('Forums posts')
@ApiBearerAuth()
@Controller('posts')
export class PostsController {
  /**
   * Creates a posts controller.
   *
   * @param commandService Service that performs transactional forum writes.
   * @throws Does not throw directly; dependencies are resolved by Nest.
   */
  constructor(private readonly commandService: ForumsCommandService) {}

  /**
   * Adds or switches the authenticated member's post reaction.
   *
   * @param postId Post id from the route.
   * @param dto Thumbs-up or thumbs-down reaction value.
   * @param user Authenticated human member token payload.
   * @param trustedClientIp Optional trusted client IP resolved at the HTTP boundary.
   * @returns The member's resulting reaction and shared aggregate counts.
   * @throws UnauthorizedException when no authenticated human member is present.
   * @throws ForbiddenException when an active ban or post visibility denies access.
   * @throws BadRequestException when the reaction value is invalid.
   * @throws NotFoundException when the post or active topic is missing or deleted.
   */
  @Put(':postId/reaction')
  @Roles(AUTHENTICATED_USER_ROLE)
  @ApiOperation({
    summary: 'Set the current member forum post reaction',
    description:
      'Human-member command route that adds a thumbs-up or thumbs-down reaction, or replaces the member\'s existing reaction with the requested value. Reactions require inherited post visibility and pass active member and trusted exact-IP ban checks. Locked topics remain reactable because reactions do not modify discussion content.',
  })
  @ApiParam({ name: 'postId', description: 'Post id.' })
  @ApiResponse({
    status: 200,
    description: 'Post reaction added or replaced.',
    type: ForumPostReactionStateDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid reaction body.' })
  @ApiUnauthorizedResponse({
    description: 'Authenticated human member token required.',
  })
  @ApiForbiddenResponse({
    description: 'Active forums ban or insufficient post visibility.',
  })
  @ApiNotFoundResponse({ description: 'Post or active topic not found.' })
  setPostReaction(
    @Param('postId') postId: string,
    @Body() dto: SetPostReactionDto,
    @CurrentUser() user?: JwtUser,
    @ClientIp() trustedClientIp?: string,
  ): Promise<ForumPostReactionStateDto> {
    return this.commandService.setPostReaction(
      postId,
      dto,
      user,
      trustedClientIp,
    );
  }

  /**
   * Removes the authenticated member's current post reaction.
   *
   * @param postId Post id from the route.
   * @param user Authenticated human member token payload.
   * @param trustedClientIp Optional trusted client IP resolved at the HTTP boundary.
   * @returns Null member reaction and the remaining shared aggregate counts.
   * @throws UnauthorizedException when no authenticated human member is present.
   * @throws ForbiddenException when an active ban or post visibility denies access.
   * @throws NotFoundException when the post or active topic is missing or deleted.
   */
  @Delete(':postId/reaction')
  @Roles(AUTHENTICATED_USER_ROLE)
  @ApiOperation({
    summary: 'Remove the current member forum post reaction',
    description:
      'Human-member command route that idempotently removes the caller\'s reaction. It applies inherited post visibility plus active member and trusted exact-IP ban checks. Locked topics remain reactable because reactions do not modify discussion content.',
  })
  @ApiParam({ name: 'postId', description: 'Post id.' })
  @ApiResponse({
    status: 200,
    description: 'Post reaction removed or already absent.',
    type: ForumPostReactionStateDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authenticated human member token required.',
  })
  @ApiForbiddenResponse({
    description: 'Active forums ban or insufficient post visibility.',
  })
  @ApiNotFoundResponse({ description: 'Post or active topic not found.' })
  removePostReaction(
    @Param('postId') postId: string,
    @CurrentUser() user?: JwtUser,
    @ClientIp() trustedClientIp?: string,
  ): Promise<ForumPostReactionStateDto> {
    return this.commandService.removePostReaction(
      postId,
      user,
      trustedClientIp,
    );
  }

  /**
   * Updates an existing post.
   *
   * @param postId Post id from the route.
   * @param dto Updated post content.
   * @param user Authenticated token payload for the acting member.
   * @param trustedClientIp Optional trusted client IP resolved at the HTTP boundary.
   * @returns The updated post row.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws ForbiddenException when the token lacks update access, an active ban applies, or the topic is locked.
   * @throws BadRequestException when the body is invalid.
   * @throws NotFoundException when the post or active topic is missing.
   */
  @Patch(':postId')
  @Roles(AUTHENTICATED_USER_ROLE)
  @Scopes(FORUMS_SCOPE_UPDATE_POST)
  @ApiOperation({
    summary: 'Update a forum post',
    description:
      'Command route for post content updates. Post updates require an authenticated member token or `update:forums-posts`, then pass inherited topic visibility, ownership, and elevated challenge-access policy checks. Active member bans and trusted exact-IP bans return 403 before writes. Locked owning topics reject updates unless the caller is an administrator or eligible challenge copilot.',
  })
  @ApiParam({ name: 'postId', description: 'Post id.' })
  @ApiResponse({
    status: 200,
    description: 'Post updated.',
    type: ForumPostCommandResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid post body.' })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({
    description: 'Insufficient forums access, active ban, or locked topic.',
  })
  @ApiNotFoundResponse({ description: 'Post or active topic not found.' })
  updatePost(
    @Param('postId') postId: string,
    @Body() dto: UpdatePostDto,
    @CurrentUser() user?: JwtUser,
    @ClientIp() trustedClientIp?: string,
  ): Promise<ForumPostCommandResponseDto> {
    return this.commandService.updatePost(postId, dto, user, trustedClientIp);
  }

  /**
   * Soft-deletes an existing post and blanks its content.
   *
   * @param postId Post id from the route.
   * @param user Authenticated token payload for the acting member.
   * @param trustedClientIp Optional trusted client IP resolved at the HTTP boundary.
   * @returns The deleted post row with null content.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws ForbiddenException when the token lacks delete access, an active ban applies, or the topic is locked.
   * @throws NotFoundException when the post or active topic is missing.
   */
  @Delete(':postId')
  @Roles(AUTHENTICATED_USER_ROLE)
  @Scopes(FORUMS_SCOPE_DELETE_POST)
  @ApiOperation({
    summary: 'Delete a forum post placeholder',
    description:
      'Command route for post soft deletion. Human deletion is administrator-only; M2M callers require `delete:forums-posts`. Authors and challenge copilots may edit eligible posts but cannot delete them. Active member bans and trusted exact-IP bans return 403 before writes, and locked owning topics reject non-administrator deletion.',
  })
  @ApiParam({ name: 'postId', description: 'Post id.' })
  @ApiResponse({
    status: 200,
    description: 'Post soft-deleted.',
    type: ForumPostCommandResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({
    description: 'Insufficient forums access, active ban, or locked topic.',
  })
  @ApiNotFoundResponse({ description: 'Post or active topic not found.' })
  deletePost(
    @Param('postId') postId: string,
    @CurrentUser() user?: JwtUser,
    @ClientIp() trustedClientIp?: string,
  ): Promise<ForumPostCommandResponseDto> {
    return this.commandService.deletePost(postId, user, trustedClientIp);
  }
}
