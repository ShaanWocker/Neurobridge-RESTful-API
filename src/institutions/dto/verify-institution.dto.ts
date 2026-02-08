import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VerificationStatus } from '../entities/institution.entity';

export class VerifyInstitutionDto {
  @ApiProperty({
    enum: [VerificationStatus.VERIFIED, VerificationStatus.REJECTED],
    example: VerificationStatus.VERIFIED,
  })
  @IsEnum([VerificationStatus.VERIFIED, VerificationStatus.REJECTED])
  @IsNotEmpty()
  status: VerificationStatus;

  @ApiPropertyOptional({ example: 'All documents verified and in order' })
  @IsString()
  @IsOptional()
  notes?: string;
}