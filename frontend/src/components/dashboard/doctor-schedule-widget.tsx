import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { Appointment } from '@/types';

interface ScheduleItem extends Appointment {
  isNext?: boolean;
}

const statusIcons: Record<string, typeof Circle> = {
  COMPLETED: CheckCircle2,
  IN_PROGRESS: AlertCircle,
  SCHEDULED: Circle,
  CHECKED_IN: Circle,
};

const statusLineColors: Record<string, string> = {
  COMPLETED: 'bg-green-500',
  IN_PROGRESS: 'bg-blue-500',
  SCHEDULED: 'bg-muted-foreground/30',
  CHECKED_IN: 'bg-amber-500',
};

const statusIconColors: Record<string, string> = {
  COMPLETED: 'text-green-500',
  IN_PROGRESS: 'text-blue-500',
  SCHEDULED: 'text-muted-foreground/50',
  CHECKED_IN: 'text-amber-500',
};

export function DoctorScheduleWidget() {
  const { t, i18n } = useTranslation();
  const today = new Date().toISOString().split('T')[0];

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'doctor-schedule', today],
    queryFn: async () => {
      const { data } = await apiClient.get('/dashboard/doctor/schedule', {
        params: { date: today },
      });
      return data;
    },
  });

  const schedule: ScheduleItem[] = data?.data || [];

  function formatTime(dateTime: string) {
    return new Date(dateTime).toLocaleTimeString(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">{t('dashboard.todaysSchedule')}</CardTitle>
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
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="flex flex-col items-center">
                  <div className="h-5 w-5 rounded-full bg-muted" />
                  <div className="flex-1 w-0.5 bg-muted mt-1" />
                </div>
                <div className="flex-1 pb-4 space-y-1.5">
                  <div className="h-3.5 w-32 bg-muted rounded" />
                  <div className="h-3 w-20 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : schedule.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{t('dashboard.noAppointmentsToday')}</p>
          </div>
        ) : (
          <div className="space-y-0">
            {schedule.map((item, index) => {
              const StatusIcon = statusIcons[item.status] || Circle;
              const lineColor = statusLineColors[item.status] || 'bg-muted-foreground/30';
              const iconColor = statusIconColors[item.status] || 'text-muted-foreground/50';
              const isLast = index === schedule.length - 1;

              return (
                <div key={item.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <StatusIcon className={`h-5 w-5 shrink-0 ${iconColor}`} />
                    {!isLast && <div className={`flex-1 w-0.5 ${lineColor} mt-1`} />}
                  </div>
                  <div className={`flex-1 ${!isLast ? 'pb-4' : ''}`}>
                    <Link
                      to={`/appointments/${item.id}`}
                      className="block hover:bg-muted/50 -mx-2 px-2 py-1 rounded-md transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">
                          {item.patient
                            ? `${item.patient.firstName} ${item.patient.lastName}`
                            : t('common.noData')}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {item.visitType
                            ? t(`appointments.types.${item.visitType}`, { defaultValue: item.visitType.replace('_', ' ') })
                            : t('appointments.types.CONSULTATION')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatTime(item.dateTime)} - {formatTime(item.endTime)}
                        {item.specialty && ` | ${item.specialty.name}`}
                      </p>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
