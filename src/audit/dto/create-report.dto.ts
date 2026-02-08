import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportType, ReportFormat } from '../entities/audit-report.entity';

export class CreateReportDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ReportType })
  @IsEnum(ReportType)
  @IsNotEmpty()
  type: ReportType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  filters?: {
    userId?: string;
    institutionId?: string;
    actions?: string[];
    categories?: string[];
    severities?: string[];
    entityTypes?: string[];
  };

  @ApiProperty({ enum: ReportFormat, default: ReportFormat.PDF })
  @IsEnum(ReportFormat)
  @IsOptional()
  format?: ReportFormat;
}