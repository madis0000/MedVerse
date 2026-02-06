import { Controller, Get, Post, Patch, Body, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionPdfService } from './pdf/prescription-pdf.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Prescriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(
    private prescriptionsService: PrescriptionsService,
    private pdfService: PrescriptionPdfService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create prescription with items' })
  create(@Body() dto: CreatePrescriptionDto, @CurrentUser('id') userId: string) {
    return this.prescriptionsService.create(dto, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get prescription detail' })
  findOne(@Param('id') id: string) {
    return this.prescriptionsService.findOne(id);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get patient medication history' })
  findByPatient(@Param('patientId') patientId: string) {
    return this.prescriptionsService.findByPatient(patientId);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Generate prescription PDF' })
  async generatePdf(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.pdfService.generatePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=prescription-${id}.pdf`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post('check-interactions')
  @ApiOperation({ summary: 'Check drug interactions' })
  checkInteractions(@Body() body: { medicationIds: string[] }) {
    return this.prescriptionsService.checkDrugInteractions(body.medicationIds);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel prescription' })
  cancel(@Param('id') id: string) {
    return this.prescriptionsService.cancel(id);
  }
}
