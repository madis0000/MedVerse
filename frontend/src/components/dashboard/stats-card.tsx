import { useTranslation } from 'react-i18next';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'indigo';
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    icon: 'text-green-600 dark:text-green-400',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    icon: 'text-red-600 dark:text-red-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    icon: 'text-purple-600 dark:text-purple-400',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    icon: 'text-indigo-600 dark:text-indigo-400',
  },
};

export function StatsCard({ title, value, change, icon: Icon, color = 'blue' }: StatsCardProps) {
  const { t } = useTranslation();
  const colors = colorMap[color];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {change !== undefined && (
              <p
                className={cn(
                  'text-xs font-medium',
                  change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
                )}
              >
                {change >= 0 ? '+' : ''}
                {change}% {t('finance.kpi.vsLastMonth')}
              </p>
            )}
          </div>
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', colors.bg)}>
            <Icon className={cn('h-5 w-5', colors.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
