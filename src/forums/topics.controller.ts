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
import { ClientIp } from '../auth/decorators/client-ip.decorator';
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
 * Trusted client-IP context is resolved at the request boundary and forwarded
 * to services as a string for runtime ban checks.
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
   * @param trustedClientIp Optional trusted client IP resolved at the HTTP boundary.
   * @returns The created topic command response and starter post.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws ForbiddenException when command policy, active bans, or parent lock state deny topic creation.
   * @throws BadRequestException when the request body is invalid.
   * @throws NotFoundException when the parent topic is missing or hidden.
   */
  @Post()
  @Roles(AUTHENTICATED_USER_ROLE)
  @Scopes(FORUMS_SCOPE_CREATE_TOPIC)
  @ApiOperation({
    summary: 'Create a forum topic with a starter post',
    description:
      'Command route requiring an authenticated member token or `create:forums-topics`. Top-level non-challenge topics are allowed for human admins and scoped M2M callers. Top-level challenge topics are allowed for eligible challenge members, challenge copilots, and admins; M2M callers cannot create challenge roots. Child topics require visible parents, monotonic restrictions, and a resolved effective non-challenge context; challenge-scoped child creates are forbidden. Active member bans and trusted exact-IP bans return 403 before writes. Locked parents reject child-topic creation unless the caller is an administrator or eligible challenge copilot. M2M-created content uses the system author and does not seed member watch or read-state rows. Successful child-topic starter posts trigger best-effort watch notifications after commit.',
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
  @ApiForbiddenResponse({
    description: 'Insufficient forums access, active ban, or locked parent.',
  })
  @ApiNotFoundResponse({ description: 'Parent topic not found.' })
  createTopic(
    @Body() dto: CreateTopicDto,
    @CurrentUser() user?: JwtUser,
    @ClientIp() trustedClientIp?: string,
  ): Promise<CreateTopicCommandResponseDto> {
    return this.commandService.createTopic(dto, user, trustedClientIp);
  }

  /**
   * Lists visible non-challenge root topics.
   *
   * @param query Pagination query parameters.
   * @param user Authenticated token payload for the read caller.
   * @param trustedClientIp Optional trusted client IP resolved at the HTTP boundary.
   * @returns Paginated visible general root topics.
   * @throws UnauthorizedException when no authenticated read caller is present.
   */
  @Get()
  @Roles(AUTHENTICATED_USER_ROLE)
  @Scopes(FORUMS_SCOPE_READ_TOPICS)
  @ApiOperation({
    summary: 'List general forum root topics',
    description:
      'Requires an authenticated member token or `read:forums-topics`. Active member bans and trusted exact-IP bans return 403 before visibility checks. Returns non-challenge root topics the caller can see, including role-restricted general topics after centralized forums policy filtering.',
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
  @ApiForbiddenResponse({ description: 'Active forums ban.' })
  listGeneralRootTopics(
    @Query() query: ForumsTopicListQueryDto,
    @CurrentUser() user?: JwtUser,
    @ClientIp() trustedClientIp?: string,
  ): Promise<ForumsTopicSummaryPageDto> {
    return this.readService.listGeneralRootTopics(query, user, trustedClientIp);
  }

  /**
   * Lists visible root topics for a challenge.
   *
   * @param challengeId Challenge id from the route.
   * @param query Pagination query parameters.
   * @param user Authenticated token payload for the read caller.
   * @param trustedClientIp Optional trusted client IP resolved at the HTTP boundary.
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
      'Requires an authenticated member token or `read:forums-topics`. Active member bans and trusted exact-IP bans return 403 before challenge visibility checks. The base challenge restriction is checked first; matching root topics are then filtered through centralized forums policy for narrower role restrictions before pagination.',
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
  @ApiForbiddenResponse({
    description: 'Active forums ban or challenge visibility denied.',
  })
  @ApiNotFoundResponse({ description: 'Challenge not found.' })
  listChallengeRootTopics(
    @Param('challengeId') challengeId: string,
    @Query() query: ForumsTopicListQueryDto,
    @CurrentUser() user?: JwtUser,
    @ClientIp() trustedClientIp?: string,
  ): Promise<ForumsTopicSummaryPageDto> {
    return this.readService.listChallengeRootTopics(
      challengeId,
      query,
      user,
      trustedClientIp,
    );
  }

  /**
   * Lists visible direct child topics for a parent topic.
   *
   * @param topicId Parent topic id from the route.
   * @param user Authenticated token payload for the read caller.
   * @param trustedClientIp Optional trusted client IP resolved at the HTTP boundary.
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
      'Requires an authenticated member token or `read:forums-topics`. Active member bans and trusted exact-IP bans return 403 before parent visibility checks. The parent topic must be visible first, then child rows are filtered through centralized forums policy using inherited parent restrictions plus each child direct restriction. Locked topics remain readable.',
  })
  @ApiParam({ name: 'topicId', description: 'Parent topic id.' })
  @ApiResponse({
    status: 200,
    description: 'Visible direct child topics.',
    type: [ForumsTopicSummaryDto],
  })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({
    description: 'Active forums ban or parent topic visibility denied.',
  })
  @ApiNotFoundResponse({ description: 'Parent topic not found.' })
  listChildTopics(
    @Param('topicId') topicId: string,
    @CurrentUser() user?: JwtUser,
    @ClientIp() trustedClientIp?: string,
  ): Promise<ForumsTopicSummaryDto[]> {
    return this.readService.listChildTopics(topicId, user, trustedClientIp);
  }

  /**
   * Loads topic detail with embedded posts.
   *
   * @param topicId Topic id from the route.
   * @param user Authenticated token payload for the read caller.
   * @param trustedClientIp Optional trusted client IP resolved at the HTTP boundary.
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
      'Requires an authenticated member token or `read:forums-topics`. Active member bans and trusted exact-IP bans return 403 before topic visibility checks. Returns the topic summary and embedded post tree under the topics read scope; locked topics remain readable. `read:forums-posts` remains reserved for future post-specific reads.',
  })
  @ApiParam({ name: 'topicId', description: 'Topic id.' })
  @ApiResponse({
    status: 200,
    description: 'Topic detail with embedded post tree.',
    type: ForumsTopicDetailDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({
    description: 'Active forums ban or topic visibility denied.',
  })
  @ApiNotFoundResponse({ description: 'Topic not found.' })
  getTopicDetail(
    @Param('topicId') topicId: string,
    @CurrentUser() user?: JwtUser,
    @ClientIp() trustedClientIp?: string,
  ): Promise<ForumsTopicDetailDto> {
    return this.readService.getTopicDetail(topicId, user, trustedClientIp);
  }

  /**
   * Updates mutable topic metadata.
   *
   * @param topicId Topic id from the route.
   * @param dto Mutable topic fields.
   * @param user Authenticated token payload for the acting member.
   * @param trustedClientIp Optional trusted client IP resolved at the HTTP boundary.
   * @returns The stable topic command response.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws ForbiddenException when the token lacks update access, an active ban applies, or the topic is locked.
   * @throws BadRequestException when no mutable fields are provided.
   * @throws NotFoundException when the topic is missing or hidden.
   */
  @Patch(':topicId')
  @Roles(AUTHENTICATED_USER_ROLE)
  @Scopes(FORUMS_SCOPE_UPDATE_TOPIC)
  @ApiOperation({
    summary: 'Update forum topic metadata',
    description:
      'Command route for mutable topic metadata. Topic updates require an authenticated member token or `update:forums-topics`, then pass centralized forums policy checks for visibility, ownership, challenge copilot elevation, and announcement control. Active member bans and trusted exact-IP bans return 403 before writes. Locked topics reject updates unless the caller is an administrator or eligible challenge copilot.',
  })
  @ApiParam({ name: 'topicId', description: 'Topic id.' })
  @ApiResponse({
    status: 200,
    description: 'Topic updated.',
    type: ForumTopicCommandResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid or empty update body.' })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({
    description: 'Insufficient forums access, active ban, or locked topic.',
  })
  @ApiNotFoundResponse({ description: 'Topic not found.' })
  updateTopic(
    @Param('topicId') topicId: string,
    @Body() dto: UpdateTopicDto,
    @CurrentUser() user?: JwtUser,
    @ClientIp() trustedClientIp?: string,
  ): Promise<ForumTopicCommandResponseDto> {
    return this.commandService.updateTopic(topicId, dto, user, trustedClientIp);
  }

  /**
   * Soft-deletes a topic.
   *
   * @param topicId Topic id from the route.
   * @param user Authenticated token payload for the acting member.
   * @param trustedClientIp Optional trusted client IP resolved at the HTTP boundary.
   * @returns The stable soft-deleted topic command response.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws ForbiddenException when the token lacks delete access, an active ban applies, or the topic is locked.
   * @throws NotFoundException when the topic is missing or hidden.
   */
  @Delete(':topicId')
  @Roles(AUTHENTICATED_USER_ROLE)
  @Scopes(FORUMS_SCOPE_DELETE_TOPIC)
  @ApiOperation({
    summary: 'Soft-delete a forum topic',
    description:
      'Command route for topic soft deletion. Human deletion is administrator-only; M2M callers require `delete:forums-topics`. Authors and challenge copilots may edit eligible topics but cannot delete them. Active member bans and trusted exact-IP bans return 403 before writes, and locked topics reject non-administrator deletion.',
  })
  @ApiParam({ name: 'topicId', description: 'Topic id.' })
  @ApiResponse({
    status: 200,
    description: 'Topic soft-deleted.',
    type: ForumTopicCommandResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({
    description: 'Insufficient forums access, active ban, or locked topic.',
  })
  @ApiNotFoundResponse({ description: 'Topic not found.' })
  softDeleteTopic(
    @Param('topicId') topicId: string,
    @CurrentUser() user?: JwtUser,
    @ClientIp() trustedClientIp?: string,
  ): Promise<ForumTopicCommandResponseDto> {
    return this.commandService.softDeleteTopic(topicId, user, trustedClientIp);
  }

  /**
   * Creates a post inside a topic.
   *
   * @param topicId Topic id from the route.
   * @param dto Post content and optional parent target.
   * @param user Authenticated token payload for the acting member.
   * @param trustedClientIp Optional trusted client IP resolved at the HTTP boundary.
   * @returns The created post row.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws ForbiddenException when command policy, active bans, or topic lock state deny post creation.
   * @throws BadRequestException when parent linkage is invalid.
   * @throws NotFoundException when the topic or parent post is missing.
   */
  @Post(':topicId/posts')
  @Roles(AUTHENTICATED_USER_ROLE)
  @Scopes(FORUMS_SCOPE_CREATE_POST)
  @ApiOperation({
    summary: 'Create a post in a forum topic',
    description:
      'Command route requiring an authenticated member token or `create:forums-posts`. The command policy verifies inherited topic visibility, challenge access, and role matching. Active member bans and trusted exact-IP bans return 403 before writes. Locked topics reject replies unless the caller is an administrator or eligible challenge copilot. M2M-created posts use the system author and do not seed member read-state rows. Successful writes trigger best-effort watch notifications after commit.',
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
  @ApiForbiddenResponse({
    description: 'Insufficient forums access, active ban, or locked topic.',
  })
  @ApiNotFoundResponse({ description: 'Topic or parent post not found.' })
  createPost(
    @Param('topicId') topicId: string,
    @Body() dto: CreatePostDto,
    @CurrentUser() user?: JwtUser,
    @ClientIp() trustedClientIp?: string,
  ): Promise<ForumPostCommandResponseDto> {
    return this.commandService.createPost(topicId, dto, user, trustedClientIp);
  }

  /**
   * Adds a watch on a topic for a member.
   *
   * @param topicId Topic id from the route.
   * @param dto Optional target member body; required for scoped M2M callers.
   * @param user Authenticated token payload for the acting member.
   * @param trustedClientIp Optional trusted client IP resolved at the HTTP boundary.
   * @returns The persisted watch row.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws ForbiddenException when command policy or active bans deny watch access.
   * @throws NotFoundException when the topic is missing or hidden.
   */
  @Put(':topicId/watch')
  @Roles(AUTHENTICATED_USER_ROLE)
  @Scopes(FORUMS_SCOPE_ADD_WATCH)
  @ApiOperation({
    summary: 'Watch a forum topic',
    description:
      'Command route requiring an authenticated member token or `add:forums-topic-watch`. Human tokens watch for themselves and active member or trusted exact-IP bans return 403. Scoped M2M callers must supply a `memberId` that resolves in external Members and Identity data; active target-member bans return 403 before context loading, and policy evaluates inherited challenge and role visibility for that target member before writing the watch row.',
  })
  @ApiParam({ name: 'topicId', description: 'Topic id.' })
  @ApiResponse({
    status: 200,
    description: 'Topic watch added.',
    type: TopicWatchCommandResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid member target.' })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({
    description: 'Insufficient forums access or active ban.',
  })
  @ApiNotFoundResponse({ description: 'Topic not found.' })
  addTopicWatch(
    @Param('topicId') topicId: string,
    @Body() dto: MemberTargetDto,
    @CurrentUser() user?: JwtUser,
    @ClientIp() trustedClientIp?: string,
  ): Promise<TopicWatchCommandResponseDto> {
    return this.commandService.addTopicWatch(
      topicId,
      dto,
      user,
      trustedClientIp,
    );
  }

  /**
   * Removes a watch on a topic for a member.
   *
   * @param topicId Topic id from the route.
   * @param dto Optional target member body; required for scoped M2M callers.
   * @param user Authenticated token payload for the acting member.
   * @param trustedClientIp Optional trusted client IP resolved at the HTTP boundary.
   * @returns The resulting watch state.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws ForbiddenException when command policy or active bans deny watch access.
   * @throws NotFoundException when the topic is missing or hidden.
   */
  @Delete(':topicId/watch')
  @Roles(AUTHENTICATED_USER_ROLE)
  @Scopes(FORUMS_SCOPE_REMOVE_WATCH)
  @ApiOperation({
    summary: 'Unwatch a forum topic',
    description:
      'Command route requiring an authenticated member token or `remove:forums-topic-watch`. Human tokens unwatch for themselves and active member or trusted exact-IP bans return 403. Scoped M2M callers must supply a `memberId` that resolves in external Members and Identity data; active target-member bans return 403 before context loading, and policy evaluates inherited challenge and role visibility for that target member before removing the watch row.',
  })
  @ApiParam({ name: 'topicId', description: 'Topic id.' })
  @ApiResponse({
    status: 200,
    description: 'Topic watch removed.',
    type: TopicWatchStateCommandResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid member target.' })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({
    description: 'Insufficient forums access or active ban.',
  })
  @ApiNotFoundResponse({ description: 'Topic not found.' })
  removeTopicWatch(
    @Param('topicId') topicId: string,
    @Body() dto: MemberTargetDto,
    @CurrentUser() user?: JwtUser,
    @ClientIp() trustedClientIp?: string,
  ): Promise<TopicWatchStateCommandResponseDto> {
    return this.commandService.removeTopicWatch(
      topicId,
      dto,
      user,
      trustedClientIp,
    );
  }

  /**
   * Marks a topic as read for a member.
   *
   * @param topicId Topic id from the route.
   * @param dto Optional target member body; required for scoped M2M callers.
   * @param user Authenticated token payload for the acting member.
   * @param trustedClientIp Optional trusted client IP resolved at the HTTP boundary.
   * @returns The upserted read-state row.
   * @throws UnauthorizedException when no authenticated command caller is present.
   * @throws ForbiddenException when command policy or active bans deny read-state access.
   * @throws NotFoundException when the topic is missing or hidden.
   */
  @Put(':topicId/read-state')
  @Roles(AUTHENTICATED_USER_ROLE)
  @Scopes(FORUMS_SCOPE_UPDATE_TOPIC)
  @ApiOperation({
    summary: 'Mark a forum topic as read',
    description:
      'Command route requiring an authenticated member token or `update:forums-topics`. Human tokens mark read for themselves and active member or trusted exact-IP bans return 403. Scoped M2M callers must supply a `memberId` that resolves in external Members and Identity data; active target-member bans return 403 before context loading, and policy evaluates inherited challenge and role visibility for that target member before writing read state.',
  })
  @ApiParam({ name: 'topicId', description: 'Topic id.' })
  @ApiResponse({
    status: 200,
    description: 'Topic read state updated.',
    type: TopicReadStateCommandResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid member target.' })
  @ApiUnauthorizedResponse({ description: 'Authenticated token required.' })
  @ApiForbiddenResponse({
    description: 'Insufficient forums access or active ban.',
  })
  @ApiNotFoundResponse({ description: 'Topic not found.' })
  markTopicRead(
    @Param('topicId') topicId: string,
    @Body() dto: MemberTargetDto,
    @CurrentUser() user?: JwtUser,
    @ClientIp() trustedClientIp?: string,
  ): Promise<TopicReadStateCommandResponseDto> {
    return this.commandService.markTopicRead(
      topicId,
      dto,
      user,
      trustedClientIp,
    );
  }
}
