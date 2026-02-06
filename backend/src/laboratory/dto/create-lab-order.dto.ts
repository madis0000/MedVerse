import { IsString, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LabPriority } from '@prisma/client';

export class CreateLabOrderItemDto {
  @ApiProperty()
  @IsString()
  labTestId: string;

  @ApiProperty()
  @IsString()
  testName: string;
}

export class CreateLabOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  consultationId?: string;

  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiPropertyOptional({ enum: LabPriority })
  @IsOptional()
  @IsEnum(LabPriority)
  priority?: LabPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateLabOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLabOrderItemDto)
  items: CreateLabOrderItemDto[];
}
