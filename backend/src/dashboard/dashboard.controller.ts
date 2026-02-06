import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin dashboard stats' })
  getAdminStats() {
    return this.dashboardService.getAdminStats();
  }

  @Get('doctor')
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Doctor dashboard stats' })
  getDoctorStats(@CurrentUser('id') doctorId: string) {
    return this.dashboardService.getDoctorStats(doctorId);
  }

  @Get('revenue')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Revenue breakdown' })
  getRevenueBreakdown(@Query('period') period: 'daily' | 'weekly' | 'monthly') {
    return this.dashboardService.getRevenueBreakdown(period);
  }

  @Get('export')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Export dashboard data' })
  exportData() {
    return this.dashboardService.exportData();
  }
}
