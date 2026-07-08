import { ApiProperty } from '@nestjs/swagger';
import { IsIP, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const BARE_IP_ADDRESS_PATTERN = /^[^"',/*[\]\s]+$/;

/**
 * Route parameters for topic lock moderation operations.
 *
 * The controller uses this DTO to validate and document the topic id path
 * parameter before passing it to `ForumsModerationService`.
 */
export class TopicModerationParamDto {
  @ApiProperty({ description: 'Topic id to lock or unlock.', maxLength: 14 })
  @IsString()
  @MinLength(1)
  @MaxLength(14)
  topicId: string;
}

/**
 * Route parameters for member ban moderation operations.
 *
 * The controller uses this DTO to validate and document the member id path
 * parameter before passing it to `ForumsModerationService`.
 */
export class MemberBanParamDto {
  @ApiProperty({ description: 'Member id to ban or unban.', maxLength: 64 })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  memberId: string;
}

/**
 * Route parameters for IP ban moderation operations.
 *
 * The route accepts only exact bare IPv4 or IPv6 host values. CIDR, wildcard,
 * comma-delimited, bracketed IPv6, host:port, quoted, and invalid text inputs
 * are rejected before persistence.
 */
export class IpBanParamDto {
  @ApiProperty({
    description:
      'Exact bare IPv4 or IPv6 host value. CIDR, wildcards, comma-delimited values, bracketed IPv6, host:port, quoted values, and invalid text are rejected.',
    maxLength: 45,
    examples: ['203.0.113.10', '2001:db8::1'],
  })
  @IsString()
  @MinLength(1)
  @MaxLength(45)
  @Matches(BARE_IP_ADDRESS_PATTERN, {
    message: 'ipAddress must be an exact bare IPv4 or IPv6 host value.',
  })
  @IsIP(undefined, {
    message: 'ipAddress must be an exact bare IPv4 or IPv6 host value.',
  })
  ipAddress: string;
}
