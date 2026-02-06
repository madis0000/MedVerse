import { Controller, Get, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Get all clinic settings' })
  getAll() {
    return this.settingsService.getAll();
  }

  @Patch('settings')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update clinic settings' })
  update(@Body() settings: Record<string, string>) {
    return this.settingsService.update(settings);
  }

  @Get('audit-logs')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get audit logs' })
  getAuditLogs(@Query() query: PaginationDto & { entity?: string; userId?: string }) {
    return this.settingsService.getAuditLogs(query);
  }
}
