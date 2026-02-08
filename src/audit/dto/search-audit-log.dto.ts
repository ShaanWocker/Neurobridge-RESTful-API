import {
  IsOptional,
  IsEnum,
  IsString,
  IsUUID,
  IsDateString,
  IsArray,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction, AuditSeverity, AuditCategory } from '../entities/audit-log.entity';
import { PaginationDto } from '@common/dto/pagination.dto';

export class SearchAuditLogDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  institutionId?: string;

  @ApiPropertyOptional({ enum: AuditAction })
  @IsEnum(AuditAction)
  @IsOptional()
  action?: AuditAction;

  @ApiPropertyOptional({ enum: AuditCategory })
  @IsEnum(AuditCategory)
  @IsOptional()
  category?: AuditCategory;

  @ApiPropertyOptional({ enum: AuditSeverity })
  @IsEnum(AuditSeverity)
  @IsOptional()
  severity?: AuditSeverity;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  entityType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  entityId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  @IsEnum(AuditAction, { each: true })
  actions?: AuditAction[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  @IsEnum(AuditCategory, { each: true })
  categories?: AuditCategory[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  tags?: string[];
}