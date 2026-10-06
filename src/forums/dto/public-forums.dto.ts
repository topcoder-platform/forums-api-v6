import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Max, MaxLength } from 'class-validator';
import {
  ForumsTopicListQueryDto,
  ForumsTopicSummaryDto,
} from './forums-read.dto';

/** Validated public search/list inputs. Pagination follows visibility filtering. */
export class PublicForumsQueryDto extends ForumsTopicListQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(14)
  @ApiPropertyOptional()
  categoryId?: string;
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @ApiPropertyOptional()
  search?: string;
  @IsOptional()
  @IsIn(['true', 'false'])
  @ApiPropertyOptional()
  watching?: string;
  @IsOptional()
  @IsIn(['active', 'recent', 'oldest'])
  @ApiPropertyOptional()
  sort?: string;
  @Max(100)
  perPage?: number = 20;
}

/** Visible category metadata and summary; content counts exclude inaccessible descendants. */
export interface PublicForumCategoryDto extends ForumsTopicSummaryDto {
  description: string;
  displayAs: string;
  sortOrder: number;
  topicsCount: number;
  canCreate: boolean;
}
