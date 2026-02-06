import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EnterResultDto {
  @ApiProperty()
  @IsString()
  labOrderItemId: string;

  @ApiProperty()
  @IsString()
  value: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  normalRangeMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  normalRangeMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  normalRangeText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
