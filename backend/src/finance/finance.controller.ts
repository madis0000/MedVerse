import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto';
import { CloseDayDto } from './dto/close-day.dto';
import { CreateWriteOffDto } from './dto/create-write-off.dto';
import { MonthlyDataEntryDto, UpdateDailyEntryDto } from './dto/data-entry.dto';
import { QueryExpenseDto, QueryRevenueDto, QueryReportDto } from './dto/query-finance.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('finance')
export class FinanceController {
  constructor(private financeService: FinanceService) {}

  // ─── Dashboard ──────────────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Get finance dashboard KPIs' })
  getDashboard(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.getDashboard(startDate, endDate);
  }

  @Get('dashboard/cashflow')
  @ApiOperation({ summary: 'Get cash flow chart data' })
  getDashboardCashflow(@Query('months') months?: number) {
    return this.financeService.getDashboardCashflow(months ? Number(months) : undefined);
  }

  @Get('dashboard/sparklines')
  @ApiOperation({ summary: 'Get 14-day sparkline data' })
  getDashboardSparklines() {
    return this.financeService.getDashboardSparklines();
  }

  // ─── Daily Operations ──────────────────────────────────────────

  @Get('daily/summary')
  @ApiOperation({ summary: 'Get daily summary for a specific date' })
  getDailySummary(@Query('date') date: string) {
    return this.financeService.getDailySummary(date);
  }

  @Post('daily/close')
  @ApiOperation({ summary: 'Close a day with actual amounts' })
  closeDay(@Body() dto: CloseDayDto, @CurrentUser('id') userId: string) {
    return this.financeService.closeDay(dto, userId);
  }

  @Get('daily/history')
  @ApiOperation({ summary: 'Get daily closing history' })
  getDailyHistory(@Query('limit') limit?: number) {
    return this.financeService.getDailyHistory(limit ? Number(limit) : undefined);
  }

  // ─── Revenue Analytics ──────────────────────────────────────────

  @Get('revenue/analytics')
  @ApiOperation({ summary: 'Get revenue analytics overview' })
  getRevenueAnalytics(@Query() query: QueryRevenueDto) {
    return this.financeService.getRevenueAnalytics(query);
  }

  @Get('revenue/by-doctor')
  @ApiOperation({ summary: 'Get revenue breakdown by doctor' })
  getRevenueByDoctor(@Query() query: QueryRevenueDto) {
    return this.financeService.getRevenueByDoctor(query);
  }

  @Get('revenue/by-specialty')
  @ApiOperation({ summary: 'Get revenue breakdown by specialty' })
  getRevenueBySpecialty(@Query() query: QueryRevenueDto) {
    return this.financeService.getRevenueBySpecialty(query);
  }

  @Get('revenue/by-service')
  @ApiOperation({ summary: 'Get revenue breakdown by service category' })
  getRevenueByService(@Query() query: QueryRevenueDto) {
    return this.financeService.getRevenueByService(query);
  }

  @Get('revenue/by-payment-method')
  @ApiOperation({ summary: 'Get revenue breakdown by payment method' })
  getRevenueByPaymentMethod(@Query() query: QueryRevenueDto) {
    return this.financeService.getRevenueByPaymentMethod(query);
  }

  @Get('revenue/trends')
  @ApiOperation({ summary: 'Get monthly revenue trends' })
  getRevenueTrends(@Query() query: QueryRevenueDto) {
    return this.financeService.getRevenueTrends(query);
  }

  @Get('revenue/forecast')
  @ApiOperation({ summary: 'Get revenue forecast based on historical data' })
  getRevenueForecast() {
    return this.financeService.getRevenueForecast();
  }

  // ─── Expenses ──────────────────────────────────────────────────

  @Get('expenses')
  @ApiOperation({ summary: 'List expenses with filters and pagination' })
  findAllExpenses(@Query() query: QueryExpenseDto) {
    return this.financeService.findAllExpenses(query);
  }

  @Post('expenses')
  @ApiOperation({ summary: 'Create a new expense' })
  createExpense(@Body() dto: CreateExpenseDto, @CurrentUser('id') userId: string) {
    return this.financeService.createExpense(dto, userId);
  }

  @Patch('expenses/:id')
  @ApiOperation({ summary: 'Update an expense' })
  updateExpense(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.financeService.updateExpense(id, dto, userId);
  }

  @Delete('expenses/:id')
  @ApiOperation({ summary: 'Delete an expense' })
  deleteExpense(@Param('id') id: string) {
    return this.financeService.deleteExpense(id);
  }

  // ─── Expense Categories ────────────────────────────────────────

  @Get('expense-categories')
  @ApiOperation({ summary: 'List all expense categories' })
  findAllExpenseCategories() {
    return this.financeService.findAllExpenseCategories();
  }

  @Post('expense-categories')
  @ApiOperation({ summary: 'Create an expense category' })
  createExpenseCategory(@Body() dto: CreateExpenseCategoryDto) {
    return this.financeService.createExpenseCategory(dto);
  }

  @Delete('expense-categories/:id')
  @ApiOperation({ summary: 'Delete an expense category (only if no transactions)' })
  deleteExpenseCategory(@Param('id') id: string) {
    return this.financeService.deleteExpenseCategory(id);
  }

  // ─── Recurring Expenses ────────────────────────────────────────

  @Get('recurring-expenses')
  @ApiOperation({ summary: 'List all recurring expenses' })
  findAllRecurringExpenses() {
    return this.financeService.findAllRecurringExpenses();
  }

  @Post('recurring-expenses')
  @ApiOperation({ summary: 'Create a recurring expense' })
  createRecurringExpense(
    @Body() dto: CreateRecurringExpenseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.financeService.createRecurringExpense(dto, userId);
  }

  // ─── Reports ──────────────────────────────────────────────────

  @Get('reports/profit-loss')
  @ApiOperation({ summary: 'Get profit & loss report' })
  getProfitLossReport(@Query() query: QueryReportDto) {
    return this.financeService.getProfitLossReport(query);
  }

  @Get('reports/accounts-receivable')
  @ApiOperation({ summary: 'Get accounts receivable aging report' })
  getAccountsReceivable() {
    return this.financeService.getAccountsReceivable();
  }

  @Get('reports/cash-flow')
  @ApiOperation({ summary: 'Get cash flow report' })
  getCashFlowReport(@Query() query: QueryReportDto) {
    return this.financeService.getCashFlowReport(query);
  }

  // ─── Write-offs ────────────────────────────────────────────────

  @Get('write-offs')
  @ApiOperation({ summary: 'List all write-offs' })
  findAllWriteOffs(@Query() query: QueryReportDto) {
    return this.financeService.findAllWriteOffs(query);
  }

  @Post('write-offs')
  @ApiOperation({ summary: 'Create a write-off for an invoice' })
  createWriteOff(@Body() dto: CreateWriteOffDto, @CurrentUser('id') userId: string) {
    return this.financeService.createWriteOff(dto, userId);
  }

  // ─── Data Entry ──────────────────────────────────────────────

  @Post('data-entry')
  @ApiOperation({ summary: 'Bulk enter monthly revenue and expense data' })
  submitMonthlyData(@Body() dto: MonthlyDataEntryDto, @CurrentUser('id') userId: string) {
    return this.financeService.submitMonthlyData(dto, userId);
  }

  @Get('data-entry/:year/:month')
  @ApiOperation({ summary: 'Get existing data entry for a specific month' })
  getMonthlyData(@Param('year') year: string, @Param('month') month: string) {
    return this.financeService.getMonthlyData(parseInt(year), parseInt(month));
  }

  @Patch('data-entry/:year/:month/:day')
  @ApiOperation({ summary: 'Update a single daily entry' })
  updateDailyEntry(
    @Param('year') year: string,
    @Param('month') month: string,
    @Param('day') day: string,
    @Body() dto: UpdateDailyEntryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.financeService.updateDailyEntry(
      parseInt(year),
      parseInt(month),
      parseInt(day),
      dto,
      userId,
    );
  }
}
