import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsArray,
  IsObject,
  IsNumber,
  Min,
  Max,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InstitutionType } from '../entities/institution.entity';

export class ProgramDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  ageRange: string;

  @ApiProperty()
  @IsInt()
  capacity: number;
}

export class OperatingHoursDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  monday?: { open: string; close: string };

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  tuesday?: { open: string; close: string };

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  wednesday?: { open: string; close: string };

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  thursday?: { open: string; close: string };

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  friday?: { open: string; close: string };

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  saturday?: { open: string; close: string };

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  sunday?: { open: string; close: string };
}

export class CreateInstitutionDto {
  @ApiProperty({ example: 'Oakwood Academy' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: InstitutionType, example: InstitutionType.SCHOOL })
  @IsEnum(InstitutionType)
  @IsNotEmpty()
  type: InstitutionType;

  @ApiProperty({ example: 'admin@oakwood.edu' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+27123456789' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiPropertyOptional({ example: 'https://oakwood.edu' })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiProperty({ example: '123 Education Street' })
  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @ApiPropertyOptional({ example: 'Suite 100' })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @ApiProperty({ example: 'Cape Town' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Western Cape' })
  @IsString()
  @IsNotEmpty()
  province: string;

  @ApiProperty({ example: '8001' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiProperty({ example: 'South Africa' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiPropertyOptional({ example: -33.9249 })
  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 18.4241 })
  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ example: 'Leading neurodiverse education institution' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mission?: string;

  @ApiPropertyOptional({ example: 'REG123456' })
  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @ApiPropertyOptional({ example: 'UMALUSI Accredited' })
  @IsString()
  @IsOptional()
  accreditation?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsInt()
  @IsOptional()
  @Min(0)
  currentCapacity?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsInt()
  @IsOptional()
  @Min(0)
  maxCapacity?: number;

  @ApiPropertyOptional({ example: 6 })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(25)
  minAgeSupported?: number;

  @ApiPropertyOptional({ example: 18 })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(25)
  maxAgeSupported?: number;

  @ApiPropertyOptional({
    example: ['ADHD Support', 'Autism Spectrum', 'Dyslexia'],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  specializations?: string[];

  @ApiPropertyOptional({
    example: ['Speech Therapy', 'Occupational Therapy', 'Behavioral Support'],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  supportNeeds?: string[];

  @ApiPropertyOptional({ type: [ProgramDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProgramDto)
  programs?: ProgramDto[];

  @ApiPropertyOptional({ example: 25 })
  @IsInt()
  @IsOptional()
  @Min(0)
  totalStaff?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsInt()
  @IsOptional()
  @Min(0)
  specializedStaff?: number;

  @ApiPropertyOptional({
    example: ['Special Education Degree', 'Remedial Therapy Certification'],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  qualifications?: string[];

  @ApiPropertyOptional({
    example: ['Sensory Room', 'Playground', 'Computer Lab'],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  facilities?: string[];

  @ApiPropertyOptional({ type: OperatingHoursDto })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  operatingHours?: OperatingHoursDto;

  @ApiPropertyOptional({
    example: {
      facebook: 'https://facebook.com/oakwood',
      twitter: 'https://twitter.com/oakwood',
    },
  })
  @IsObject()
  @IsOptional()
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
}