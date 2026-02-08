import { IsEnum, IsNotEmpty, IsOptional, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransferStatus } from '../entities/transfer.entity';

export class ReviewTransferDto {
  @ApiProperty({
    enum: [TransferStatus.APPROVED, TransferStatus.REJECTED],
    example: TransferStatus.APPROVED,
  })
  @IsEnum([TransferStatus.APPROVED, TransferStatus.REJECTED])
  @IsNotEmpty()
  status: TransferStatus.APPROVED | TransferStatus.REJECTED;

  @ApiPropertyOptional({ example: 'Transfer approved with conditions...' })
  @IsString()
  @IsOptional()
  reviewNotes?: string;

  @ApiPropertyOptional({ example: '2024-03-01' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  actualTransferDate?: Date;
}