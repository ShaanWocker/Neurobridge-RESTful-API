import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransferStatus, TransferPriority } from '../entities/transfer.entity';
import { PaginationDto } from '@common/dto/pagination.dto';

export class SearchTransferDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  learnerId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  fromInstitutionId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  toInstitutionId?: string;

  @ApiPropertyOptional({ enum: TransferStatus })
  @IsEnum(TransferStatus)
  @IsOptional()
  status?: TransferStatus;

  @ApiPropertyOptional({ enum: TransferPriority })
  @IsEnum(TransferPriority)
  @IsOptional()
  priority?: TransferPriority;
}