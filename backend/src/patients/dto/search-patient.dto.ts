import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PatientStatus, Gender } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class SearchPatientDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by name, MRN, or phone number' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PatientStatus })
  @IsOptional()
  @IsEnum(PatientStatus)
  status?: PatientStatus;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
}
