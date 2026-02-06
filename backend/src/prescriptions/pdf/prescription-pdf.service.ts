import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrescriptionPdfService {
  constructor(private prisma: PrismaService) {}

  async generatePdf(prescriptionId: string): Promise<Buffer> {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        items: { include: { medication: true } },
        patient: true,
        doctor: { select: { firstName: true, lastName: true, specialty: true } },
      },
    });

    if (!prescription) throw new Error('Prescription not found');

    const clinicSettings = await this.prisma.clinicSetting.findMany({
      where: { group: 'general' },
    });
    const settings: Record<string, string> = {};
    clinicSettings.forEach((s) => (settings[s.key] = s.value));

    const printSettings = await this.prisma.clinicSetting.findMany({
      where: { group: 'printing' },
    });
    printSettings.forEach((s) => (settings[s.key] = s.value));

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(18).font('Helvetica-Bold')
        .text(settings['clinic_name'] || 'MedPulse Medical Center', { align: 'center' });
      doc.fontSize(10).font('Helvetica')
        .text(settings['clinic_address'] || '', { align: 'center' });
      doc.text(`${settings['clinic_city'] || ''}, ${settings['clinic_state'] || ''} ${settings['clinic_zip'] || ''}`, { align: 'center' });
      doc.text(`Phone: ${settings['clinic_phone'] || ''}`, { align: 'center' });
      doc.moveDown();

      // Divider
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      // Title
      doc.fontSize(14).font('Helvetica-Bold').text('PRESCRIPTION', { align: 'center' });
      doc.moveDown();

      // Patient & Doctor info
      doc.fontSize(10).font('Helvetica-Bold').text('Patient: ', { continued: true });
      doc.font('Helvetica').text(`${prescription.patient.firstName} ${prescription.patient.lastName}`);
      doc.font('Helvetica-Bold').text('MRN: ', { continued: true });
      doc.font('Helvetica').text(prescription.patient.mrn);
      doc.font('Helvetica-Bold').text('Date of Birth: ', { continued: true });
      doc.font('Helvetica').text(new Date(prescription.patient.dob).toLocaleDateString());
      doc.moveDown(0.5);

      doc.font('Helvetica-Bold').text('Prescribing Doctor: ', { continued: true });
      doc.font('Helvetica').text(`Dr. ${prescription.doctor.firstName} ${prescription.doctor.lastName}`);
      if (prescription.doctor.specialty) {
        doc.font('Helvetica-Bold').text('Specialty: ', { continued: true });
        doc.font('Helvetica').text(prescription.doctor.specialty.name);
      }
      doc.font('Helvetica-Bold').text('Date: ', { continued: true });
      doc.font('Helvetica').text(new Date(prescription.createdAt).toLocaleDateString());
      doc.moveDown();

      // Divider
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      // Rx Symbol
      doc.fontSize(20).font('Helvetica-Bold').text('Rx', { continued: false });
      doc.moveDown(0.5);

      // Medications
      prescription.items.forEach((item, index) => {
        doc.fontSize(11).font('Helvetica-Bold')
          .text(`${index + 1}. ${item.medicationName}`);
        doc.fontSize(10).font('Helvetica')
          .text(`   Dosage: ${item.dosage}  |  Frequency: ${item.frequency}  |  Duration: ${item.duration}`);
        doc.text(`   Route: ${item.route}${item.quantity ? `  |  Quantity: ${item.quantity}` : ''}`);
        if (item.instructions) {
          doc.text(`   Instructions: ${item.instructions}`);
        }
        doc.moveDown(0.5);
      });

      if (prescription.notes) {
        doc.moveDown();
        doc.font('Helvetica-Bold').text('Notes: ', { continued: true });
        doc.font('Helvetica').text(prescription.notes);
      }

      // Footer
      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      doc.fontSize(9).font('Helvetica')
        .text(settings['prescription_footer'] || 'This prescription is valid for 30 days from issue date.', { align: 'center' });

      // Signature line
      doc.moveDown(2);
      doc.moveTo(350, doc.y).lineTo(545, doc.y).stroke();
      doc.fontSize(10).text("Doctor's Signature", 350, doc.y + 5, { align: 'center', width: 195 });

      doc.end();
    });
  }
}
