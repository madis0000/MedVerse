import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Clock, User, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppointments } from '@/api/appointments';
import type { Appointment } from '@/types';

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CHECKED_IN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  IN_PROGRESS: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  COMPLETED: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  NO_SHOW: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function AppointmentWidget() {
  const { t, i18n } = useTranslation();
  const today = new Date().toISOString().split('T')[0];
  const { data, isLoading } = useAppointments({ date: today, limit: 5 });

  const appointments: Appointment[] = data?.data || [];

  function formatTime(dateTime: string) {
    return new Date(dateTime).toLocaleTimeString(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">{t('dashboard.upcomingAppointments')}</CardTitle>
        <Link
          to="/appointments"
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          {t('dashboard.viewAll')}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 animate-pulse">
                <div className="h-9 w-9 rounded-full bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-28 bg-muted rounded" />
                  <div className="h-3 w-20 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{t('dashboard.noUpcomingAppointments')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {appointments.map((apt) => (
              <Link
                key={apt.id}
                to={`/appointments/${apt.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {apt.patient
                      ? `${apt.patient.firstName} ${apt.patient.lastName}`
                      : t('common.noData')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(apt.dateTime)} - {formatTime(apt.endTime)}
                    {apt.specialty && ` | ${apt.specialty.name}`}
                  </p>
                </div>
                <Badge className={statusColors[apt.status] || ''} variant="secondary">
                  {t(`appointments.status.${apt.status}`, { defaultValue: apt.status.replace('_', ' ') })}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
