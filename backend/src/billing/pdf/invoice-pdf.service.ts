import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class InvoicePdfService {
  /**
   * Generate a professional invoice PDF and return it as a Buffer.
   */
  async generate(invoice: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      this.renderHeader(doc);
      this.renderInvoiceMeta(doc, invoice);
      this.renderPatientInfo(doc, invoice.patient);
      this.renderItemsTable(doc, invoice.items);
      this.renderTotals(doc, invoice);
      this.renderPayments(doc, invoice.payments);
      this.renderFooter(doc);

      doc.end();
    });
  }

  // ─── Section Renderers ───────────────────────────────────────────────

  private renderHeader(doc: any) {
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('MediVerse Clinic', 50, 50)
      .fontSize(9)
      .font('Helvetica')
      .text('123 Medical Centre Drive', 50, 75)
      .text('Phone: +1 (555) 000-1234  |  Email: billing@mediverse.clinic', 50, 87);

    doc
      .moveTo(50, 110)
      .lineTo(545, 110)
      .strokeColor('#2563eb')
      .lineWidth(2)
      .stroke();
  }

  private renderInvoiceMeta(doc: any, invoice: any) {
    const top = 125;

    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text('INVOICE', 50, top);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#334155');

    const metaX = 380;
    doc.text('Invoice No:', metaX, top, { continued: true }).text(`  ${invoice.invoiceNumber}`);
    doc.text('Date:', metaX, top + 15, { continued: true }).text(`  ${this.formatDate(invoice.createdAt)}`);
    doc.text('Status:', metaX, top + 30, { continued: true }).text(`  ${invoice.status}`);

    if (invoice.dueDate) {
      doc.text('Due Date:', metaX, top + 45, { continued: true }).text(`  ${this.formatDate(invoice.dueDate)}`);
    }
  }

  private renderPatientInfo(doc: any, patient: any) {
    const top = 185;

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text('Bill To:', 50, top);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#334155')
      .text(`${patient.firstName} ${patient.lastName}`, 50, top + 15)
      .text(`MRN: ${patient.mrn}`, 50, top + 28);

    if (patient.phone) {
      doc.text(`Phone: ${patient.phone}`, 50, top + 41);
    }

    if (patient.address) {
      const addressParts = [patient.address, patient.city, patient.state, patient.zipCode]
        .filter(Boolean)
        .join(', ');
      doc.text(addressParts, 50, top + 54);
    }

    if (patient.insuranceProvider) {
      doc.text(
        `Insurance: ${patient.insuranceProvider} (${patient.insuranceNumber || 'N/A'})`,
        50,
        top + 67,
      );
    }
  }

  private renderItemsTable(doc: any, items: any[]) {
    const tableTop = 280;
    const colX = { desc: 50, category: 260, qty: 340, unit: 400, total: 475 };

    // Table header background
    doc
      .rect(50, tableTop - 5, 495, 20)
      .fillColor('#2563eb')
      .fill();

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#ffffff')
      .text('Description', colX.desc, tableTop, { width: 200 })
      .text('Category', colX.category, tableTop, { width: 70 })
      .text('Qty', colX.qty, tableTop, { width: 50, align: 'right' })
      .text('Unit Price', colX.unit, tableTop, { width: 65, align: 'right' })
      .text('Total', colX.total, tableTop, { width: 70, align: 'right' });

    let y = tableTop + 25;
    doc.font('Helvetica').fillColor('#334155');

    items.forEach((item, index) => {
      // Alternate row background
      if (index % 2 === 0) {
        doc.rect(50, y - 5, 495, 18).fillColor('#f8fafc').fill();
        doc.fillColor('#334155');
      }

      doc
        .fontSize(9)
        .text(item.description, colX.desc, y, { width: 200 })
        .text(item.category, colX.category, y, { width: 70 })
        .text(item.quantity.toString(), colX.qty, y, { width: 50, align: 'right' })
        .text(this.formatCurrency(item.unitPrice), colX.unit, y, { width: 65, align: 'right' })
        .text(this.formatCurrency(item.total), colX.total, y, { width: 70, align: 'right' });

      y += 20;
    });

    // Bottom line of table
    doc
      .moveTo(50, y + 5)
      .lineTo(545, y + 5)
      .strokeColor('#cbd5e1')
      .lineWidth(1)
      .stroke();

    // Store the Y position for subsequent sections
    (doc as any)._billingTableBottom = y + 15;
  }

  private renderTotals(doc: any, invoice: any) {
    const y = (doc as any)._billingTableBottom || 450;
    const labelX = 380;
    const valueX = 475;
    const valueWidth = 70;

    doc.fontSize(9).font('Helvetica').fillColor('#334155');

    doc.text('Subtotal:', labelX, y);
    doc.text(this.formatCurrency(invoice.subtotal), valueX, y, { width: valueWidth, align: 'right' });

    if (invoice.tax > 0) {
      doc.text('Tax:', labelX, y + 16);
      doc.text(this.formatCurrency(invoice.tax), valueX, y + 16, { width: valueWidth, align: 'right' });
    }

    if (invoice.discount > 0) {
      doc.text('Discount:', labelX, y + 32);
      doc.text(`-${this.formatCurrency(invoice.discount)}`, valueX, y + 32, { width: valueWidth, align: 'right' });
    }

    const totalY = y + (invoice.tax > 0 ? 16 : 0) + (invoice.discount > 0 ? 16 : 0) + 20;
    doc
      .moveTo(labelX, totalY - 5)
      .lineTo(545, totalY - 5)
      .strokeColor('#1e293b')
      .lineWidth(1)
      .stroke();

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text('Total:', labelX, totalY);
    doc.text(this.formatCurrency(invoice.total), valueX, totalY, { width: valueWidth, align: 'right' });

    // Calculate paid amount
    const totalPaid = (invoice.payments || []).reduce(
      (sum: number, p: any) => sum + p.amount,
      0,
    );
    const balance = invoice.total - totalPaid;

    if (totalPaid > 0) {
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#334155')
        .text('Amount Paid:', labelX, totalY + 20);
      doc.text(this.formatCurrency(totalPaid), valueX, totalY + 20, { width: valueWidth, align: 'right' });

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(balance <= 0 ? '#16a34a' : '#dc2626')
        .text('Balance Due:', labelX, totalY + 38);
      doc.text(this.formatCurrency(Math.max(balance, 0)), valueX, totalY + 38, { width: valueWidth, align: 'right' });
    }

    (doc as any)._billingTotalsBottom = totalY + (totalPaid > 0 ? 58 : 20);
  }

  private renderPayments(doc: any, payments: any[]) {
    if (!payments || payments.length === 0) return;

    const y = (doc as any)._billingTotalsBottom || 550;

    // Check if we need a new page
    if (y > 680) {
      doc.addPage();
      return this.renderPaymentsOnNewPage(doc, payments, 50);
    }

    this.renderPaymentsOnNewPage(doc, payments, y);
  }

  private renderPaymentsOnNewPage(
    doc: any,
    payments: any[],
    startY: number,
  ) {
    let y = startY;

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text('Payment History', 50, y);

    y += 20;

    doc
      .rect(50, y - 3, 495, 18)
      .fillColor('#e2e8f0')
      .fill();

    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#334155')
      .text('Date', 55, y)
      .text('Method', 170, y)
      .text('Reference', 270, y)
      .text('Received By', 370, y)
      .text('Amount', 475, y, { width: 70, align: 'right' });

    y += 18;
    doc.font('Helvetica').fontSize(8);

    payments.forEach((payment) => {
      doc
        .fillColor('#334155')
        .text(this.formatDate(payment.paidAt), 55, y)
        .text(payment.method, 170, y)
        .text(payment.reference || '-', 270, y)
        .text(
          payment.receivedBy
            ? `${payment.receivedBy.firstName} ${payment.receivedBy.lastName}`
            : '-',
          370,
          y,
        )
        .text(this.formatCurrency(payment.amount), 475, y, { width: 70, align: 'right' });

      y += 16;
    });
  }

  private renderFooter(doc: any) {
    const bottomY = 760;

    doc
      .moveTo(50, bottomY)
      .lineTo(545, bottomY)
      .strokeColor('#cbd5e1')
      .lineWidth(0.5)
      .stroke();

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#94a3b8')
      .text('Thank you for choosing MediVerse Clinic.', 50, bottomY + 8, {
        align: 'center',
        width: 495,
      })
      .text(
        'This is a computer-generated invoice. For questions, contact billing@mediverse.clinic',
        50,
        bottomY + 20,
        { align: 'center', width: 495 },
      );
  }

  // ─── Helpers ─────────────────────────────────────────────────────────

  private formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }
}
