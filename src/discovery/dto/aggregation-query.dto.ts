import { IsEnum, IsOptional, IsArray, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum AggregationType {
  COUNT = 'count',
  SUM = 'sum',
  AVG = 'avg',
  MIN = 'min',
  MAX = 'max',
}

export enum AggregationField {
  INSTITUTION_TYPE = 'institutionType',
  VERIFICATION_STATUS = 'verificationStatus',
  LEARNER_STATUS = 'learnerStatus',
  TRANSFER_STATUS = 'transferStatus',
  MESSAGE_CATEGORY = 'messageCategory',
  CITY = 'city',
  PROVINCE = 'province',
  SPECIALIZATIONS = 'specializations',
  SUPPORT_NEEDS = 'supportNeeds',
}

export class AggregationQueryDto {
  @ApiPropertyOptional({ type: [String], enum: AggregationField })
  @IsArray()
  @IsOptional()
  @IsEnum(AggregationField, { each: true })
  groupBy?: AggregationField[];

  @ApiPropertyOptional({ enum: AggregationType })
  @IsEnum(AggregationType)
  @IsOptional()
  aggregationType?: AggregationType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  institutionId?: string;
}