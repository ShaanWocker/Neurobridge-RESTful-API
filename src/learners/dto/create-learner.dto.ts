import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDate,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '../entities/learner.entity';

export class EmergencyContactDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  relationship: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string;
}

export class DiagnosisDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  condition: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  diagnosedDate: Date;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  diagnosedBy: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class InterventionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  frequency: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateLearnerDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '2010-05-15' })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  dateOfBirth: Date;

  @ApiPropertyOptional({ enum: Gender })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  currentInstitutionId: string;

  @ApiProperty({ example: '2024-01-15' })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  enrollmentDate: Date;

  @ApiPropertyOptional({ example: 'Grade 5' })
  @IsString()
  @IsOptional()
  currentGrade?: string;

  @ApiPropertyOptional({ type: [DiagnosisDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DiagnosisDto)
  diagnoses?: DiagnosisDto[];

  @ApiPropertyOptional({ example: ['ADHD Support', 'Reading Support'] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  supportNeeds?: string[];

  @ApiPropertyOptional({ type: [InterventionDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => InterventionDto)
  interventions?: InterventionDto[];

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  academicProfile?: {
    strengths?: string[];
    challenges?: string[];
    learningStyle?: string;
    accommodations?: string[];
  };

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  behavioralProfile?: {
    strengths?: string[];
    challenges?: string[];
    triggers?: string[];
    strategies?: string[];
  };

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  socialProfile?: {
    strengths?: string[];
    challenges?: string[];
    peerInteractions?: string;
    communication?: string;
  };

  @ApiPropertyOptional({ type: EmergencyContactDto })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;

  @ApiPropertyOptional({ example: ['Peanuts', 'Latex'] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  allergies?: string[];

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  consentForSharing?: boolean;
}