import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { CreateScreeningResultDto } from './dto/screening-result.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Consultations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ConsultationsController {
  constructor(private consultationsService: ConsultationsService) {}

  @Post('consultations')
  @ApiOperation({ summary: 'Create consultation from appointment' })
  create(@Body() dto: CreateConsultationDto, @CurrentUser('id') doctorId: string) {
    return this.consultationsService.create(dto, doctorId);
  }

  @Get('consultations/:id')
  @ApiOperation({ summary: 'Get full consultation with vitals, diagnoses, prescriptions, and lab orders' })
  findOne(@Param('id') id: string) {
    return this.consultationsService.findOne(id);
  }

  @Patch('consultations/:id')
  @ApiOperation({ summary: 'Update SOAP fields and consultation status' })
  update(@Param('id') id: string, @Body() dto: UpdateConsultationDto) {
    return this.consultationsService.update(id, dto);
  }

  @Post('consultations/:id/vitals')
  @ApiOperation({ summary: 'Record vital signs (auto-calculates BMI from weight and height)' })
  recordVitals(
    @Param('id') id: string,
    @Body()
    body: {
      bloodPressureSystolic?: number;
      bloodPressureDiastolic?: number;
      heartRate?: number;
      temperature?: number;
      spO2?: number;
      weight?: number;
      height?: number;
      respiratoryRate?: number;
      notes?: string;
    },
    @CurrentUser('id') userId: string,
  ) {
    return this.consultationsService.recordVitals(id, body, userId);
  }

  @Post('consultations/:id/diagnoses')
  @ApiOperation({ summary: 'Add diagnosis with ICD-10 code' })
  addDiagnosis(
    @Param('id') id: string,
    @Body()
    body: {
      icd10Code: string;
      icd10Description: string;
      isPrimary?: boolean;
      notes?: string;
    },
  ) {
    return this.consultationsService.addDiagnosis(id, body);
  }

  @Delete('consultations/:id/diagnoses/:diagnosisId')
  @ApiOperation({ summary: 'Remove diagnosis from consultation' })
  removeDiagnosis(
    @Param('id') id: string,
    @Param('diagnosisId') diagnosisId: string,
  ) {
    return this.consultationsService.removeDiagnosis(id, diagnosisId);
  }

  @Post('consultations/:id/screenings')
  @ApiOperation({ summary: 'Add screening result to consultation' })
  addScreeningResult(
    @Param('id') id: string,
    @Body() dto: CreateScreeningResultDto,
  ) {
    return this.consultationsService.addScreeningResult(id, dto);
  }

  @Get('consultations/:id/screenings')
  @ApiOperation({ summary: 'Get screening results for consultation' })
  getConsultationScreenings(
    @Param('id') id: string,
    @Query('type') type?: string,
  ) {
    return this.consultationsService.getConsultationScreenings(id, type);
  }

  @Get('patients/:patientId/screening-history')
  @ApiOperation({ summary: 'Get patient screening history across consultations' })
  getPatientScreeningHistory(
    @Param('patientId') patientId: string,
    @Query('type') type?: string,
  ) {
    return this.consultationsService.getPatientScreeningHistory(patientId, type);
  }

  @Get('icd10/search')
  @ApiOperation({ summary: 'Search ICD-10 codes by code or description' })
  searchICD10(@Query('q') query: string) {
    return this.consultationsService.searchICD10(query);
  }

  @Get('medications/search')
  @ApiOperation({ summary: 'Search medications by name or generic name' })
  searchMedications(@Query('q') query: string) {
    return this.consultationsService.searchMedications(query);
  }

  @Get('quick-texts')
  @ApiOperation({ summary: "Get current doctor's quick texts" })
  getQuickTexts(@CurrentUser('id') doctorId: string) {
    return this.consultationsService.getQuickTexts(doctorId);
  }

  @Post('quick-texts')
  @ApiOperation({ summary: 'Create a quick text' })
  createQuickText(
    @CurrentUser('id') doctorId: string,
    @Body() body: { title: string; content: string; category: string },
  ) {
    return this.consultationsService.createQuickText(doctorId, body);
  }
}
