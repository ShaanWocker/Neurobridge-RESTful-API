import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsObject,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SearchScope } from '../entities/saved-search.entity';

export class CreateSavedSearchDto {
  @ApiProperty({ example: 'ADHD Schools in Cape Town' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Quick search for ADHD specialized schools' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: SearchScope })
  @IsEnum(SearchScope)
  @IsNotEmpty()
  scope: SearchScope;

  @ApiProperty({
    example: {
      specializations: ['ADHD Support'],
      city: 'Cape Town',
      hasCapacity: true,
    },
  })
  @IsObject()
  @IsNotEmpty()
  filters: Record<string, any>;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isShared?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  sharedWith?: string[];
}