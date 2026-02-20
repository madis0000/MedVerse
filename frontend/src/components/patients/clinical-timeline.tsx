import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Filter, Calendar, Stethoscope, FlaskConical, Pill, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import apiClient from '@/lib/api-client';
import { TimelineEventCard } from './timeline-event-card';

const EVENT_TYPES = ['all', 'appointment', 'consultation', 'lab_order', 'prescription'] as const;

function useClinicalTimeline(patientId: string) {
  return useQuery({
    queryKey: ['patients', patientId, 'clinical-timeline'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/patients/${patientId}/timeline`);
      return data?.data || data || [];
    },
    enabled: !!patientId,
  });
}

export function ClinicalTimeline({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<string>('all');
  const { data: timeline, isLoading } = useClinicalTimeline(patientId);

  const events = (timeline || []).filter(
    (event: any) => filter === 'all' || event.type === filter
  );

  const filterButtons = [
    { id: 'all', label: t('common.all'), icon: null },
    { id: 'appointment', label: t('nav.appointments'), icon: Calendar },
    { id: 'consultation', label: t('nav.consultations'), icon: Stethoscope },
    { id: 'lab_order', label: t('nav.laboratory'), icon: FlaskConical },
    { id: 'prescription', label: t('nav.prescriptions'), icon: Pill },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            {t('patients.clinicalTimeline')}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {events.length} {t('common.results')}
          </Badge>
        </div>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {filterButtons.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={filter === id ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setFilter(id)}
            >
              {Icon && <Icon className="h-3 w-3" />}
              {label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {t('patients.noVisitHistory')}
          </p>
        ) : (
          <div className="space-y-0">
            {events.map((event: any, index: number) => (
              <TimelineEventCard key={`${event.type}-${event.data?.id || index}`} event={event} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
