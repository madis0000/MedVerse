import {
  Stethoscope,
  FlaskConical,
  Pill,
  FileText,
  Calendar,
  AlertCircle,
  Video,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatDateTime } from '@/lib/utils';
import { usePatientTimeline } from '@/api/patients';

interface TimelineEvent {
  id: string;
  type: 'CONSULTATION' | 'LAB_ORDER' | 'PRESCRIPTION' | 'DOCUMENT' | 'APPOINTMENT' | 'EMERGENCY';
  title: string;
  description?: string;
  status?: string;
  doctorName?: string;
  dateTime: string;
  referenceId?: string;
}

interface VisitHistoryTimelineProps {
  patientId: string;
}

const eventIcons: Record<string, typeof Stethoscope> = {
  CONSULTATION: Stethoscope,
  LAB_ORDER: FlaskConical,
  PRESCRIPTION: Pill,
  DOCUMENT: FileText,
  APPOINTMENT: Calendar,
  EMERGENCY: AlertCircle,
  TELECONSULTATION: Video,
};

const eventColors: Record<string, string> = {
  CONSULTATION: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  LAB_ORDER: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  PRESCRIPTION: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  DOCUMENT: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
  APPOINTMENT: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  EMERGENCY: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

const statusBadgeColors: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  RESULTS_AVAILABLE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export function VisitHistoryTimeline({ patientId }: VisitHistoryTimelineProps) {
  const { data, isLoading } = usePatientTimeline(patientId);

  const events: TimelineEvent[] = data?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="flex-1 w-0.5 bg-muted mt-2" />
            </div>
            <div className="flex-1 pb-6 space-y-2">
              <div className="h-4 w-40 bg-muted rounded" />
              <div className="h-3 w-60 bg-muted rounded" />
              <div className="h-3 w-32 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
        <h3 className="text-sm font-medium text-foreground mb-1">No visit history</h3>
        <p className="text-sm text-muted-foreground">
          This patient does not have any recorded visits yet.
        </p>
      </div>
    );
  }

  let lastDate = '';

  return (
    <div className="space-y-0">
      {events.map((event, index) => {
        const Icon = eventIcons[event.type] || Calendar;
        const iconColor = eventColors[event.type] || eventColors.APPOINTMENT;
        const isLast = index === events.length - 1;
        const eventDate = formatDate(event.dateTime);
        const showDateHeader = eventDate !== lastDate;
        lastDate = eventDate;

        return (
          <div key={event.id}>
            {showDateHeader && (
              <div className="flex items-center gap-3 py-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium text-muted-foreground px-2">
                  {eventDate}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
            )}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconColor}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                {!isLast && <div className="flex-1 w-0.5 bg-border mt-2" />}
              </div>
              <div className={`flex-1 ${!isLast ? 'pb-6' : ''}`}>
                <div className="rounded-lg border bg-card p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{event.title}</p>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                      )}
                    </div>
                    {event.status && (
                      <Badge
                        className={statusBadgeColors[event.status] || ''}
                        variant="secondary"
                      >
                        {event.status.replace(/_/g, ' ')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{formatDateTime(event.dateTime)}</span>
                    {event.doctorName && <span>Dr. {event.doctorName}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
