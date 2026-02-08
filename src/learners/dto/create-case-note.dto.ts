import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsDate,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CaseNoteType, CaseNotePriority } from '../entities/case-note.entity';

export class CreateCaseNoteDto {
  @ApiProperty({ enum: CaseNoteType })
  @IsEnum(CaseNoteType)
  @IsNotEmpty()
  type: CaseNoteType;

  @ApiPropertyOptional({ enum: CaseNotePriority, default: CaseNotePriority.MEDIUM })
  @IsEnum(CaseNotePriority)
  @IsOptional()
  priority?: CaseNotePriority;

  @ApiProperty({ example: 'Progress Update - Reading Skills' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Learner showed significant improvement...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: ['reading', 'progress', 'phonics'] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  requiresFollowUp?: boolean;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  followUpDate?: Date;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  visibleToTransferringInstitution?: boolean;
}