import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Stethoscope, FlaskConical, Pill, FileText,
  AlertCircle, ChevronRight, Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

type EventType = 'appointment' | 'consultation' | 'lab_order' | 'prescription' | 'document' | 'vital_sign';

interface TimelineEvent {
  type: EventType;
  date: string;
  data: any;
}

const EVENT_CONFIG: Record<EventType, { icon: React.ComponentType<any>; color: string; bgColor: string }> = {
  appointment: { icon: Calendar, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  consultation: { icon: Stethoscope, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  lab_order: { icon: FlaskConical, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  prescription: { icon: Pill, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  document: { icon: FileText, color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-900/30' },
  vital_sign: { icon: AlertCircle, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' },
};

function AppointmentCard({ data }: { data: any }) {
  const { t } = useTranslation();
  const statusColors: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    CHECKED_IN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    NO_SHOW: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Badge className={statusColors[data.status] || ''} variant="secondary">
          {data.status?.replace(/_/g, ' ')}
        </Badge>
        {data.visitType && <Badge variant="outline" className="text-[10px]">{data.visitType?.replace(/_/g, ' ')}</Badge>}
      </div>
      {data.doctor && (
        <p className="text-xs text-muted-foreground">
          Dr. {data.doctor.firstName} {data.doctor.lastName}
          {data.specialty?.name && ` · ${data.specialty.name}`}
        </p>
      )}
      {data.notes && <p className="text-xs text-muted-foreground mt-1 italic">{data.notes}</p>}
    </div>
  );
}

function ConsultationCard({ data }: { data: any }) {
  const navigate = useNavigate();
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Badge variant={data.status === 'COMPLETED' ? 'secondary' : 'default'} className="text-[10px]">
          {data.status}
        </Badge>
        {data.specialty?.name && <span className="text-xs text-muted-foreground">{data.specialty.name}</span>}
      </div>
      {data.assessment && (
        <p className="text-xs text-foreground line-clamp-2 mt-1">{data.assessment}</p>
      )}
      {data.diagnoses && data.diagnoses.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {data.diagnoses.map((d: any, i: number) => (
            <Badge key={i} variant="outline" className="text-[10px]">
              {d.icd10Code}
            </Badge>
          ))}
        </div>
      )}
      {data.doctor && (
        <p className="text-xs text-muted-foreground mt-1">
          Dr. {data.doctor.firstName} {data.doctor.lastName}
        </p>
      )}
    </div>
  );
}

function LabOrderCard({ data }: { data: any }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Badge variant="secondary" className="text-[10px]">{data.status?.replace(/_/g, ' ')}</Badge>
        <Badge variant="outline" className="text-[10px]">{data.priority}</Badge>
      </div>
      {data.items && (
        <div className="space-y-1 mt-1">
          {data.items.slice(0, 3).map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-foreground">{item.testName}</span>
              {item.result && (
                <span className={item.result.isAbnormal ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
                  {item.result.value}{item.result.unit ? ` ${item.result.unit}` : ''}
                </span>
              )}
            </div>
          ))}
          {data.items.length > 3 && (
            <p className="text-[10px] text-muted-foreground">+{data.items.length - 3} more tests</p>
          )}
        </div>
      )}
    </div>
  );
}

function PrescriptionCard({ data }: { data: any }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Badge variant="secondary" className="text-[10px]">{data.status}</Badge>
        {data.doctor && (
          <span className="text-xs text-muted-foreground">
            Dr. {data.doctor.firstName} {data.doctor.lastName}
          </span>
        )}
      </div>
      {data.items && (
        <div className="space-y-0.5 mt-1">
          {data.items.slice(0, 3).map((item: any, i: number) => (
            <p key={i} className="text-xs text-foreground">
              {item.medicationName} <span className="text-muted-foreground">- {item.dosage} ({item.frequency})</span>
            </p>
          ))}
          {data.items.length > 3 && (
            <p className="text-[10px] text-muted-foreground">+{data.items.length - 3} more medications</p>
          )}
        </div>
      )}
    </div>
  );
}

export function TimelineEventCard({ event }: { event: TimelineEvent }) {
  const config = EVENT_CONFIG[event.type];
  const Icon = config.icon;

  const renderContent = () => {
    switch (event.type) {
      case 'appointment': return <AppointmentCard data={event.data} />;
      case 'consultation': return <ConsultationCard data={event.data} />;
      case 'lab_order': return <LabOrderCard data={event.data} />;
      case 'prescription': return <PrescriptionCard data={event.data} />;
      default: return <p className="text-xs text-muted-foreground">Event details</p>;
    }
  };

  return (
    <div className="flex gap-3 group">
      {/* Timeline dot and line */}
      <div className="flex flex-col items-center">
        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', config.bgColor)}>
          <Icon className={cn('h-4 w-4', config.color)} />
        </div>
        <div className="w-px flex-1 bg-border mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium capitalize text-foreground">
            {event.type.replace(/_/g, ' ')}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDateTime(event.date)}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3 hover:bg-accent/50 transition-colors">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
