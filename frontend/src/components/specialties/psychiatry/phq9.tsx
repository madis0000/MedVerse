import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { getInstrument } from '@/lib/screening-instruments';
import { ScreeningInstrumentForm } from './screening-instrument';
import { formatDate } from '@/lib/utils';

interface PHQ9Props {
  consultationId: string;
  patientId: string;
  readOnly?: boolean;
}

interface ScreeningRecord {
  id: string;
  instrumentType: string;
  score: number;
  severity: string;
  responses: number[];
  createdAt: string;
}

export function PHQ9({ consultationId, patientId, readOnly = false }: PHQ9Props) {
  const { t } = useTranslation();
  const instrument = getInstrument('PHQ9')!;

  const [history, setHistory] = useState<ScreeningRecord[]>([]);
  const [existingResponses, setExistingResponses] = useState<number[] | undefined>();
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await apiClient.get(
        `/consultations/${consultationId}/screenings`,
        { params: { type: 'PHQ9' } },
      );
      const records: ScreeningRecord[] = Array.isArray(data) ? data : data.data ?? [];
      setHistory(records);

      // Check if there is an existing screening for this consultation
      const existing = records.find(
        (r) => r.instrumentType === 'PHQ9',
      );
      if (existing) {
        setExistingResponses(existing.responses);
      }
    } catch {
      // Silently handle missing endpoint
    } finally {
      setLoading(false);
    }
  }, [consultationId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleComplete = useCallback(
    async (score: number, responses: number[]) => {
      try {
        const result = instrument.scoringFunction(responses);
        await apiClient.post(`/consultations/${consultationId}/screenings`, {
          instrumentType: 'PHQ9',
          score,
          severity: result.severity,
          responses,
        });
        toast.success(t('specialties.psychiatry.screeningSaved'));
        fetchHistory();
      } catch {
        toast.error(t('specialties.psychiatry.screeningSaveError'));
      }
    },
    [consultationId, instrument, t, fetchHistory],
  );

  const chartData = history
    .slice()
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .map((record) => ({
      date: formatDate(record.createdAt),
      score: record.score,
      severity: record.severity,
    }));

  const lastTwo = chartData.slice(-2);
  const trend =
    lastTwo.length === 2
      ? lastTwo[1].score < lastTwo[0].score
        ? 'improving'
        : lastTwo[1].score > lastTwo[0].score
          ? 'worsening'
          : 'stable'
      : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* History chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {t('specialties.psychiatry.phq9History')}
              </CardTitle>
              <div className="flex items-center gap-2">
                {trend === 'improving' && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <TrendingDown className="mr-1 h-3 w-3" />
                    {t('specialties.psychiatry.improving')}
                  </Badge>
                )}
                {trend === 'worsening' && (
                  <Badge variant="secondary" className="bg-red-100 text-red-700">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {t('specialties.psychiatry.worsening')}
                  </Badge>
                )}
                {trend === 'stable' && (
                  <Badge variant="secondary">
                    <Minus className="mr-1 h-3 w-3" />
                    {t('specialties.psychiatry.stable')}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    domain={[0, 27]}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-md border bg-popover p-2 text-sm shadow-md">
                          <p className="font-medium">{data.date}</p>
                          <p>
                            {t('specialties.psychiatry.score')}: {data.score}/27
                          </p>
                          <p className="text-muted-foreground">{data.severity}</p>
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Severity reference bands */}
            <div className="mt-3 flex flex-wrap gap-2">
              {instrument.severityBands.map((band) => (
                <div key={band.label} className="flex items-center gap-1 text-xs">
                  <div className={`h-2 w-2 rounded-full ${band.color}`} />
                  <span className="text-muted-foreground">
                    {band.label} ({band.min}-{band.max})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current screening form */}
      <ScreeningInstrumentForm
        instrument={instrument}
        consultationId={consultationId}
        patientId={patientId}
        existingResponses={existingResponses}
        readOnly={readOnly}
        onComplete={handleComplete}
      />
    </div>
  );
}
