import { Module } from '@nestjs/common';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionPdfService } from './pdf/prescription-pdf.service';

@Module({
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService, PrescriptionPdfService],
  exports: [PrescriptionsService],
})
export class PrescriptionsModule {}
