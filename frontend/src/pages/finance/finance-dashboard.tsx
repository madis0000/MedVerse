import { useState } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard,
  ArrowUpRight, ArrowDownRight, Wallet, Clock, Target,
  ChevronRight, Plus, FileText, BarChart3,
} from 'lucide-react';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/ui/loading-skeleton';
import { useFinanceDashboard, useFinanceCashflow, useFinanceSparklines } from '@/api/finance';
import { formatCurrency } from '@/lib/utils';
import { CashFlowChart } from '@/components/finance/cash-flow-chart';
import { FinanceKpiCard } from '@/components/finance/finance-kpi-card';
import { QuickActionsPanel } from '@/components/finance/quick-actions-panel';
import { OutstandingReceivablesCard } from '@/components/finance/outstanding-receivables-card';
import { useNavigate } from 'react-router-dom';

export function FinanceDashboardPage() {
  const navigate = useNavigate();
  const { data: kpis, isLoading } = useFinanceDashboard();
  const { data: cashflow } = useFinanceCashflow();
  const { data: sparklines } = useFinanceSparklines();

  if (isLoading) {
    return (
      <PageWrapper title="Finance Dashboard">
        <TableSkeleton rows={8} />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Finance Dashboard">
      <div className="space-y-6">
        {/* Row 1: Main KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FinanceKpiCard
            title="Net Revenue"
            value={formatCurrency(kpis?.totalRevenue || 0)}
            change={kpis?.revenueMoM || 0}
            sparklineData={sparklines?.revenue || []}
            icon={<DollarSign className="w-4 h-4" />}
            color="text-green-600"
          />
          <FinanceKpiCard
            title="Total Expenses"
            value={formatCurrency(kpis?.totalExpenses || 0)}
            change={kpis?.expenseMoM || 0}
            sparklineData={sparklines?.expenses || []}
            icon={<CreditCard className="w-4 h-4" />}
            color="text-red-600"
            invertChange
          />
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold mt-2">{formatCurrency(kpis?.netProfit || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis?.profitMargin?.toFixed(1)}% margin
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Outstanding AR</p>
                <Wallet className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-2xl font-bold mt-2">{formatCurrency(kpis?.outstandingAR || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis?.outstandingCount || 0} invoices
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Secondary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Collection Rate</p>
                <Target className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold mt-2">{kpis?.collectionRate?.toFixed(1) || 0}%</p>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${Math.min(kpis?.collectionRate || 0, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Avg Days to Payment</p>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold mt-2">{kpis?.avgDaysToPayment || 0} days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Today's Revenue</p>
                <ArrowUpRight className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold mt-2">{formatCurrency(kpis?.todayRevenue || 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Today's Expenses</p>
                <ArrowDownRight className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-2xl font-bold mt-2">{formatCurrency(kpis?.todayExpenses || 0)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Charts and Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CashFlowChart data={cashflow || []} />
          </div>
          <div className="space-y-6">
            <OutstandingReceivablesCard />
            <QuickActionsPanel />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
