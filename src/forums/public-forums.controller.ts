import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OptionalRead } from '../auth/decorators/optional-read.decorator';
import {
  Roles,
  AUTHENTICATED_USER_ROLE,
} from '../auth/decorators/roles.decorator';
import { Scopes } from '../auth/decorators/scopes.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { ClientIp } from '../auth/decorators/client-ip.decorator';
import { FORUMS_SCOPE_READ_TOPICS } from '../auth/scope-mappings';
import { JwtUser } from '../auth/jwt.service';
import { PublicForumsQueryDto } from './dto/public-forums.dto';
import { PublicForumsService } from './public-forums.service';

/** Public catalog routes reuse the existing authenticated topic/post commands for interaction. */
@ApiTags('Public forums')
@Controller('public')
@OptionalRead()
@Roles(AUTHENTICATED_USER_ROLE)
@Scopes(FORUMS_SCOPE_READ_TOPICS)
export class PublicForumsController {
  /** @param service Visibility-filtered catalog service. @throws Never. */
  constructor(private readonly service: PublicForumsService) {}

  /** @param user Optional validated identity. @param ip Trusted IP. @returns Visible category cards. @throws Ban/database errors. */
  @Get('categories')
  @ApiOperation({
    summary:
      'Read the public category tree; role restrictions apply before statistics',
  })
  categories(@CurrentUser() user?: JwtUser, @ClientIp() ip?: string) {
    return this.service.categories(user, ip);
  }

  /** @param query Validated filters/page. @param user Optional identity. @param ip Trusted IP.
   * @returns Visible thread page. @throws Access, validation and database errors.
   */
  @Get('topics')
  @ApiOperation({ summary: 'Search public threads or list watched content' })
  topics(
    @Query() query: PublicForumsQueryDto,
    @CurrentUser() user?: JwtUser,
    @ClientIp() ip?: string,
  ) {
    return this.service.topics(query, user, ip);
  }
}
