import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import { isPathSafe, sanitizeFilename } from '../common/validators/safe-path.validator';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/dicom',
];

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
    // Validate patientId to prevent path traversal
    if (!isPathSafe(patientId)) {
      throw new BadRequestException('Invalid patient ID format');
    }

    // Validate file MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: PDF, images, Word, Excel, text, DICOM`,
      );
    }

    const uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
    const patientDir = path.join(uploadDir, patientId);

    // Verify the resolved path is within the upload directory
    const resolvedDir = path.resolve(patientDir);
    const resolvedUploadDir = path.resolve(uploadDir);
    if (!resolvedDir.startsWith(resolvedUploadDir)) {
      throw new BadRequestException('Invalid patient ID');
    }

    try {
      await fs.mkdir(patientDir, { recursive: true });
    } catch {
      throw new BadRequestException('Failed to create upload directory');
    }

    const safeName = sanitizeFilename(file.originalname);
    const uniqueName = `${Date.now()}-${safeName}`;
    const filePath = path.join(patientDir, uniqueName);

    await fs.writeFile(filePath, file.buffer);

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
    try {
      await fs.access(doc.path);
    } catch {
      throw new NotFoundException('File not found on disk');
    }
    const buffer = await fs.readFile(doc.path);
    return { buffer, document: doc };
  }

  async remove(id: string) {
    const doc = await this.findOne(id);
    try {
      await fs.access(doc.path);
      await fs.unlink(doc.path);
    } catch {
      // File may already be gone, continue with DB deletion
    }
    return this.prisma.document.delete({ where: { id } });
  }
}
