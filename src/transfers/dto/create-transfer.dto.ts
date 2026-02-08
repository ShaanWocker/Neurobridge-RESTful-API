import {
  IsUUID,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsDate,
  IsOptional,
  IsBoolean,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransferReason, TransferPriority } from '../entities/transfer.entity';

export class HandoverSummaryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currentStatus: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  keyAchievements: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  ongoingChallenges: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  recommendedStrategies: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  specialConsiderations?: string[];
}

export class CreateTransferDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  learnerId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  @IsNotEmpty()
  toInstitutionId: string;

  @ApiProperty({ enum: TransferReason, example: TransferReason.SPECIALIZED_SUPPORT_NEEDED })
  @IsEnum(TransferReason)
  @IsNotEmpty()
  reason: TransferReason;

  @ApiProperty({ example: 'Learner requires specialized autism support services' })
  @IsString()
  @IsNotEmpty()
  reasonDetails: string;

  @ApiProperty({ example: '2024-03-01' })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  proposedTransferDate: Date;

  @ApiPropertyOptional({ enum: TransferPriority, default: TransferPriority.NORMAL })
  @IsEnum(TransferPriority)
  @IsOptional()
  priority?: TransferPriority;

  @ApiPropertyOptional({ type: HandoverSummaryDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HandoverSummaryDto)
  handoverSummary?: HandoverSummaryDto;

  @ApiPropertyOptional({ example: ['note-id-1', 'note-id-2'] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  sharedCaseNotes?: string[];

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  coordinationMeetingRequired?: boolean;
}