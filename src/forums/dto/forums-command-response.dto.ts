import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Topic response returned by command-side forum endpoints.
 *
 * The DTO documents the stable command response returned after create, update,
 * and soft-delete commands. Storage-only moderation fields such as topic lock
 * persistence columns stay internal until the command contract explicitly
 * exposes API-facing lock metadata.
 */
export class ForumTopicCommandResponseDto {
  @ApiProperty({ description: 'Topic id.' })
  id: string;

  @ApiPropertyOptional({
    description: 'Parent topic id for child topics.',
    nullable: true,
  })
  parentTopicId: string | null;

  @ApiPropertyOptional({
    description: 'Direct challenge restriction stored on the topic.',
    nullable: true,
  })
  challengeId: string | null;

  @ApiPropertyOptional({
    description: 'Direct role restriction stored on the topic.',
    nullable: true,
  })
  roleName: string | null;

  @ApiProperty({ description: 'Topic title.' })
  title: string;

  @ApiProperty({ description: 'Whether the topic is an announcement.' })
  isAnnouncement: boolean;

  @ApiProperty({
    description: 'Member id captured on the topic author snapshot.',
  })
  authorMemberId: string;

  @ApiProperty({ description: 'Handle captured on the topic author snapshot.' })
  authorHandle: string;

  @ApiProperty({ description: 'Topic creation timestamp.' })
  createdAt: Date;

  @ApiProperty({ description: 'Topic update timestamp.' })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Soft-delete timestamp, or null for active topics.',
    nullable: true,
  })
  deletedAt: Date | null;

  @ApiPropertyOptional({
    description:
      'Member id that soft-deleted the topic, or null for active topics.',
    nullable: true,
  })
  deletedByMemberId: string | null;
}

/**
 * Post row returned by command-side forum endpoints.
 *
 * The DTO documents persisted post fields returned after create, update, and
 * soft-delete commands. Deleted posts retain identity while `content` becomes
 * null.
 */
export class ForumPostCommandResponseDto {
  @ApiProperty({ description: 'Post id.' })
  id: string;

  @ApiProperty({ description: 'Owning topic id.' })
  topicId: string;

  @ApiProperty({
    description: 'Parent target type for this post.',
    enum: ['TOPIC', 'POST'],
  })
  parentType: string;

  @ApiProperty({ description: 'Parent topic or post id.' })
  parentId: string;

  @ApiProperty({
    description: 'Member id captured on the post author snapshot.',
  })
  authorMemberId: string;

  @ApiProperty({ description: 'Handle captured on the post author snapshot.' })
  authorHandle: string;

  @ApiPropertyOptional({
    description: 'Markdown content, or null for deleted placeholders.',
    nullable: true,
  })
  content: string | null;

  @ApiProperty({ description: 'Post creation timestamp.' })
  createdAt: Date;

  @ApiProperty({ description: 'Post update timestamp.' })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Soft-delete timestamp, or null for active posts.',
    nullable: true,
  })
  deletedAt: Date | null;

  @ApiPropertyOptional({
    description:
      'Member id that soft-deleted the post, or null for active posts.',
    nullable: true,
  })
  deletedByMemberId: string | null;
}

/**
 * Response returned after creating a topic and starter post.
 */
export class CreateTopicCommandResponseDto {
  @ApiProperty({
    description: 'Created topic command response.',
    type: ForumTopicCommandResponseDto,
  })
  topic: ForumTopicCommandResponseDto;

  @ApiProperty({
    description: 'Starter post created with the topic.',
    type: ForumPostCommandResponseDto,
  })
  starterPost: ForumPostCommandResponseDto;
}

/**
 * Persisted topic-watch row returned after adding a watch.
 */
export class TopicWatchCommandResponseDto {
  @ApiProperty({ description: 'Watched topic id.' })
  topicId: string;

  @ApiProperty({ description: 'Member id that owns the watch.' })
  memberId: string;

  @ApiProperty({ description: 'Watch creation timestamp.' })
  createdAt: Date;
}

/**
 * Watch state returned after removing a watch row.
 */
export class TopicWatchStateCommandResponseDto {
  @ApiProperty({ description: 'Topic id.' })
  topicId: string;

  @ApiProperty({ description: 'Member id that owns the watch state.' })
  memberId: string;

  @ApiProperty({ description: 'Whether the member is currently watching.' })
  watching: boolean;
}

/**
 * Persisted topic read-state row returned after marking a topic read.
 */
export class TopicReadStateCommandResponseDto {
  @ApiProperty({ description: 'Topic id.' })
  topicId: string;

  @ApiProperty({ description: 'Member id that owns the read state.' })
  memberId: string;

  @ApiProperty({
    description: 'Timestamp through which topic activity is read.',
  })
  lastReadAt: Date;

  @ApiProperty({ description: 'Read-state update timestamp.' })
  updatedAt: Date;
}
