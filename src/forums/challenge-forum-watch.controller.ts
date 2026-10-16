import { Controller, Delete, Get, Header, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AUTHENTICATED_USER_ROLE,
  Roles,
} from '../auth/decorators/roles.decorator';
import { ClientIp } from '../auth/decorators/client-ip.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { JwtUser } from '../auth/jwt.service';
import {
  ChallengeForumWatchService,
  ChallengeForumWatchState,
} from './challenge-forum-watch.service';

/**
 * Human-member routes for challenge-wide notification preferences, including
 * empty forums. All operations enforce the shared challenge visibility and bans.
 */
@ApiTags('Challenge forum watches')
@ApiBearerAuth()
@Roles(AUTHENTICATED_USER_ROLE)
@Controller('challenges/:challengeId/watch')
export class ChallengeForumWatchController {
  /**
   * Creates the member preference controller.
   * @param service Authorized preference reader/writer.
   * @throws Does not throw; Nest resolves dependencies.
   */
  constructor(private readonly service: ChallengeForumWatchService) {}

  /**
   * Reads the caller's effective watch state for the forum overview.
   * @param challengeId Challenge route identifier.
   * @param user Authenticated human token.
   * @param trustedClientIp Trusted client address.
   * @returns Effective watch state, including resource-based defaults.
   * @throws Propagates authentication, policy, ban, and database errors.
   */
  @Get()
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({ summary: 'Read the current member’s challenge forum watch' })
  getWatch(
    @Param('challengeId') challengeId: string,
    @CurrentUser() user?: JwtUser,
    @ClientIp() trustedClientIp?: string,
  ): Promise<ChallengeForumWatchState> {
    return this.service.watchState(challengeId, user, trustedClientIp);
  }

  /**
   * Enables notifications for current and future topics in the challenge forum.
   * @param challengeId Challenge route identifier.
   * @param user Authenticated human token.
   * @param trustedClientIp Trusted client address.
   * @returns Persisted watch state.
   * @throws Propagates authentication, policy, ban, and database errors.
   */
  @Put()
  @ApiOperation({ summary: 'Watch the challenge forum' })
  watch(
    @Param('challengeId') challengeId: string,
    @CurrentUser() user?: JwtUser,
    @ClientIp() trustedClientIp?: string,
  ): Promise<ChallengeForumWatchState> {
    return this.service.watchState(challengeId, user, trustedClientIp, true);
  }

  /**
   * Persists an opt-out from the forum-wide stream without deleting topic watches.
   * @param challengeId Challenge route identifier.
   * @param user Authenticated human token.
   * @param trustedClientIp Trusted client address.
   * @returns Persisted unwatched state.
   * @throws Propagates authentication, policy, ban, and database errors.
   */
  @Delete()
  @ApiOperation({ summary: 'Unwatch the challenge forum' })
  unwatch(
    @Param('challengeId') challengeId: string,
    @CurrentUser() user?: JwtUser,
    @ClientIp() trustedClientIp?: string,
  ): Promise<ChallengeForumWatchState> {
    return this.service.watchState(challengeId, user, trustedClientIp, false);
  }
}
