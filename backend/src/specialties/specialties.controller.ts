import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { SpecialtiesService } from './specialties.service';
import { CreateSpecialtyDto, CreateSpecialtyFieldDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Specialties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('specialties')
export class SpecialtiesController {
  constructor(private specialtiesService: SpecialtiesService) {}

  @Get()
  @ApiOperation({ summary: 'List all specialties' })
  findAll() {
    return this.specialtiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specialty by ID' })
  findOne(@Param('id') id: string) {
    return this.specialtiesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create specialty (admin only)' })
  create(@Body() dto: CreateSpecialtyDto) {
    return this.specialtiesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update specialty' })
  update(@Param('id') id: string, @Body() dto: UpdateSpecialtyDto) {
    return this.specialtiesService.update(id, dto);
  }

  @Get(':id/fields')
  @ApiOperation({ summary: 'Get specialty custom fields' })
  getFields(@Param('id') id: string) {
    return this.specialtiesService.getFields(id);
  }

  @Post(':id/fields')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add custom field to specialty' })
  addField(@Param('id') id: string, @Body() dto: CreateSpecialtyFieldDto) {
    return this.specialtiesService.addField(id, dto);
  }

  @Delete('fields/:fieldId')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Remove specialty field' })
  removeField(@Param('fieldId') fieldId: string) {
    return this.specialtiesService.removeField(fieldId);
  }
}
