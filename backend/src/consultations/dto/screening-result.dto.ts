import { IsString, IsInt, IsArray, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateScreeningResultDto {
  @ApiProperty({ example: 'PHQ9' })
  @IsString()
  instrumentType: string;

  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(0)
  score: number;

  @ApiProperty({ example: 'Moderate' })
  @IsString()
  severity: string;

  @ApiProperty({ example: [1, 2, 1, 3, 2, 1, 0, 1, 1] })
  @IsArray()
  responses: number[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
