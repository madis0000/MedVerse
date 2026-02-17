import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { AppointmentStatus } from '@/types';

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  CHECKED_IN: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  IN_PROGRESS: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  COMPLETED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  NO_SHOW: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-gray-100 text-gray-500 line-through dark:bg-gray-900/30 dark:text-gray-500',
};

interface StatusBadgeProps {
  status: AppointmentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation();

  const label = t(`appointments.status.${status}`);
  const styleClass = STATUS_STYLES[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        styleClass,
        className,
      )}
    >
      {label}
    </span>
  );
}

// Export STATUS_CONFIG for backward compatibility
const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; className: string }
> = {
  SCHEDULED: {
    label: 'Scheduled',
    className: STATUS_STYLES.SCHEDULED,
  },
  CHECKED_IN: {
    label: 'Checked In',
    className: STATUS_STYLES.CHECKED_IN,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: STATUS_STYLES.IN_PROGRESS,
  },
  COMPLETED: {
    label: 'Completed',
    className: STATUS_STYLES.COMPLETED,
  },
  NO_SHOW: {
    label: 'No Show',
    className: STATUS_STYLES.NO_SHOW,
  },
  CANCELLED: {
    label: 'Cancelled',
    className: STATUS_STYLES.CANCELLED,
  },
};

export { STATUS_CONFIG };
