import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, DollarSign, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import apiClient from '@/lib/api-client';

type Period = 'daily' | 'weekly' | 'monthly';

interface RevenueDataPoint {
  period: string;
  revenue: number;
  count?: number;
}

interface RevenueBreakdown {
  method: string;
  amount: number;
}

interface RevenueSummary {
  data: RevenueDataPoint[];
  total: number;
  average: number;
  breakdown: RevenueBreakdown[];
}

export function RevenueReport() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>('monthly');

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['revenue-report', period],
    queryFn: async () => {
      const { data } = await apiClient.get('/invoices/revenue', { params: { period } });
      return data as RevenueSummary;
    },
  });

  const summary = reportData?.data ? reportData : reportData ?? null;
  const chartData = summary?.data ?? [];
  const total = summary?.total ?? 0;
  const average = summary?.average ?? 0;
  const breakdown = summary?.breakdown ?? [];

  const periods: { value: Period; label: string }[] = [
    { value: 'daily', label: t('billing.periods.daily', 'Daily') },
    { value: 'weekly', label: t('billing.periods.weekly', 'Weekly') },
    { value: 'monthly', label: t('billing.periods.monthly', 'Monthly') },
  ];

  const periodUnitMap: Record<Period, string> = {
    daily: t('billing.periodUnits.day', 'Day'),
    weekly: t('billing.periodUnits.week', 'Week'),
    monthly: t('billing.periodUnits.month', 'Month'),
  };

  const methodColors: Record<string, string> = {
    CASH: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    CARD: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    INSURANCE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    BANK_TRANSFER: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center gap-2">
        {periods.map((p) => (
          <Button
            key={p.value}
            variant={period === p.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('billing.totalRevenue', 'Total Revenue')}</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(total)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('billing.averagePer', 'Average per')} {periodUnitMap[period]}</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(average)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-3">{t('billing.byPaymentMethod', 'By Payment Method')}</p>
            <div className="space-y-2">
              {breakdown.length > 0 ? (
                breakdown.map((item) => (
                  <div key={item.method} className="flex items-center justify-between text-sm">
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', methodColors[item.method] ?? 'bg-gray-100 text-gray-800')}>
                      {item.method.replace('_', ' ')}
                    </span>
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">{t('billing.noDataAvailable', 'No data available')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('billing.revenueOverTime', 'Revenue Over Time')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground text-sm">{t('billing.loadingChartData', 'Loading chart data...')}</div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              {t('billing.noRevenueData', 'No revenue data for the selected period')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(val: number) => [formatCurrency(val), t('billing.revenue', 'Revenue')]}
                />
                <Bar
                  dataKey="revenue"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
