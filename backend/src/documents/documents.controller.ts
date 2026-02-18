import {
  Controller, Get, Post, Delete, Param, Query, Res, UseGuards, UseInterceptors, UploadedFile, Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post('upload')
  @Roles(Role.SUPER_ADMIN, Role.DOCTOR, Role.NURSE)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a document' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('patientId') patientId: string,
    @Body('category') category: string,
    @Body('consultationId') consultationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.upload(file, patientId, userId, category, consultationId);
  }

  @Get('patient/:patientId')
  @Roles(Role.SUPER_ADMIN, Role.DOCTOR, Role.NURSE)
  @ApiOperation({ summary: 'List patient documents' })
  findByPatient(@Param('patientId') patientId: string) {
    return this.documentsService.findByPatient(patientId);
  }

  @Get(':id/download')
  @Roles(Role.SUPER_ADMIN, Role.DOCTOR, Role.NURSE)
  @ApiOperation({ summary: 'Download document' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const { buffer, document } = await this.documentsService.getFileBuffer(id);
    res.set({
      'Content-Type': document.mimeType,
      'Content-Disposition': `attachment; filename="${document.originalName}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.DOCTOR)
  @ApiOperation({ summary: 'Delete document' })
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
