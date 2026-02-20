import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Pill, Activity } from 'lucide-react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';

interface TreatmentResponseProps {
  consultationId: string;
  patientId: string;
  readOnly?: boolean;
}

interface ScreeningEntry {
  id: string;
  instrumentType: string;
  score: number;
  severity: string;
  createdAt: string;
}

interface Prescription {
  id: string;
  medicationName: string;
  startDate: string;
  endDate?: string;
  dosage: string;
  status: string;
}

interface ChartDataPoint {
  date: string;
  timestamp: number;
  phq9?: number;
  gad7?: number;
}

interface MedicationMarker {
  date: string;
  timestamp: number;
  label: string;
  type: 'start' | 'stop';
  medication: string;
}

const MEDICATION_COLORS = [
  '#6366f1',
  '#ec4899',
  '#14b8a6',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
  '#22c55e',
  '#06b6d4',
];

export function TreatmentResponse({
  consultationId,
  patientId,
}: TreatmentResponseProps) {
  const { t } = useTranslation();
  const [screenings, setScreenings] = useState<ScreeningEntry[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [screeningRes, prescriptionRes] = await Promise.allSettled([
        apiClient.get(`/patients/${patientId}/screening-history`),
        apiClient.get('/prescriptions', { params: { patientId } }),
      ]);

      if (screeningRes.status === 'fulfilled') {
        const data = screeningRes.value.data;
        setScreenings(Array.isArray(data) ? data : data.data ?? []);
      }

      if (prescriptionRes.status === 'fulfilled') {
        const data = prescriptionRes.value.data;
        setPrescriptions(Array.isArray(data) ? data : data.data ?? []);
      }
    } catch {
      // Handle errors silently
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { chartData, medicationMarkers, activeMedications } = useMemo(() => {
    // Build chart data points from screenings
    const pointMap = new Map<string, ChartDataPoint>();

    for (const s of screenings) {
      const dateStr = formatDate(s.createdAt);
      const ts = new Date(s.createdAt).getTime();
      const existing = pointMap.get(dateStr) || {
        date: dateStr,
        timestamp: ts,
      };

      if (s.instrumentType === 'PHQ9') existing.phq9 = s.score;
      if (s.instrumentType === 'GAD7') existing.gad7 = s.score;

      pointMap.set(dateStr, existing);
    }

    const data = Array.from(pointMap.values()).sort(
      (a, b) => a.timestamp - b.timestamp,
    );

    // Build medication markers
    const markers: MedicationMarker[] = [];
    const active: Prescription[] = [];

    for (const rx of prescriptions) {
      if (rx.startDate) {
        markers.push({
          date: formatDate(rx.startDate),
          timestamp: new Date(rx.startDate).getTime(),
          label: `${rx.medicationName} ${rx.dosage} started`,
          type: 'start',
          medication: rx.medicationName,
        });
      }
      if (rx.endDate) {
        markers.push({
          date: formatDate(rx.endDate),
          timestamp: new Date(rx.endDate).getTime(),
          label: `${rx.medicationName} stopped`,
          type: 'stop',
          medication: rx.medicationName,
        });
      }
      if (rx.status === 'active' || !rx.endDate) {
        active.push(rx);
      }
    }

    return {
      chartData: data,
      medicationMarkers: markers.sort((a, b) => a.timestamp - b.timestamp),
      activeMedications: active,
    };
  }, [screenings, prescriptions]);

  // Assign consistent colors to medications
  const medicationColorMap = useMemo(() => {
    const uniqueMeds = Array.from(
      new Set(prescriptions.map((p) => p.medicationName)),
    );
    const map: Record<string, string> = {};
    uniqueMeds.forEach((med, i) => {
      map[med] = MEDICATION_COLORS[i % MEDICATION_COLORS.length];
    });
    return map;
  }, [prescriptions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (screenings.length === 0 && prescriptions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {t('specialties.psychiatry.noTreatmentData')}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('specialties.psychiatry.noTreatmentDataHint')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active medications list */}
      {activeMedications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Pill className="h-4 w-4" />
              {t('specialties.psychiatry.activeMedications')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {activeMedications.map((rx) => (
                <Badge
                  key={rx.id}
                  variant="outline"
                  className="border-2"
                  style={{
                    borderColor: medicationColorMap[rx.medicationName],
                    color: medicationColorMap[rx.medicationName],
                  }}
                >
                  {rx.medicationName} {rx.dosage}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Combined chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('specialties.psychiatry.treatmentResponseChart')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    yAxisId="scores"
                    domain={[0, 27]}
                    tick={{ fontSize: 12 }}
                    label={{
                      value: t('specialties.psychiatry.score'),
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: 12 },
                    }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;

                      // Find medication markers at this date
                      const dateMarkers = medicationMarkers.filter(
                        (m) => m.date === label,
                      );

                      return (
                        <div className="rounded-md border bg-popover p-3 text-sm shadow-md">
                          <p className="mb-1 font-medium">{label}</p>
                          {payload.map((p) => (
                            <p key={p.dataKey} style={{ color: p.color }}>
                              {p.name}: {p.value}
                            </p>
                          ))}
                          {dateMarkers.map((m, i) => (
                            <p
                              key={i}
                              className="mt-1 text-xs"
                              style={{
                                color: medicationColorMap[m.medication],
                              }}
                            >
                              {m.type === 'start' ? '+ ' : '- '}
                              {m.label}
                            </p>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Legend />

                  {/* PHQ-9 line */}
                  <Line
                    yAxisId="scores"
                    type="monotone"
                    dataKey="phq9"
                    name="PHQ-9"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    connectNulls
                  />

                  {/* GAD-7 line */}
                  <Line
                    yAxisId="scores"
                    type="monotone"
                    dataKey="gad7"
                    name="GAD-7"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    connectNulls
                  />

                  {/* Medication start/stop markers */}
                  {medicationMarkers.map((marker, idx) => (
                    <ReferenceLine
                      key={`med-${idx}`}
                      yAxisId="scores"
                      x={marker.date}
                      stroke={medicationColorMap[marker.medication]}
                      strokeDasharray={
                        marker.type === 'stop' ? '5 5' : undefined
                      }
                      strokeWidth={1.5}
                      label={{
                        value: marker.type === 'start' ? '+' : '-',
                        position: 'top',
                        fill: medicationColorMap[marker.medication],
                        fontSize: 14,
                        fontWeight: 'bold',
                      }}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t('specialties.psychiatry.noScreeningData')}
            </p>
          )}

          {/* Legend for medication markers */}
          {medicationMarkers.length > 0 && (
            <div className="mt-4 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {t('specialties.psychiatry.medicationChanges')}:
              </p>
              <div className="flex flex-wrap gap-3">
                {medicationMarkers.map((marker, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 text-xs"
                    style={{ color: medicationColorMap[marker.medication] }}
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: medicationColorMap[marker.medication],
                      }}
                    />
                    {marker.label} ({marker.date})
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
