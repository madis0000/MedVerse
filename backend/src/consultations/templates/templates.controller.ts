import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Consultation Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('consultations/templates')
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'List consultation templates by specialty' })
  findAll(
    @Query('specialtyId') specialtyId?: string,
    @CurrentUser('id') doctorId?: string,
  ) {
    return this.templatesService.findAll(specialtyId, doctorId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a consultation template' })
  create(
    @Body()
    body: {
      name: string;
      specialtyId: string;
      fields: Record<string, any>;
      isDefault?: boolean;
    },
    @CurrentUser('id') doctorId: string,
  ) {
    return this.templatesService.create({ ...body, doctorId });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a consultation template' })
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      fields?: Record<string, any>;
      isDefault?: boolean;
      isActive?: boolean;
    },
  ) {
    return this.templatesService.update(id, body);
  }
}
