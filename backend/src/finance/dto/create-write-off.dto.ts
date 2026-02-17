import { IsString, IsNumber, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WriteOffReason } from '@prisma/client';

export class CreateWriteOffDto {
  @ApiProperty()
  @IsUUID()
  invoiceId: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty({ enum: WriteOffReason })
  @IsEnum(WriteOffReason)
  reason: WriteOffReason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
