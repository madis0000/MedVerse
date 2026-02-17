import { IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CloseDayDto {
  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiProperty()
  @IsNumber()
  actualCash: number;

  @ApiProperty()
  @IsNumber()
  actualCard: number;

  @ApiProperty()
  @IsNumber()
  actualInsurance: number;

  @ApiProperty()
  @IsNumber()
  actualBankTransfer: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
