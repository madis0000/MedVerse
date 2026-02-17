import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWaitingQueue } from '@/api/appointments';
import type { Appointment } from '@/types';

export function WaitingQueue() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading } = useWaitingQueue();

  const queue: Appointment[] = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : data.data ?? [];
  }, [data]);

  const handleStartConsultation = (appointmentId: string) => {
    navigate(`/consultations/${appointmentId}`);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{t('appointments.queue.title', 'Waiting Queue')}</CardTitle>
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-yellow-100 px-1.5 text-[10px] font-bold text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            {queue.length}
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg bg-muted p-3 h-[72px]"
              />
            ))}
          </div>
        ) : queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">{t('appointments.queue.empty', 'No patients waiting')}</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-2 pr-2">
              {queue.map((appointment) => {
                const patientName = appointment.patient
                  ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                  : t('appointments.unknownPatient', 'Unknown Patient');

                const checkInTime = format(parseISO(appointment.dateTime), 'h:mm a');
                const waitingDuration = formatDistanceToNow(
                  parseISO(appointment.dateTime),
                  { addSuffix: false },
                );

                return (
                  <div
                    key={appointment.id}
                    className="rounded-lg border bg-card p-3 transition-colors hover:bg-accent/30"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                        <User className="h-4 w-4 text-yellow-700 dark:text-yellow-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {patientName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {t('appointments.queue.checkInTime', 'Checked in')}: {checkInTime}
                          </span>
                          <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                            {waitingDuration}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => handleStartConsultation(appointment.id)}
                    >
                      {t('appointments.queue.startConsultation', 'Start Consultation')}
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
