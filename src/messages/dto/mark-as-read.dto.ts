import { IsArray, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MarkAsReadDto {
  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  messageIds?: string[];
}