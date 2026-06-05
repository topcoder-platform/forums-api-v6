import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Query parameters for paginated forum topic list reads.
 *
 * The DTO is consumed by root topic list routes. Pagination is applied after
 * access-policy filtering so `totalCount` reflects only topics visible to the
 * caller.
 */
export class ForumsTopicListQueryDto {
  @ApiProperty({
    description: 'Page number, starting at 1.',
    default: 1,
    required: false,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of topics per page.',
    default: 10,
    required: false,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  perPage?: number = 10;
}

/**
 * Pagination metadata returned by paginated forum topic list reads.
 *
 * The shape matches the v6 review APIs so clients can consume forums pages with
 * the same `page`, `perPage`, `totalCount`, and `totalPages` contract.
 */
export class ForumsPaginationMetaDto {
  @ApiProperty({ description: 'Current page number.' })
  page: number;

  @ApiProperty({ description: 'Requested number of items per page.' })
  perPage: number;

  @ApiProperty({
    description: 'Number of visible topics after authorization filtering.',
  })
  totalCount: number;

  @ApiProperty({
    description: 'Number of pages available for the visible topic count.',
  })
  totalPages: number;
}

/**
 * Nullable latest-visible-activity snapshot for a forum topic summary.
 *
 * The snapshot is populated from the newest non-deleted post in the topic. It
 * is `null` when every post in the topic is a deleted placeholder.
 */
export class ForumsLatestActivityDto {
  @ApiProperty({ description: 'Latest visible post id.' })
  postId: string;

  @ApiProperty({
    description:
      'Member id captured on the latest visible post author snapshot.',
  })
  authorMemberId: string;

  @ApiProperty({
    description: 'Handle captured on the latest visible post author snapshot.',
  })
  authorHandle: string;

  @ApiProperty({
    description: 'Creation timestamp of the latest visible post.',
  })
  createdAt: Date;
}

/**
 * Topic summary returned by list routes and reused as the topic detail header.
 *
 * `postsCount` counts only non-deleted posts. `latestActivity` is nullable when
 * no non-deleted posts remain, and `unread` is derived from
 * `TopicReadState.lastReadAt` compared with the latest visible activity.
 */
export class ForumsTopicSummaryDto {
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
    description: 'Direct normalized role restriction stored on the topic.',
    nullable: true,
  })
  roleName: string | null;

  @ApiProperty({ description: 'Topic title.' })
  title: string;

  @ApiProperty({
    description: 'Whether the topic is pinned as an announcement.',
  })
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

  @ApiProperty({
    description: 'Number of non-deleted posts visible in this topic.',
  })
  postsCount: number;

  @ApiPropertyOptional({
    description: 'Newest non-deleted post snapshot, or null when none remain.',
    nullable: true,
    type: ForumsLatestActivityDto,
  })
  latestActivity: ForumsLatestActivityDto | null;

  @ApiProperty({
    description:
      'Whether the latest visible activity is newer than the caller read state.',
  })
  unread: boolean;
}

/**
 * Paginated response for forum topic summaries.
 *
 * The response mirrors the v6 review pagination contract while containing only
 * topics that passed forums access-policy filtering.
 */
export class ForumsTopicSummaryPageDto {
  @ApiProperty({
    description: 'Visible topic summaries for the requested page.',
    type: [ForumsTopicSummaryDto],
  })
  data: ForumsTopicSummaryDto[];

  @ApiProperty({
    description: 'Pagination metadata for the visible result set.',
    type: ForumsPaginationMetaDto,
  })
  meta: ForumsPaginationMetaDto;
}

/**
 * Embedded post tree node returned by topic detail reads.
 *
 * Soft-deleted posts remain in the tree as placeholders with `deleted=true`
 * and `content=null`, preserving reply structure without exposing deleted
 * content.
 */
export class ForumsPostTreeNodeDto {
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

  @ApiProperty({ description: 'Whether the post is a deleted placeholder.' })
  deleted: boolean;

  @ApiProperty({
    description: 'Nested replies ordered by newest visible subtree activity.',
    type: () => [ForumsPostTreeNodeDto],
  })
  replies: ForumsPostTreeNodeDto[];
}

/**
 * Topic detail response with an embedded post tree.
 *
 * Detail reads are protected by `read:forums-topics`, including the embedded
 * posts. The reserved `read:forums-posts` scope is not required for this v1
 * topic-detail surface.
 */
export class ForumsTopicDetailDto {
  @ApiProperty({
    description: 'Topic summary header for the requested topic.',
    type: ForumsTopicSummaryDto,
  })
  topic: ForumsTopicSummaryDto;

  @ApiProperty({
    description: 'Top-level posts and nested replies for the topic.',
    type: [ForumsPostTreeNodeDto],
  })
  posts: ForumsPostTreeNodeDto[];
}
