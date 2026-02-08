import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsDate,
  IsArray,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageCategory, MessagePriority } from '../entities/message.entity';

export class CreateMessageDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  toInstitutionId: string;

  @ApiProperty({ example: 'Inquiry about transition support for learner JM' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @ApiProperty({ example: 'We would like to discuss transition support options...' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ enum: MessageCategory, default: MessageCategory.GENERAL })
  @IsEnum(MessageCategory)
  @IsOptional()
  category?: MessageCategory;

  @ApiPropertyOptional({ enum: MessagePriority, default: MessagePriority.NORMAL })
  @IsEnum(MessagePriority)
  @IsOptional()
  priority?: MessagePriority;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  @IsOptional()
  learnerId?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174002' })
  @IsUUID()
  @IsOptional()
  transferId?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174003' })
  @IsUUID()
  @IsOptional()
  replyToId?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  requiresResponse?: boolean;

  @ApiPropertyOptional({ example: '2024-03-15' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  responseDeadline?: Date;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  confidential?: boolean;

  @ApiPropertyOptional({ example: ['urgent', 'autism-support'] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}