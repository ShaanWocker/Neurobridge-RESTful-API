import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsObject,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction, AuditSeverity, AuditCategory } from '../entities/audit-log.entity';

export class CreateAuditLogDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  institutionId?: string;

  @ApiProperty({ enum: AuditAction })
  @IsEnum(AuditAction)
  @IsNotEmpty()
  action: AuditAction;

  @ApiProperty({ enum: AuditCategory })
  @IsEnum(AuditCategory)
  @IsNotEmpty()
  category: AuditCategory;

  @ApiPropertyOptional({ enum: AuditSeverity, default: AuditSeverity.INFO })
  @IsEnum(AuditSeverity)
  @IsOptional()
  severity?: AuditSeverity;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  entityId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  entityName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  previousValues?: Record<string, any>;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  newValues?: Record<string, any>;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  success?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  errorMessage?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  statusCode?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  containsPII?: boolean;
}