import { IsOptional, IsEnum, IsString, IsInt, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { InstitutionType, VerificationStatus } from '../entities/institution.entity';
import { PaginationDto } from '@common/dto/pagination.dto';

export class SearchInstitutionDto extends PaginationDto {
  @ApiPropertyOptional({ enum: InstitutionType })
  @IsEnum(InstitutionType)
  @IsOptional()
  type?: InstitutionType;

  @ApiPropertyOptional({ enum: VerificationStatus })
  @IsEnum(VerificationStatus)
  @IsOptional()
  verificationStatus?: VerificationStatus;

  @ApiPropertyOptional({ example: 'Cape Town' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Western Cape' })
  @IsString()
  @IsOptional()
  province?: string;

  @ApiPropertyOptional({ example: 'ADHD Support' })
  @IsString()
  @IsOptional()
  specialization?: string;

  @ApiPropertyOptional({ example: 'Speech Therapy' })
  @IsString()
  @IsOptional()
  supportNeed?: string;

  @ApiPropertyOptional({ example: 7 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(25)
  minAge?: number;

  @ApiPropertyOptional({ example: 15 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(25)
  maxAge?: number;

  @ApiPropertyOptional({ example: 'Oakwood' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: true })
  @Type(() => Boolean)
  @IsOptional()
  hasCapacity?: boolean;
}