import { IsNotEmpty, IsOptional, IsDate, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompletionChecklistDto {
  @ApiProperty()
  documentsTransferred: boolean;

  @ApiProperty()
  caseNotesShared: boolean;

  @ApiProperty()
  parentNotified: boolean;

  @ApiProperty()
  enrollmentCompleted: boolean;

  @ApiProperty()
  previousInstitutionNotified: boolean;

  @ApiProperty()
  transitionPlanCreated: boolean;
}

export class CompleteTransferDto {
  @ApiProperty({ type: CompletionChecklistDto })
  @ValidateNested()
  @Type(() => CompletionChecklistDto)
  @IsNotEmpty()
  completionChecklist: CompletionChecklistDto;

  @ApiPropertyOptional({ example: '2024-03-01' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  actualTransferDate?: Date;
}