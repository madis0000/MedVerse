import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn, formatDate } from '@/lib/utils';
import apiClient from '@/lib/api-client';
import type { LesionRecord } from './lesion-body-map';

interface LesionEvolutionProps {
  patientId: string;
  currentLesions: LesionRecord[];
}

interface PastConsultation {
  id: string;
  createdAt: string;
  customFields?: {
    dermatology?: {
      lesions?: LesionRecord[];
    };
  };
}

interface LesionTimeline {
  region: string;
  entries: {
    date: string;
    consultationId: string;
    lesion: LesionRecord;
  }[];
  changes: LesionChange[];
}

interface LesionChange {
  field: string;
  from: string;
  to: string;
  isSignificant: boolean;
}

function compareLesions(prev: LesionRecord, current: LesionRecord): LesionChange[] {
  const changes: LesionChange[] = [];

  // Size change
  if (prev.size && current.size && prev.size !== current.size) {
    const prevSize = parseFloat(prev.size);
    const currSize = parseFloat(current.size);
    const percentChange = prevSize > 0 ? ((currSize - prevSize) / prevSize) * 100 : 0;
    changes.push({
      field: 'size',
      from: prev.size,
      to: current.size,
      isSignificant: Math.abs(percentChange) > 20,
    });
  }

  // Color change
  if (prev.color && current.color && prev.color !== current.color) {
    changes.push({
      field: 'color',
      from: prev.color,
      to: current.color,
      isSignificant: true,
    });
  }

  // Border change
  if (prev.border && current.border && prev.border !== current.border) {
    changes.push({
      field: 'border',
      from: prev.border,
      to: current.border,
      isSignificant: true,
    });
  }

  // Type / morphology change
  if (prev.type && current.type && prev.type !== current.type) {
    changes.push({
      field: 'type',
      from: prev.type,
      to: current.type,
      isSignificant: true,
    });
  }

  // Shape change
  if (prev.shape && current.shape && prev.shape !== current.shape) {
    changes.push({
      field: 'shape',
      from: prev.shape,
      to: current.shape,
      isSignificant: false,
    });
  }

  // Surface change
  if (prev.surface && current.surface && prev.surface !== current.surface) {
    changes.push({
      field: 'surface',
      from: prev.surface,
      to: current.surface,
      isSignificant: false,
    });
  }

  // Distribution change
  if (prev.distribution && current.distribution && prev.distribution !== current.distribution) {
    changes.push({
      field: 'distribution',
      from: prev.distribution,
      to: current.distribution,
      isSignificant: false,
    });
  }

  return changes;
}

export function LesionEvolution({ patientId, currentLesions }: LesionEvolutionProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [pastConsultations, setPastConsultations] = useState<PastConsultation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/consultations`, {
          params: { patientId, limit: 50 },
        });
        const consultations: PastConsultation[] = Array.isArray(response.data)
          ? response.data
          : response.data?.data || response.data?.consultations || [];
        // Filter to only those that have dermatology lesion data, sorted oldest first
        const withLesions = consultations
          .filter(
            (c) =>
              c.customFields?.dermatology?.lesions &&
              c.customFields.dermatology.lesions.length > 0,
          )
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
        setPastConsultations(withLesions);
      } catch (err) {
        console.error('Failed to fetch lesion history:', err);
        setError(t('specialties.dermatology.evolution.fetchError'));
      } finally {
        setLoading(false);
      }
    }

    if (patientId) {
      fetchHistory();
    }
  }, [patientId, t]);

  // Build timelines by matching lesions across visits by region
  const timelines = useMemo<LesionTimeline[]>(() => {
    // Collect all unique regions from current lesions
    const regionSet = new Set(currentLesions.map((l) => l.region));
    const result: LesionTimeline[] = [];

    for (const region of regionSet) {
      const entries: LesionTimeline['entries'] = [];

      // Past visits
      for (const consultation of pastConsultations) {
        const pastLesions = consultation.customFields?.dermatology?.lesions || [];
        const match = pastLesions.find((l) => l.region === region);
        if (match) {
          entries.push({
            date: consultation.createdAt,
            consultationId: consultation.id,
            lesion: match,
          });
        }
      }

      // Current visit
      const currentMatch = currentLesions.find((l) => l.region === region);
      if (currentMatch) {
        entries.push({
          date: currentMatch.createdAt || new Date().toISOString(),
          consultationId: 'current',
          lesion: currentMatch,
        });
      }

      // Calculate changes between consecutive entries
      const changes: LesionChange[] = [];
      if (entries.length >= 2) {
        const prev = entries[entries.length - 2].lesion;
        const curr = entries[entries.length - 1].lesion;
        changes.push(...compareLesions(prev, curr));
      }

      if (entries.length > 0) {
        result.push({ region, entries, changes });
      }
    }

    return result;
  }, [currentLesions, pastConsultations]);

  const hasSignificantChanges = timelines.some((tl) =>
    tl.changes.some((c) => c.isSignificant),
  );
  const hasPastData = pastConsultations.length > 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Clock className="h-5 w-5" />
          {t('specialties.dermatology.evolution.title')}
        </h3>
        {hasSignificantChanges && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {t('specialties.dermatology.evolution.significantChanges')}
          </Badge>
        )}
      </div>

      {!hasPastData && (
        <Card>
          <CardContent className="py-8 text-center">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {t('specialties.dermatology.evolution.noHistory')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('specialties.dermatology.evolution.noHistoryDescription')}
            </p>
          </CardContent>
        </Card>
      )}

      {timelines.map((timeline) => (
        <Card key={timeline.region}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{timeline.region}</CardTitle>
              <Badge variant="outline" className="text-xs">
                {timeline.entries.length}{' '}
                {timeline.entries.length === 1
                  ? t('specialties.dermatology.evolution.visit')
                  : t('specialties.dermatology.evolution.visits')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Changes summary */}
            {timeline.changes.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('specialties.dermatology.evolution.changesSinceLastVisit')}
                </p>
                {timeline.changes.map((change, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-center gap-2 rounded-md border px-3 py-2 text-sm',
                      change.isSignificant
                        ? 'border-destructive/30 bg-destructive/5'
                        : 'border-muted',
                    )}
                  >
                    {change.isSignificant ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                    ) : change.field === 'size' && parseFloat(change.to) > parseFloat(change.from) ? (
                      <TrendingUp className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className="font-medium">
                      {t(`specialties.dermatology.evolution.fields.${change.field}`)}:
                    </span>
                    <span className="text-muted-foreground line-through">{change.from}</span>
                    <span>&rarr;</span>
                    <span className={change.isSignificant ? 'text-destructive font-medium' : ''}>
                      {change.to}
                    </span>
                    {change.field === 'size' && (
                      <span className="text-xs text-muted-foreground">mm</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {timeline.changes.length === 0 && timeline.entries.length >= 2 && (
              <p className="text-sm text-muted-foreground">
                {t('specialties.dermatology.evolution.noChanges')}
              </p>
            )}

            <Separator />

            {/* Timeline entries */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('specialties.dermatology.evolution.timeline')}
              </p>
              <div className="relative space-y-3 pl-4">
                {/* Timeline line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

                {timeline.entries.map((entry, idx) => {
                  const isCurrent = entry.consultationId === 'current';
                  return (
                    <div key={idx} className="relative flex gap-3">
                      <div
                        className={cn(
                          'absolute left-[-9px] top-1.5 h-3 w-3 rounded-full border-2',
                          isCurrent
                            ? 'bg-primary border-primary'
                            : 'bg-background border-muted-foreground/40',
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">
                            {formatDate(entry.date)}
                          </span>
                          {isCurrent && (
                            <Badge variant="secondary" className="text-[10px]">
                              {t('specialties.dermatology.evolution.current')}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {entry.lesion.type && (
                            <Badge variant="outline" className="text-[10px]">
                              {t(`specialties.dermatology.morphologyTypes.${entry.lesion.type}`)}
                            </Badge>
                          )}
                          {entry.lesion.size && (
                            <Badge variant="outline" className="text-[10px]">
                              {entry.lesion.size}mm
                            </Badge>
                          )}
                          {entry.lesion.color && (
                            <Badge variant="outline" className="text-[10px]">
                              {t(`specialties.dermatology.colors.${entry.lesion.color}`)}
                            </Badge>
                          )}
                          {entry.lesion.border && (
                            <Badge variant="outline" className="text-[10px]">
                              {t(`specialties.dermatology.borders.${entry.lesion.border}`)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Side-by-side comparison if 2+ entries */}
            {timeline.entries.length >= 2 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('specialties.dermatology.evolution.comparison')}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Previous */}
                    <div className="rounded-md border p-3 space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        {t('specialties.dermatology.evolution.previous')}
                      </p>
                      <p className="text-xs">
                        {formatDate(timeline.entries[timeline.entries.length - 2].date)}
                      </p>
                      {renderLesionSummary(
                        timeline.entries[timeline.entries.length - 2].lesion,
                        t,
                      )}
                    </div>
                    {/* Current */}
                    <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-1.5">
                      <p className="text-xs font-medium text-primary">
                        {t('specialties.dermatology.evolution.current')}
                      </p>
                      <p className="text-xs">
                        {formatDate(timeline.entries[timeline.entries.length - 1].date)}
                      </p>
                      {renderLesionSummary(
                        timeline.entries[timeline.entries.length - 1].lesion,
                        t,
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}

      {hasPastData && timelines.length === 0 && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            {t('specialties.dermatology.evolution.noMatchingLesions')}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function renderLesionSummary(
  lesion: LesionRecord,
  t: (key: string) => string,
) {
  return (
    <div className="space-y-1 text-xs">
      {lesion.type && (
        <p>
          <span className="text-muted-foreground">
            {t('specialties.dermatology.lesionForm.morphologyType')}:
          </span>{' '}
          {t(`specialties.dermatology.morphologyTypes.${lesion.type}`)}
        </p>
      )}
      {lesion.size && (
        <p>
          <span className="text-muted-foreground">
            {t('specialties.dermatology.lesionForm.size')}:
          </span>{' '}
          {lesion.size}mm
        </p>
      )}
      {lesion.color && (
        <p>
          <span className="text-muted-foreground">
            {t('specialties.dermatology.lesionForm.color')}:
          </span>{' '}
          {t(`specialties.dermatology.colors.${lesion.color}`)}
        </p>
      )}
      {lesion.border && (
        <p>
          <span className="text-muted-foreground">
            {t('specialties.dermatology.lesionForm.border')}:
          </span>{' '}
          {t(`specialties.dermatology.borders.${lesion.border}`)}
        </p>
      )}
      {lesion.shape && (
        <p>
          <span className="text-muted-foreground">
            {t('specialties.dermatology.lesionForm.shape')}:
          </span>{' '}
          {t(`specialties.dermatology.shapes.${lesion.shape}`)}
        </p>
      )}
      {lesion.surface && (
        <p>
          <span className="text-muted-foreground">
            {t('specialties.dermatology.lesionForm.surface')}:
          </span>{' '}
          {t(`specialties.dermatology.surfaces.${lesion.surface}`)}
        </p>
      )}
    </div>
  );
}
