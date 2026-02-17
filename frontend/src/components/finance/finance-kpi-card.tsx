import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FinanceKpiCardProps {
  title: string;
  value: string;
  change: number;
  sparklineData: number[];
  icon: ReactNode;
  color: string;
  invertChange?: boolean;
}

export function FinanceKpiCard({ title, value, change, sparklineData, icon, color, invertChange }: FinanceKpiCardProps) {
  const { t } = useTranslation();
  const isPositive = invertChange ? change < 0 : change > 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <span className={color}>{icon}</span>
        </div>
        <p className="text-2xl font-bold mt-2">{value}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className={cn('flex items-center text-xs font-medium', isPositive ? 'text-green-600' : 'text-red-600')}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground">{t('finance.kpi.vsLastMonth')}</span>
        </div>
        {sparklineData.length > 0 && (
          <div className="mt-3 flex items-end gap-[2px] h-8">
            {sparklineData.map((val, i) => {
              const max = Math.max(...sparklineData, 1);
              const height = (val / max) * 100;
              return (
                <div
                  key={i}
                  className={cn('flex-1 rounded-sm min-h-[2px]', color.includes('green') ? 'bg-green-200' : 'bg-red-200')}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
