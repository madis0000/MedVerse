import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ConsultationStatus } from '@prisma/client';

export class UpdateConsultationDto {
  @ApiPropertyOptional({ description: 'Subjective - patient complaints and history' })
  @IsOptional()
  @IsString()
  subjective?: string;

  @ApiPropertyOptional({ description: 'Objective - examination findings' })
  @IsOptional()
  @IsString()
  objective?: string;

  @ApiPropertyOptional({ description: 'Assessment - clinical assessment and diagnosis reasoning' })
  @IsOptional()
  @IsString()
  assessment?: string;

  @ApiPropertyOptional({ description: 'Plan - treatment plan' })
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiPropertyOptional({
    description: 'Custom fields specific to the specialty',
    type: 'object',
  })
  @IsOptional()
  customFields?: Record<string, any>;

  @ApiPropertyOptional({
    enum: ConsultationStatus,
    description: 'Consultation status',
  })
  @IsOptional()
  @IsEnum(ConsultationStatus)
  status?: ConsultationStatus;
}
