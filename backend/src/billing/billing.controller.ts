import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvoiceStatus } from '@prisma/client';
import { Response } from 'express';
import { BillingService } from './billing.service';
import { InvoicePdfService } from './pdf/invoice-pdf.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

class QueryInvoiceDto extends PaginationDto {
  status?: InvoiceStatus;
  patientId?: string;
  startDate?: string;
  endDate?: string;
}

class QueryServicePriceDto {
  category?: string;
  specialtyId?: string;
}

class UpsertServicePriceDto {
  id?: string;
  name: string;
  category: string;
  price: number;
  specialtyId?: string;
}

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class BillingController {
  constructor(
    private billingService: BillingService,
    private invoicePdfService: InvoicePdfService,
  ) {}

  // ─── Invoices ──────────────────────────────────────────────────────

  @Post('invoices')
  @ApiOperation({ summary: 'Create a new invoice with auto-generated invoice number' })
  createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.billingService.createInvoice(dto);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'List invoices with filters and pagination' })
  findAllInvoices(@Query() query: QueryInvoiceDto) {
    return this.billingService.findAllInvoices(query);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice detail with items and payments' })
  findOneInvoice(@Param('id') id: string) {
    return this.billingService.findOneInvoice(id);
  }

  @Get('invoices/:id/pdf')
  @ApiOperation({ summary: 'Generate and download invoice PDF' })
  async generatePdf(@Param('id') id: string, @Res() res: Response) {
    const invoice = await this.billingService.findOneInvoice(id);
    const pdfBuffer = await this.invoicePdfService.generate(invoice);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  // ─── Payments ──────────────────────────────────────────────────────

  @Post('payments')
  @ApiOperation({ summary: 'Record a payment against an invoice' })
  recordPayment(
    @Body() dto: RecordPaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.recordPayment(dto, userId);
  }

  // ─── Service Prices ────────────────────────────────────────────────

  @Get('service-prices')
  @ApiOperation({ summary: 'List service prices' })
  findAllServicePrices(@Query() query: QueryServicePriceDto) {
    return this.billingService.findAllServicePrices(query);
  }

  @Post('service-prices')
  @ApiOperation({ summary: 'Create or update a service price' })
  upsertServicePrice(@Body() dto: UpsertServicePriceDto) {
    return this.billingService.upsertServicePrice(dto);
  }
}
