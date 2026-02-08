import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsObject,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@common/dto/pagination.dto';
import { InstitutionType, VerificationStatus } from '@institutions/entities/institution.entity';
import { LearnerStatus } from '@learners/entities/learner.entity';
import { TransferStatus } from '@transfers/entities/transfer.entity';
import { MessageStatus, MessageCategory } from '@messages/entities/message.entity';

export class AdvancedSearchDto extends PaginationDto {
  // Global search
  @ApiPropertyOptional({ example: 'ADHD support Cape Town' })
  @IsString()
  @IsOptional()
  globalSearch?: string;

  // Institution filters
  @ApiPropertyOptional({ enum: InstitutionType })
  @IsEnum(InstitutionType)
  @IsOptional()
  institutionType?: InstitutionType;

  @ApiPropertyOptional({ enum: VerificationStatus })
  @IsEnum(VerificationStatus)
  @IsOptional()
  verificationStatus?: VerificationStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  province?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  specializations?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  supportNeeds?: string[];

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

  @ApiPropertyOptional()
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  hasCapacity?: boolean;

  // Learner filters
  @ApiPropertyOptional({ enum: LearnerStatus })
  @IsEnum(LearnerStatus)
  @IsOptional()
  learnerStatus?: LearnerStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  caseNumber?: string;

  // Transfer filters
  @ApiPropertyOptional({ enum: TransferStatus })
  @IsEnum(TransferStatus)
  @IsOptional()
  transferStatus?: TransferStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  transferNumber?: string;

  // Message filters
  @ApiPropertyOptional({ enum: MessageStatus })
  @IsEnum(MessageStatus)
  @IsOptional()
  messageStatus?: MessageStatus;

  @ApiPropertyOptional({ enum: MessageCategory })
  @IsEnum(MessageCategory)
  @IsOptional()
  messageCategory?: MessageCategory;

  @ApiPropertyOptional()
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  unreadOnly?: boolean;

  // Date range
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  toDate?: string;

  // Sorting
  @ApiPropertyOptional({ example: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsEnum(['ASC', 'DESC'])
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC';
}