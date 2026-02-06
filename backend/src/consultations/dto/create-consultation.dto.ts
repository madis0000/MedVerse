import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConsultationDto {
  @ApiProperty({ description: 'Appointment ID to create consultation from' })
  @IsString()
  appointmentId: string;
}
