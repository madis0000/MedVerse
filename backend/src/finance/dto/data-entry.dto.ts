import { IsNumber, IsOptional, IsString, IsArray, ValidateNested, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DailyRevenueEntryDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(31)
  day: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  revenue: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  patientsEffective?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  newPatients?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  totalPatients?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  fullPricePatients?: number;
}

export class MonthlyExpenseEntryDto {
  @ApiProperty()
  @IsString()
  categoryName: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateDailyEntryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  revenue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  patientsEffective?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  newPatients?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  totalPatients?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  fullPricePatients?: number;
}

export class MonthlyDataEntryDto {
  @ApiProperty()
  @IsInt()
  @Min(2019)
  @Max(2030)
  year: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ type: [DailyRevenueEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailyRevenueEntryDto)
  days: DailyRevenueEntryDto[];

  @ApiPropertyOptional({ type: [MonthlyExpenseEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MonthlyExpenseEntryDto)
  expenses?: MonthlyExpenseEntryDto[];
}
