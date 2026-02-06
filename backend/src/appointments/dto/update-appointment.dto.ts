import {
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { VisitType } from '@prisma/client';

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ description: 'Patient ID' })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({ description: 'Doctor ID' })
  @IsOptional()
  @IsString()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'Specialty ID' })
  @IsOptional()
  @IsString()
  specialtyId?: string;

  @ApiPropertyOptional({ description: 'Appointment start date and time (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateTime?: string;

  @ApiPropertyOptional({ description: 'Appointment end date and time (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ enum: VisitType, description: 'Type of visit' })
  @IsOptional()
  @IsEnum(VisitType)
  visitType?: VisitType;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ default: false, description: 'Whether this is a recurring appointment' })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({
    description: 'Recurring pattern configuration',
    type: 'object',
  })
  @IsOptional()
  recurringPattern?: Record<string, any>;
}
