import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AbnormalBadgeProps {
  value: number;
  normalRangeMin?: number;
  normalRangeMax?: number;
  className?: string;
}

export function AbnormalBadge({ value, normalRangeMin, normalRangeMax, className }: AbnormalBadgeProps) {
  if (normalRangeMin === undefined && normalRangeMax === undefined) {
    return null;
  }

  let status: 'HIGH' | 'LOW' | 'NORMAL' = 'NORMAL';

  if (normalRangeMax !== undefined && value > normalRangeMax) {
    status = 'HIGH';
  } else if (normalRangeMin !== undefined && value < normalRangeMin) {
    status = 'LOW';
  }

  const styleMap = {
    HIGH: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    LOW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    NORMAL: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  };

  return (
    <Badge className={cn('text-xs font-medium', styleMap[status], className)}>
      {status}
    </Badge>
  );
}
