import {
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VisitType } from '@prisma/client';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Patient ID' })
  @IsString()
  patientId: string;

  @ApiProperty({ description: 'Doctor ID' })
  @IsString()
  doctorId: string;

  @ApiProperty({ description: 'Specialty ID' })
  @IsString()
  specialtyId: string;

  @ApiProperty({ description: 'Appointment start date and time (ISO 8601)' })
  @IsDateString()
  dateTime: string;

  @ApiProperty({ description: 'Appointment end date and time (ISO 8601)' })
  @IsDateString()
  endTime: string;

  @ApiProperty({ enum: VisitType, description: 'Type of visit' })
  @IsEnum(VisitType)
  visitType: VisitType;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ default: false, description: 'Whether this is a recurring appointment' })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({
    description: 'Recurring pattern configuration (e.g. { frequency: "weekly", interval: 1, endDate: "..." })',
    type: 'object',
  })
  @IsOptional()
  recurringPattern?: Record<string, any>;
}
