import { Module } from '@nestjs/common';
import { ConsultationsController } from './consultations.controller';
import { ConsultationsService } from './consultations.service';
import { TemplatesController } from './templates/templates.controller';
import { TemplatesService } from './templates/templates.service';

@Module({
  controllers: [ConsultationsController, TemplatesController],
  providers: [ConsultationsService, TemplatesService],
  exports: [ConsultationsService],
})
export class ConsultationsModule {}
