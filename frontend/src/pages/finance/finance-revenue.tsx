import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, TrendingUp } from 'lucide-react';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/ui/loading-skeleton';
import {
  useRevenueAnalytics, useRevenueByDoctor, useRevenueBySpecialty,
  useRevenueByService, useRevenueByPaymentMethod, useRevenueTrends,
  useRevenueForecast,
} from '@/api/finance';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function FinanceRevenuePage() {
  const { t } = useTranslation();
  const now = new Date();
  const [startDate, setStartDate] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);

  const params = { startDate, endDate };
  const { data: analytics, isLoading } = useRevenueAnalytics(params);
  const { data: byDoctor } = useRevenueByDoctor(params);
  const { data: bySpecialty } = useRevenueBySpecialty(params);
  const { data: byService } = useRevenueByService(params);
  const { data: byPaymentMethod } = useRevenueByPaymentMethod(params);
  const { data: trends } = useRevenueTrends(params);
  const { data: forecast } = useRevenueForecast();

  if (isLoading) {
    return (
      <PageWrapper title={t('finance.revenue.title')}>
        <TableSkeleton rows={8} />
      </PageWrapper>
    );
  }

  const maxDoctorRevenue = Math.max(...(byDoctor?.map((d: any) => d.revenue) || [1]));
  const maxServiceRevenue = Math.max(...(byService?.map((s: any) => s.revenue) || [1]));
  const totalPaymentMethodRevenue = (byPaymentMethod || []).reduce((s: number, m: any) => s + m.amount, 0) || 1;
  const totalSpecialtyRevenue = (bySpecialty || []).reduce((s: number, sp: any) => s + sp.revenue, 0) || 1;

  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500'];

  return (
    <PageWrapper title={t('finance.revenue.title')}>
      <div className="space-y-6">
        {/* Date range picker */}
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label>{t('common.startDate')}</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-auto" />
          </div>
          <div>
            <Label>{t('common.endDate')}</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-auto" />
          </div>
          <Badge variant="outline" className="h-10 px-4 flex items-center">
            {t('common.total')}: {formatCurrency(analytics?.totalRevenue || 0)} ({analytics?.paymentCount || 0} {t('common.payments')})
          </Badge>
        </div>

        {/* Revenue trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('finance.revenue.trend')}</CardTitle>
          </CardHeader>
          <CardContent>
            {!trends?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t('common.noData')}</p>
            ) : (
              <div className="space-y-2">
                {trends.map((tr: any) => {
                  const maxTrend = Math.max(...trends.map((tr: any) => tr.revenue), 1);
                  return (
                    <div key={tr.month} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-16">{tr.month}</span>
                      <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded"
                          style={{ width: `${(tr.revenue / maxTrend) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-20 text-right">{formatCurrency(tr.revenue)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Doctor and By Specialty */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('finance.revenue.byDoctor')}</CardTitle>
            </CardHeader>
            <CardContent>
              {!byDoctor?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t('common.noData')}</p>
              ) : (
                <div className="space-y-3">
                  {byDoctor.map((d: any) => (
                    <div key={d.doctorId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{d.doctorName}</span>
                        <span className="font-medium">{formatCurrency(d.revenue)}</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(d.revenue / maxDoctorRevenue) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{d.consultationCount} {t('common.consultations')}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('finance.revenue.bySpecialty')}</CardTitle>
            </CardHeader>
            <CardContent>
              {!bySpecialty?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t('common.noData')}</p>
              ) : (
                <div className="space-y-3">
                  {bySpecialty.map((s: any, i: number) => (
                    <div key={s.specialtyId} className="flex items-center gap-3">
                      <div className={cn('w-3 h-3 rounded-full', colors[i % colors.length])} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{s.specialtyName}</span>
                          <span className="font-medium">{formatCurrency(s.revenue)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {((s.revenue / totalSpecialtyRevenue) * 100).toFixed(1)}% - {s.count} {t('common.consultations')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* By Service and By Payment Method */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('finance.revenue.byService')}</CardTitle>
            </CardHeader>
            <CardContent>
              {!byService?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t('common.noData')}</p>
              ) : (
                <div className="space-y-3">
                  {byService.map((s: any, i: number) => (
                    <div key={s.category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{s.category}</span>
                        <span className="font-medium">{formatCurrency(s.revenue)}</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', colors[i % colors.length])}
                          style={{ width: `${(s.revenue / maxServiceRevenue) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('finance.revenue.byPaymentMethod')}</CardTitle>
            </CardHeader>
            <CardContent>
              {!byPaymentMethod?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t('common.noData')}</p>
              ) : (
                <div className="space-y-3">
                  {byPaymentMethod.map((m: any, i: number) => (
                    <div key={m.method} className="flex items-center gap-3">
                      <div className={cn('w-3 h-3 rounded-full', colors[i % colors.length])} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{m.method.replace('_', ' ')}</span>
                          <span className="font-medium">{formatCurrency(m.amount)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {((m.amount / totalPaymentMethodRevenue) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Forecast */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> {t('finance.revenue.forecast')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!forecast?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t('finance.revenue.insufficientData')}</p>
            ) : (
              <div className="space-y-2">
                {forecast.map((f: any) => {
                  const maxForecast = Math.max(...forecast.map((f: any) => Math.max(f.actual || 0, f.forecast || 0)), 1);
                  const val = f.actual ?? f.forecast ?? 0;
                  return (
                    <div key={f.month} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-16">{f.month}</span>
                      <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                        <div
                          className={cn('h-full rounded', f.forecast !== null && f.actual === null ? 'bg-blue-300 border border-dashed border-blue-500' : 'bg-blue-500')}
                          style={{ width: `${(val / maxForecast) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-20 text-right">
                        {formatCurrency(val)}
                        {f.forecast !== null && f.actual === null && ' *'}
                      </span>
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground mt-2">* {t('finance.revenue.projectedValues')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
