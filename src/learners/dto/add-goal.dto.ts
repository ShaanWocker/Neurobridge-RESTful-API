import { IsString, IsNotEmpty, IsDate, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum GoalStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  ACHIEVED = 'achieved',
  DISCONTINUED = 'discontinued',
}

export class AddGoalDto {
  @ApiProperty({ example: 'Improve reading comprehension' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'academic' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: '2024-12-31' })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  targetDate: Date;

  @ApiPropertyOptional({ enum: GoalStatus, default: GoalStatus.NOT_STARTED })
  @IsEnum(GoalStatus)
  @IsOptional()
  status?: GoalStatus;

  @ApiPropertyOptional({ example: 25 })
  @IsNumber()
  @IsOptional()
  progress?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}