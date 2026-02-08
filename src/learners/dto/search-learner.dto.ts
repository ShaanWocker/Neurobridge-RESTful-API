import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LearnerStatus } from '../entities/learner.entity';
import { PaginationDto } from '@common/dto/pagination.dto';

export class SearchLearnerDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  institutionId?: string;

  @ApiPropertyOptional({ enum: LearnerStatus })
  @IsEnum(LearnerStatus)
  @IsOptional()
  status?: LearnerStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  caseNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  supportNeed?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  grade?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(25)
  minAge?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(25)
  maxAge?: number;
}