import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async upload(
    file: Express.Multer.File,
    patientId: string,
    uploadedById: string,
    category: string,
    consultationId?: string,
  ) {
    const uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
    const patientDir = path.join(uploadDir, patientId);

    if (!fs.existsSync(patientDir)) {
      fs.mkdirSync(patientDir, { recursive: true });
    }

    const uniqueName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(patientDir, uniqueName);
    fs.writeFileSync(filePath, file.buffer);

    return this.prisma.document.create({
      data: {
        patientId,
        consultationId,
        name: uniqueName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        category: category as any,
        path: filePath,
        uploadedById,
      },
    });
  }

  async findByPatient(patientId: string) {
    return this.prisma.document.findMany({
      where: { patientId },
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async getFileBuffer(id: string): Promise<{ buffer: Buffer; document: any }> {
    const doc = await this.findOne(id);
    if (!fs.existsSync(doc.path)) {
      throw new NotFoundException('File not found on disk');
    }
    const buffer = fs.readFileSync(doc.path);
    return { buffer, document: doc };
  }

  async remove(id: string) {
    const doc = await this.findOne(id);
    if (fs.existsSync(doc.path)) {
      fs.unlinkSync(doc.path);
    }
    return this.prisma.document.delete({ where: { id } });
  }
}
