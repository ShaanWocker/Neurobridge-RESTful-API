import {
  IsOptional,
  IsEnum,
  IsUUID,
  IsString,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MessageCategory, MessagePriority, MessageStatus } from '../entities/message.entity';
import { PaginationDto } from '@common/dto/pagination.dto';

export class SearchMessageDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  fromInstitutionId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  toInstitutionId?: string;

  @ApiPropertyOptional({ enum: MessageCategory })
  @IsEnum(MessageCategory)
  @IsOptional()
  category?: MessageCategory;

  @ApiPropertyOptional({ enum: MessagePriority })
  @IsEnum(MessagePriority)
  @IsOptional()
  priority?: MessagePriority;

  @ApiPropertyOptional({ enum: MessageStatus })
  @IsEnum(MessageStatus)
  @IsOptional()
  status?: MessageStatus;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  learnerId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  transferId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  unreadOnly?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  starred?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  archived?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  threadId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  toDate?: string;
}