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
import { Role } from '@prisma/client';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { SearchPatientDto } from './dto/search-patient.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Get('quick-search')
  @ApiOperation({ summary: 'Fast fuzzy search for command palette (max 5 results)' })
  quickSearch(@Query('q') query: string) {
    return this.patientsService.quickSearch(query);
  }

  @Get()
  @ApiOperation({ summary: 'Paginated list of patients with search and filters' })
  findAll(@Query() query: SearchPatientDto) {
    return this.patientsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full patient profile with relations' })
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.DOCTOR, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Create new patient (auto-generates MRN)' })
  create(@Body() dto: CreatePatientDto, @CurrentUser() user: any) {
    return this.patientsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.DOCTOR, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Update patient details' })
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientsService.update(id, dto);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get patient visit history timeline' })
  getTimeline(@Param('id') id: string) {
    return this.patientsService.getTimeline(id);
  }

  @Post(':id/family-link')
  @Roles(Role.SUPER_ADMIN, Role.DOCTOR, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Link family members by creating or assigning a FamilyGroup' })
  linkFamily(
    @Param('id') id: string,
    @Body() body: { memberId: string; groupName?: string },
  ) {
    return this.patientsService.linkFamily(id, body);
  }
}
