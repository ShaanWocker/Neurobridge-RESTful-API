import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateTransferDto } from './create-transfer.dto';

export class UpdateTransferDto extends PartialType(
  OmitType(CreateTransferDto, ['learnerId', 'toInstitutionId'] as const),
) {}