import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Topic lock state returned by moderation lock and unlock routes.
 *
 * The DTO exposes only API-facing lock metadata. It is used by the moderation
 * controller after `ForumsModerationService` updates or reads the persisted
 * topic lock columns.
 */
export class TopicLockStateDto {
  @ApiProperty({ description: 'Topic id whose lock state was resolved.' })
  topicId: string;

  @ApiProperty({ description: 'Whether the topic is currently locked.' })
  locked: boolean;

  @ApiPropertyOptional({
    description:
      'Member id that locked the topic, or null for unlocked or legacy imported locks.',
    nullable: true,
  })
  lockedBy: string | null;

  @ApiPropertyOptional({
    description:
      'Timestamp when the topic was locked, or null for unlocked or legacy imported locks.',
    nullable: true,
  })
  lockedAt: Date | null;

  @ApiProperty({ description: 'Topic update timestamp after the operation.' })
  updatedAt: Date;
}

/**
 * Member ban state returned by member ban and unban moderation routes.
 *
 * The DTO maps one persisted `MemberBan` row and derives `active` from the
 * nullable removal timestamp so callers do not need to understand the storage
 * convention.
 */
export class MemberBanStateDto {
  @ApiProperty({ description: 'Member ban row id.' })
  id: string;

  @ApiProperty({ description: 'Banned member id.' })
  memberId: string;

  @ApiProperty({
    description: 'Whether this member ban row is currently active.',
  })
  active: boolean;

  @ApiProperty({ description: 'Ban creation timestamp.' })
  createdAt: Date;

  @ApiPropertyOptional({
    description:
      'Human administrator member id that created the ban, or null for M2M moderation.',
    nullable: true,
  })
  createdByMemberId: string | null;

  @ApiPropertyOptional({
    description: 'Ban removal timestamp, or null while active.',
    nullable: true,
  })
  removedAt: Date | null;

  @ApiPropertyOptional({
    description:
      'Human administrator member id that removed the ban, or null for M2M moderation or active bans.',
    nullable: true,
  })
  removedByMemberId: string | null;
}

/**
 * IP ban state returned by IP ban and unban moderation routes.
 *
 * The DTO maps one persisted `IpBan` row and derives `active` from the nullable
 * removal timestamp. IP values are exact canonical IPv4 or IPv6 host strings.
 */
export class IpBanStateDto {
  @ApiProperty({ description: 'IP ban row id.' })
  id: string;

  @ApiProperty({
    description: 'Exact bare IPv4 or IPv6 host value targeted by this ban.',
  })
  ipAddress: string;

  @ApiProperty({ description: 'Whether this IP ban row is currently active.' })
  active: boolean;

  @ApiProperty({ description: 'Ban creation timestamp.' })
  createdAt: Date;

  @ApiPropertyOptional({
    description:
      'Human administrator member id that created the ban, or null for M2M moderation.',
    nullable: true,
  })
  createdByMemberId: string | null;

  @ApiPropertyOptional({
    description: 'Ban removal timestamp, or null while active.',
    nullable: true,
  })
  removedAt: Date | null;

  @ApiPropertyOptional({
    description:
      'Human administrator member id that removed the ban, or null for M2M moderation or active bans.',
    nullable: true,
  })
  removedByMemberId: string | null;
}
