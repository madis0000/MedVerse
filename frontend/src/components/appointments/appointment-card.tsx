import { useTranslation } from 'react-i18next';
import { Clock, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Appointment, AppointmentStatus } from '@/types';

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  SCHEDULED: 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20',
  CHECKED_IN: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
  IN_PROGRESS: 'border-l-green-500 bg-green-50 dark:bg-green-950/20',
  COMPLETED: 'border-l-gray-400 bg-gray-50 dark:bg-gray-950/20',
  NO_SHOW: 'border-l-red-500 bg-red-50 dark:bg-red-950/20',
  CANCELLED: 'border-l-gray-300 bg-gray-50 opacity-60 dark:bg-gray-950/20',
};

const VISIT_TYPE_KEYS: Record<string, string> = {
  FIRST_VISIT: 'appointments.types.NEW_VISIT',
  FOLLOW_UP: 'appointments.types.FOLLOW_UP',
  EMERGENCY: 'appointments.types.URGENT',
  PROCEDURE: 'appointments.types.PROCEDURE',
  TELECONSULTATION: 'appointments.types.CONSULTATION',
};

interface AppointmentCardProps {
  appointment: Appointment;
  compact?: boolean;
  onClick?: (appointment: Appointment) => void;
}

export function AppointmentCard({
  appointment,
  compact = false,
  onClick,
}: AppointmentCardProps) {
  const { t } = useTranslation();

  const patientName = appointment.patient
    ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
    : t('appointments.unknownPatient', 'Unknown Patient');

  const timeStr = format(parseISO(appointment.dateTime), 'h:mm a');
  const visitLabel = VISIT_TYPE_KEYS[appointment.visitType]
    ? t(VISIT_TYPE_KEYS[appointment.visitType])
    : appointment.visitType;

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onClick?.(appointment)}
        className={cn(
          'w-full text-left rounded px-1.5 py-0.5 text-xs font-medium truncate border-l-2 cursor-pointer transition-opacity hover:opacity-80',
          STATUS_COLORS[appointment.status],
          appointment.status === 'CANCELLED' && 'line-through',
        )}
        title={`${timeStr} - ${patientName} (${visitLabel})`}
      >
        <span className="font-semibold">{timeStr}</span>{' '}
        <span className="text-muted-foreground">{patientName}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onClick?.(appointment)}
      className={cn(
        'w-full text-left rounded-lg border-l-4 p-3 shadow-sm cursor-pointer transition-all hover:shadow-md',
        STATUS_COLORS[appointment.status],
        appointment.status === 'CANCELLED' && 'line-through',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground truncate">
            <User className="h-3.5 w-3.5 shrink-0" />
            {patientName}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            {timeStr}
          </div>
        </div>
        <span className="shrink-0 rounded bg-background/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {visitLabel}
        </span>
      </div>
    </button>
  );
}
