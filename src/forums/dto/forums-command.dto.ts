import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PostReactionType } from '../../../prisma/generated/client';

/**
 * Request body for creating a topic with its starter post.
 *
 * The DTO is used by the topic command controller. Topic creation is
 * transactional and the starter post content is persisted as the first post in
 * the new topic. Challenge ids are valid for top-level challenge topics. Child
 * topic creation only supports resolved effective non-challenge contexts, so
 * requests are rejected whenever inheritance or input produces a non-null
 * effective challenge id. Role restrictions inherit from parent topics and can
 * only narrow visibility.
 */
export class CreateTopicDto {
  @ApiProperty({ description: 'Topic title.', maxLength: 255 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Markdown content for the starter post.' })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiPropertyOptional({
    description:
      'Direct parent topic id when creating a child topic. Child topics are only supported when the resolved effective context remains non-challenge.',
    maxLength: 14,
  })
  @IsOptional()
  @IsString()
  @MaxLength(14)
  parentTopicId?: string;

  @ApiPropertyOptional({
    description:
      'Challenge id for top-level challenge topics. Child-topic creation is rejected whenever inherited or requested restrictions resolve to a non-null challenge id.',
    maxLength: 64,
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  challengeId?: string;

  @ApiPropertyOptional({
    description:
      'Role restriction string. Values are normalized to lowercase; child topics inherit parent role restrictions and cannot clear or replace them.',
    maxLength: 128,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  roleName?: string | null;

  @ApiPropertyOptional({
    description:
      'Whether the topic is an announcement. Setting this requires elevated announcement-control access.',
  })
  @IsOptional()
  @IsBoolean()
  isAnnouncement?: boolean;
}

/**
 * Request body for updating mutable topic metadata.
 *
 * The DTO is intentionally limited to command-side fields from this batch:
 * title, announcement state, and the normalized role restriction string.
 * Role updates may only add or preserve restrictions; they cannot widen
 * existing visibility.
 */
export class UpdateTopicDto {
  @ApiPropertyOptional({ description: 'Updated topic title.', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description:
      'Updated announcement state. Changing it requires elevated announcement-control access.',
  })
  @IsOptional()
  @IsBoolean()
  isAnnouncement?: boolean;

  @ApiPropertyOptional({
    description:
      'Updated role restriction string. It is normalized to lowercase and cannot clear or replace an inherited or existing role restriction.',
    maxLength: 128,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  roleName?: string | null;
}

/**
 * Request body for creating a post or reply inside an existing topic.
 *
 * `parentType` and `parentId` model polymorphic parentage. When omitted, the
 * post is attached directly to the topic as a top-level reply. Posts inherit
 * the owning topic's challenge and role restrictions completely.
 */
export class CreatePostDto {
  @ApiProperty({ description: 'Markdown content for the post.' })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiPropertyOptional({
    description: 'Parent target type for the new post.',
    enum: ['TOPIC', 'POST'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['TOPIC', 'POST'])
  parentType?: string;

  @ApiPropertyOptional({
    description: 'Parent topic or post id matching parentType.',
    maxLength: 14,
  })
  @IsOptional()
  @IsString()
  @MaxLength(14)
  parentId?: string;
}

/**
 * Request body for member-targeted watch and read-state commands.
 *
 * Human member tokens always target their authenticated member id. Scoped M2M
 * callers must provide `memberId`, and that id must resolve in both the
 * external Members and Identity data before watch or read-state writes proceed.
 */
export class MemberTargetDto {
  @ApiPropertyOptional({
    description:
      'Target member id for scoped M2M on-behalf watch and read-state calls. It must resolve in external Members and Identity data before the write proceeds. Human member tokens target themselves.',
    maxLength: 64,
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  memberId?: string;
}

/**
 * Request body for updating an existing post.
 *
 * The DTO updates only markdown content. Post parentage and topic ownership are
 * immutable in this batch.
 */
export class UpdatePostDto {
  @ApiProperty({ description: 'Updated markdown content for the post.' })
  @IsString()
  @MinLength(1)
  content: string;
}

/**
 * Request body for setting the authenticated member's reaction on a post.
 *
 * A member has at most one reaction per post. Sending the other reaction type
 * replaces the existing value; removing a reaction uses the DELETE endpoint.
 */
export class SetPostReactionDto {
  @ApiProperty({
    description: 'Thumb reaction to add or replace for the current member.',
    enum: PostReactionType,
  })
  @IsEnum(PostReactionType)
  reaction: PostReactionType;
}
