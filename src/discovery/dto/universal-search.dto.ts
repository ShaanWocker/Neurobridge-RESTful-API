import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@common/dto/pagination.dto';

export enum SearchEntity {
  INSTITUTIONS = 'institutions',
  LEARNERS = 'learners',
  TRANSFERS = 'transfers',
  MESSAGES = 'messages',
  USERS = 'users',
}

export class UniversalSearchDto extends PaginationDto {
  @ApiProperty({ example: 'autism support' })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiPropertyOptional({ type: [String], enum: SearchEntity })
  @IsArray()
  @IsOptional()
  @IsEnum(SearchEntity, { each: true })
  entities?: SearchEntity[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  institutionId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({ example: false })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  includeArchived?: boolean;
}