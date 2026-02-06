import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LabOrderStatus } from '@prisma/client';
import { LaboratoryService } from './laboratory.service';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { EnterResultDto } from './dto/enter-result.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Laboratory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class LaboratoryController {
  constructor(private laboratoryService: LaboratoryService) {}

  @Post('lab-orders')
  @ApiOperation({ summary: 'Create lab order with test items' })
  createOrder(@Body() dto: CreateLabOrderDto, @CurrentUser('id') userId: string) {
    return this.laboratoryService.createOrder(dto, userId);
  }

  @Get('lab-orders')
  @ApiOperation({ summary: 'List lab orders with filters' })
  findAll(@Query() query: PaginationDto & { status?: LabOrderStatus; patientId?: string }) {
    return this.laboratoryService.findAll(query);
  }

  @Get('lab-orders/:id')
  @ApiOperation({ summary: 'Get lab order detail' })
  findOne(@Param('id') id: string) {
    return this.laboratoryService.findOne(id);
  }

  @Patch('lab-orders/:id/status')
  @ApiOperation({ summary: 'Update lab order status' })
  updateStatus(@Param('id') id: string, @Body('status') status: LabOrderStatus) {
    return this.laboratoryService.updateStatus(id, status);
  }

  @Post('lab-results')
  @ApiOperation({ summary: 'Enter lab result (auto-flags abnormal)' })
  enterResult(@Body() dto: EnterResultDto, @CurrentUser('id') userId: string) {
    return this.laboratoryService.enterResult(dto, userId);
  }

  @Get('lab-results/patient/:patientId/trends')
  @ApiOperation({ summary: 'Get patient lab result trends' })
  getPatientTrends(@Param('patientId') patientId: string) {
    return this.laboratoryService.getPatientTrends(patientId);
  }

  @Get('lab-tests')
  @ApiOperation({ summary: 'List available test definitions' })
  getTestDefinitions() {
    return this.laboratoryService.getTestDefinitions();
  }
}
