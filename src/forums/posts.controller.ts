import { Body, Controller, Delete, Param, Patch } from '@nestjs/common';
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
import { Scopes } from '../auth/decorators/scopes.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { JwtUser } from '../auth/jwt.service';
import {
  FORUMS_SCOPE_DELETE_POST,
  FORUMS_SCOPE_UPDATE_POST,
} from '../auth/scope-mappings';
import { UpdatePostDto } from './dto/forums-command.dto';
import { ForumPostCommandResponseDto } from './dto/forums-command-response.dto';
import { ForumsCommandService } from './forums-command.service';

/**
 * Controller for command-side post mutation routes.
 *
 * The controller exposes only update and delete commands. Topic detail embeds
 * post trees under `read:forums-topics`; `read:forums-posts` remains reserved
 * for future post-specific read routes.
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
   * Updates an existing post.
   *
   * @param postId Post id from the route.
   * @param dto Updated post content.
   * @param user Authenticated token payload for the acting member.
   * @returns The updated post row.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws ForbiddenException when the token lacks update access.
   * @throws BadRequestException when the body is invalid.
   * @throws NotFoundException when the post or active topic is missing.
   */
  @Patch(':postId')
  @Roles(AUTHENTICATED_USER_ROLE)
  @Scopes(FORUMS_SCOPE_UPDATE_POST)
  @ApiOperation({
    summary: 'Update a forum post',
    description:
      'Command route for post content updates. Post updates require an authenticated member token or `update:forums-posts`, then pass inherited topic visibility, ownership, and elevated challenge-access policy checks.',
  })
  @ApiParam({ name: 'postId', description: 'Post id.' })
  @ApiResponse({
    status: 200,
    description: 'Post updated.',
    type: ForumPostCommandResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid post body.' })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({ description: 'Insufficient forums access.' })
  @ApiNotFoundResponse({ description: 'Post or active topic not found.' })
  updatePost(
    @Param('postId') postId: string,
    @Body() dto: UpdatePostDto,
    @CurrentUser() user?: JwtUser,
  ): Promise<ForumPostCommandResponseDto> {
    return this.commandService.updatePost(postId, dto, user);
  }

  /**
   * Soft-deletes an existing post and blanks its content.
   *
   * @param postId Post id from the route.
   * @param user Authenticated token payload for the acting member.
   * @returns The deleted post row with null content.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws ForbiddenException when the token lacks delete access.
   * @throws NotFoundException when the post or active topic is missing.
   */
  @Delete(':postId')
  @Roles(AUTHENTICATED_USER_ROLE)
  @Scopes(FORUMS_SCOPE_DELETE_POST)
  @ApiOperation({
    summary: 'Delete a forum post placeholder',
    description:
      'Command route for post soft deletion. Post deletion requires an authenticated member token or `delete:forums-posts`, then passes inherited topic visibility, ownership, and elevated challenge-access policy checks.',
  })
  @ApiParam({ name: 'postId', description: 'Post id.' })
  @ApiResponse({
    status: 200,
    description: 'Post soft-deleted.',
    type: ForumPostCommandResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({ description: 'Insufficient forums access.' })
  @ApiNotFoundResponse({ description: 'Post or active topic not found.' })
  deletePost(
    @Param('postId') postId: string,
    @CurrentUser() user?: JwtUser,
  ): Promise<ForumPostCommandResponseDto> {
    return this.commandService.deletePost(postId, user);
  }
}
