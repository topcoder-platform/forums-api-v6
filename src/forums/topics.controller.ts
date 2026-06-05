import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
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
  FORUMS_SCOPE_ADD_WATCH,
  FORUMS_SCOPE_CREATE_POST,
  FORUMS_SCOPE_CREATE_TOPIC,
  FORUMS_SCOPE_DELETE_TOPIC,
  FORUMS_SCOPE_READ_TOPICS,
  FORUMS_SCOPE_REMOVE_WATCH,
  FORUMS_SCOPE_UPDATE_TOPIC,
} from '../auth/scope-mappings';
import {
  CreatePostDto,
  CreateTopicDto,
  MemberTargetDto,
  UpdateTopicDto,
} from './dto/forums-command.dto';
import {
  CreateTopicCommandResponseDto,
  ForumPostCommandResponseDto,
  ForumTopicCommandResponseDto,
  TopicReadStateCommandResponseDto,
  TopicWatchCommandResponseDto,
  TopicWatchStateCommandResponseDto,
} from './dto/forums-command-response.dto';
import {
  ForumsTopicDetailDto,
  ForumsTopicListQueryDto,
  ForumsTopicSummaryDto,
  ForumsTopicSummaryPageDto,
} from './dto/forums-read.dto';
import { ForumsCommandService } from './forums-command.service';
import { ForumsReadService } from './forums-read.service';

/**
 * Controller for topic reads plus command-side topic, topic-post, watch, and
 * read-state routes.
 *
 * Routes are mounted under the global `/v6/forums` prefix. Topic list and
 * detail reads are protected by `read:forums-topics`; embedded posts in topic
 * detail remain on the topics read surface rather than `read:forums-posts`.
 */
@ApiTags('Forums topics')
@ApiBearerAuth()
@Controller('topics')
export class TopicsController {
  /**
   * Creates a topics controller.
   *
   * @param commandService Service that performs transactional forum writes.
   * @param readService Service that performs authorized forum topic reads.
   * @throws Does not throw directly; dependencies are resolved by Nest.
   */
  constructor(
    private readonly commandService: ForumsCommandService,
    private readonly readService: ForumsReadService,
  ) {}

  /**
   * Creates a topic with its starter post.
   *
   * @param dto Topic metadata and starter-post content.
   * @param user Authenticated token payload for the acting member.
   * @returns The created topic and starter post.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws ForbiddenException when command policy denies topic creation.
   * @throws BadRequestException when the request body is invalid.
   * @throws NotFoundException when the parent topic is missing or hidden.
   */
  @Post()
  @Roles(AUTHENTICATED_USER_ROLE)
  @Scopes(FORUMS_SCOPE_CREATE_TOPIC)
  @ApiOperation({
    summary: 'Create a forum topic with a starter post',
    description:
      'Command route requiring an authenticated member token or `create:forums-topics`. Top-level non-challenge topics are allowed for human admins and scoped M2M callers. Top-level challenge topics are allowed for eligible challenge members, challenge copilots, and admins; M2M callers cannot create challenge roots. Child topics require visible parents, monotonic restrictions, and a resolved effective non-challenge context; challenge-scoped child creates are forbidden. M2M-created content uses the system author and does not seed member watch or read-state rows. Successful child-topic starter posts trigger best-effort watch notifications after commit.',
  })
  @ApiResponse({
    status: 201,
    description: 'Topic created.',
    type: CreateTopicCommandResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid topic fields or parent linkage.',
  })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({ description: 'Insufficient forums access.' })
  @ApiNotFoundResponse({ description: 'Parent topic not found.' })
  createTopic(
    @Body() dto: CreateTopicDto,
    @CurrentUser() user?: JwtUser,
  ): Promise<CreateTopicCommandResponseDto> {
    return this.commandService.createTopic(dto, user);
  }

  /**
   * Lists visible non-challenge root topics.
   *
   * @param query Pagination query parameters.
   * @param user Authenticated token payload for the read caller.
   * @returns Paginated visible general root topics.
   * @throws UnauthorizedException when no authenticated read caller is present.
   */
  @Get()
  @Roles(AUTHENTICATED_USER_ROLE)
  @Scopes(FORUMS_SCOPE_READ_TOPICS)
  @ApiOperation({
    summary: 'List general forum root topics',
    description:
      'Requires an authenticated member token or `read:forums-topics`. Returns non-challenge root topics the caller can see, including role-restricted general topics after centralized forums policy filtering.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number, starting at 1.',
  })
  @ApiQuery({
    name: 'perPage',
    required: false,
    description: 'Number of topics per page.',
  })
  @ApiResponse({
    status: 200,
    description: 'Visible general root topics.',
    type: ForumsTopicSummaryPageDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid pagination query.' })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  listGeneralRootTopics(
    @Query() query: ForumsTopicListQueryDto,
    @CurrentUser() user?: JwtUser,
  ): Promise<ForumsTopicSummaryPageDto> {
    return this.readService.listGeneralRootTopics(query, user);
  }

  /**
   * Lists visible root topics for a challenge.
   *
   * @param challengeId Challenge id from the route.
   * @param query Pagination query parameters.
   * @param user Authenticated token payload for the read caller.
   * @returns Paginated visible challenge root topics.
   * @throws UnauthorizedException when no authenticated read caller is present.
   * @throws ForbiddenException when challenge visibility is denied.
   * @throws NotFoundException when the challenge is missing or hidden by policy.
   */
  @Get('challenges/:challengeId')
  @Roles(AUTHENTICATED_USER_ROLE)
  @Scopes(FORUMS_SCOPE_READ_TOPICS)
  @ApiOperation({
    summary: 'List challenge forum root topics',
    description:
      'Requires an authenticated member token or `read:forums-topics`. The base challenge restriction is checked first; matching root topics are then filtered through centralized forums policy for narrower role restrictions before pagination.',
  })
  @ApiParam({ name: 'challengeId', description: 'Challenge id.' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number, starting at 1.',
  })
  @ApiQuery({
    name: 'perPage',
    required: false,
    description: 'Number of topics per page.',
  })
  @ApiResponse({
    status: 200,
    description: 'Visible challenge root topics.',
    type: ForumsTopicSummaryPageDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid pagination query.' })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({ description: 'Challenge visibility denied.' })
  @ApiNotFoundResponse({ description: 'Challenge not found.' })
  listChallengeRootTopics(
    @Param('challengeId') challengeId: string,
    @Query() query: ForumsTopicListQueryDto,
    @CurrentUser() user?: JwtUser,
  ): Promise<ForumsTopicSummaryPageDto> {
    return this.readService.listChallengeRootTopics(challengeId, query, user);
  }

  /**
   * Lists visible direct child topics for a parent topic.
   *
   * @param topicId Parent topic id from the route.
   * @param user Authenticated token payload for the read caller.
   * @returns Ordered visible direct child topic summaries.
   * @throws UnauthorizedException when no authenticated read caller is present.
   * @throws ForbiddenException when parent topic visibility is denied.
   * @throws NotFoundException when the parent topic is missing or hidden.
   */
  @Get(':topicId/children')
  @Roles(AUTHENTICATED_USER_ROLE)
  @Scopes(FORUMS_SCOPE_READ_TOPICS)
  @ApiOperation({
    summary: 'List direct child forum topics',
    description:
      'Requires an authenticated member token or `read:forums-topics`. The parent topic must be visible first, then child rows are filtered through centralized forums policy using inherited parent restrictions plus each child direct restriction.',
  })
  @ApiParam({ name: 'topicId', description: 'Parent topic id.' })
  @ApiResponse({
    status: 200,
    description: 'Visible direct child topics.',
    type: [ForumsTopicSummaryDto],
  })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({ description: 'Parent topic visibility denied.' })
  @ApiNotFoundResponse({ description: 'Parent topic not found.' })
  listChildTopics(
    @Param('topicId') topicId: string,
    @CurrentUser() user?: JwtUser,
  ): Promise<ForumsTopicSummaryDto[]> {
    return this.readService.listChildTopics(topicId, user);
  }

  /**
   * Loads topic detail with embedded posts.
   *
   * @param topicId Topic id from the route.
   * @param user Authenticated token payload for the read caller.
   * @returns Topic detail with nested posts and replies.
   * @throws UnauthorizedException when no authenticated read caller is present.
   * @throws ForbiddenException when topic visibility is denied.
   * @throws NotFoundException when the topic is missing or hidden.
   */
  @Get(':topicId')
  @Roles(AUTHENTICATED_USER_ROLE)
  @Scopes(FORUMS_SCOPE_READ_TOPICS)
  @ApiOperation({
    summary: 'Get forum topic detail',
    description:
      'Requires an authenticated member token or `read:forums-topics`. Returns the topic summary and embedded post tree under the topics read scope; `read:forums-posts` remains reserved for future post-specific reads.',
  })
  @ApiParam({ name: 'topicId', description: 'Topic id.' })
  @ApiResponse({
    status: 200,
    description: 'Topic detail with embedded post tree.',
    type: ForumsTopicDetailDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({ description: 'Topic visibility denied.' })
  @ApiNotFoundResponse({ description: 'Topic not found.' })
  getTopicDetail(
    @Param('topicId') topicId: string,
    @CurrentUser() user?: JwtUser,
  ): Promise<ForumsTopicDetailDto> {
    return this.readService.getTopicDetail(topicId, user);
  }

  /**
   * Updates mutable topic metadata.
   *
   * @param topicId Topic id from the route.
   * @param dto Mutable topic fields.
   * @param user Authenticated token payload for the acting member.
   * @returns The updated topic row.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws ForbiddenException when the token lacks update access.
   * @throws BadRequestException when no mutable fields are provided.
   * @throws NotFoundException when the topic is missing or hidden.
   */
  @Patch(':topicId')
  @Roles(AUTHENTICATED_USER_ROLE)
  @Scopes(FORUMS_SCOPE_UPDATE_TOPIC)
  @ApiOperation({
    summary: 'Update forum topic metadata',
    description:
      'Command route for mutable topic metadata. Topic updates require an authenticated member token or `update:forums-topics`, then pass centralized forums policy checks for visibility, ownership, challenge copilot elevation, and announcement control.',
  })
  @ApiParam({ name: 'topicId', description: 'Topic id.' })
  @ApiResponse({
    status: 200,
    description: 'Topic updated.',
    type: ForumTopicCommandResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid or empty update body.' })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({ description: 'Insufficient forums access.' })
  @ApiNotFoundResponse({ description: 'Topic not found.' })
  updateTopic(
    @Param('topicId') topicId: string,
    @Body() dto: UpdateTopicDto,
    @CurrentUser() user?: JwtUser,
  ): Promise<ForumTopicCommandResponseDto> {
    return this.commandService.updateTopic(topicId, dto, user);
  }

  /**
   * Soft-deletes a topic.
   *
   * @param topicId Topic id from the route.
   * @param user Authenticated token payload for the acting member.
   * @returns The soft-deleted topic row.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws ForbiddenException when the token lacks delete access.
   * @throws NotFoundException when the topic is missing or hidden.
   */
  @Delete(':topicId')
  @Roles(AUTHENTICATED_USER_ROLE)
  @Scopes(FORUMS_SCOPE_DELETE_TOPIC)
  @ApiOperation({
    summary: 'Soft-delete a forum topic',
    description:
      'Command route for topic soft deletion. Topic deletion requires an authenticated member token or `delete:forums-topics`, then passes centralized forums policy checks for visibility, ownership, and elevated challenge access.',
  })
  @ApiParam({ name: 'topicId', description: 'Topic id.' })
  @ApiResponse({
    status: 200,
    description: 'Topic soft-deleted.',
    type: ForumTopicCommandResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({ description: 'Insufficient forums access.' })
  @ApiNotFoundResponse({ description: 'Topic not found.' })
  softDeleteTopic(
    @Param('topicId') topicId: string,
    @CurrentUser() user?: JwtUser,
  ): Promise<ForumTopicCommandResponseDto> {
    return this.commandService.softDeleteTopic(topicId, user);
  }

  /**
   * Creates a post inside a topic.
   *
   * @param topicId Topic id from the route.
   * @param dto Post content and optional parent target.
   * @param user Authenticated token payload for the acting member.
   * @returns The created post row.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws ForbiddenException when command policy denies post creation.
   * @throws BadRequestException when parent linkage is invalid.
   * @throws NotFoundException when the topic or parent post is missing.
   */
  @Post(':topicId/posts')
  @Roles(AUTHENTICATED_USER_ROLE)
  @Scopes(FORUMS_SCOPE_CREATE_POST)
  @ApiOperation({
    summary: 'Create a post in a forum topic',
    description:
      'Command route requiring an authenticated member token or `create:forums-posts`. The command policy verifies inherited topic visibility, challenge access, and role matching. M2M-created posts use the system author and do not seed member read-state rows. Successful writes trigger best-effort watch notifications after commit.',
  })
  @ApiParam({ name: 'topicId', description: 'Topic id.' })
  @ApiResponse({
    status: 201,
    description: 'Post created.',
    type: ForumPostCommandResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid post body or parent linkage.',
  })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({ description: 'Insufficient forums access.' })
  @ApiNotFoundResponse({ description: 'Topic or parent post not found.' })
  createPost(
    @Param('topicId') topicId: string,
    @Body() dto: CreatePostDto,
    @CurrentUser() user?: JwtUser,
  ): Promise<ForumPostCommandResponseDto> {
    return this.commandService.createPost(topicId, dto, user);
  }

  /**
   * Adds a watch on a topic for a member.
   *
   * @param topicId Topic id from the route.
   * @param dto Optional target member body; required for scoped M2M callers.
   * @param user Authenticated token payload for the acting member.
   * @returns The persisted watch row.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws ForbiddenException when command policy denies watch access.
   * @throws NotFoundException when the topic is missing or hidden.
   */
  @Put(':topicId/watch')
  @Roles(AUTHENTICATED_USER_ROLE)
  @Scopes(FORUMS_SCOPE_ADD_WATCH)
  @ApiOperation({
    summary: 'Watch a forum topic',
    description:
      'Command route requiring an authenticated member token or `add:forums-topic-watch`. Human tokens watch for themselves. Scoped M2M callers must supply a `memberId` that resolves in external Members and Identity data, and policy evaluates inherited challenge and role visibility for that target member before writing the watch row.',
  })
  @ApiParam({ name: 'topicId', description: 'Topic id.' })
  @ApiResponse({
    status: 200,
    description: 'Topic watch added.',
    type: TopicWatchCommandResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid member target.' })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({ description: 'Insufficient forums access.' })
  @ApiNotFoundResponse({ description: 'Topic not found.' })
  addTopicWatch(
    @Param('topicId') topicId: string,
    @Body() dto: MemberTargetDto,
    @CurrentUser() user?: JwtUser,
  ): Promise<TopicWatchCommandResponseDto> {
    return this.commandService.addTopicWatch(topicId, dto, user);
  }

  /**
   * Removes a watch on a topic for a member.
   *
   * @param topicId Topic id from the route.
   * @param dto Optional target member body; required for scoped M2M callers.
   * @param user Authenticated token payload for the acting member.
   * @returns The resulting watch state.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws ForbiddenException when command policy denies watch access.
   * @throws NotFoundException when the topic is missing or hidden.
   */
  @Delete(':topicId/watch')
  @Roles(AUTHENTICATED_USER_ROLE)
  @Scopes(FORUMS_SCOPE_REMOVE_WATCH)
  @ApiOperation({
    summary: 'Unwatch a forum topic',
    description:
      'Command route requiring an authenticated member token or `remove:forums-topic-watch`. Human tokens unwatch for themselves. Scoped M2M callers must supply a `memberId` that resolves in external Members and Identity data, and policy evaluates inherited challenge and role visibility for that target member before removing the watch row.',
  })
  @ApiParam({ name: 'topicId', description: 'Topic id.' })
  @ApiResponse({
    status: 200,
    description: 'Topic watch removed.',
    type: TopicWatchStateCommandResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid member target.' })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({ description: 'Insufficient forums access.' })
  @ApiNotFoundResponse({ description: 'Topic not found.' })
  removeTopicWatch(
    @Param('topicId') topicId: string,
    @Body() dto: MemberTargetDto,
    @CurrentUser() user?: JwtUser,
  ): Promise<TopicWatchStateCommandResponseDto> {
    return this.commandService.removeTopicWatch(topicId, dto, user);
  }

  /**
   * Marks a topic as read for a member.
   *
   * @param topicId Topic id from the route.
   * @param dto Optional target member body; required for scoped M2M callers.
   * @param user Authenticated token payload for the acting member.
   * @returns The upserted read-state row.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws ForbiddenException when command policy denies read-state access.
   * @throws NotFoundException when the topic is missing or hidden.
   */
  @Put(':topicId/read-state')
  @Roles(AUTHENTICATED_USER_ROLE)
  @Scopes(FORUMS_SCOPE_UPDATE_TOPIC)
  @ApiOperation({
    summary: 'Mark a forum topic as read',
    description:
      'Command route requiring an authenticated member token or `update:forums-topics`. Human tokens mark read for themselves. Scoped M2M callers must supply a `memberId` that resolves in external Members and Identity data, and policy evaluates inherited challenge and role visibility for that target member before writing read state.',
  })
  @ApiParam({ name: 'topicId', description: 'Topic id.' })
  @ApiResponse({
    status: 200,
    description: 'Topic read state updated.',
    type: TopicReadStateCommandResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid member target.' })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({ description: 'Insufficient forums access.' })
  @ApiNotFoundResponse({ description: 'Topic not found.' })
  markTopicRead(
    @Param('topicId') topicId: string,
    @Body() dto: MemberTargetDto,
    @CurrentUser() user?: JwtUser,
  ): Promise<TopicReadStateCommandResponseDto> {
    return this.commandService.markTopicRead(topicId, dto, user);
  }
}
