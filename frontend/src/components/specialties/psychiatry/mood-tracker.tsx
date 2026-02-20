import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, SmilePlus } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

interface MoodTrackerProps {
  consultationId: string;
  patientId: string;
  readOnly?: boolean;
}

interface MoodData {
  moodRating: number;
  sleepQuality: number;
  appetite: number;
  energy: number;
  concentration: number;
}

interface ConsultationMood {
  consultationId: string;
  date: string;
  mood: MoodData;
}

const DEFAULT_MOOD: MoodData = {
  moodRating: 5,
  sleepQuality: 3,
  appetite: 3,
  energy: 3,
  concentration: 3,
};

const SYMPTOM_DOMAINS: {
  key: keyof Omit<MoodData, 'moodRating'>;
  labelKey: string;
  min: number;
  max: number;
}[] = [
  { key: 'sleepQuality', labelKey: 'sleepQuality', min: 1, max: 5 },
  { key: 'appetite', labelKey: 'appetite', min: 1, max: 5 },
  { key: 'energy', labelKey: 'energy', min: 1, max: 5 },
  { key: 'concentration', labelKey: 'concentration', min: 1, max: 5 },
];

export function MoodTracker({
  consultationId,
  patientId,
  readOnly = false,
}: MoodTrackerProps) {
  const { t } = useTranslation();
  const [currentMood, setCurrentMood] = useState<MoodData>(DEFAULT_MOOD);
  const [history, setHistory] = useState<ConsultationMood[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchMoodHistory = useCallback(async () => {
    try {
      // Fetch past consultation moods for this patient
      const { data } = await apiClient.get(`/patients/${patientId}/consultations`, {
        params: { fields: 'customFields.psychiatry.moodRating,createdAt' },
      });

      const consultations = Array.isArray(data) ? data : data.data ?? [];
      const moodEntries: ConsultationMood[] = [];

      for (const c of consultations) {
        const mood = c.customFields?.psychiatry?.moodRating;
        if (mood) {
          moodEntries.push({
            consultationId: c.id || c._id,
            date: c.createdAt,
            mood,
          });
        }

        // Pre-fill current mood if this is the current consultation
        if ((c.id || c._id) === consultationId && mood) {
          setCurrentMood(mood);
        }
      }

      setHistory(
        moodEntries.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        ),
      );
    } catch {
      // Silently handle missing endpoint
    } finally {
      setLoading(false);
    }
  }, [patientId, consultationId]);

  useEffect(() => {
    fetchMoodHistory();
  }, [fetchMoodHistory]);

  const handleMoodChange = useCallback(
    (field: keyof MoodData, value: number) => {
      if (readOnly) return;
      setCurrentMood((prev) => ({ ...prev, [field]: value }));
    },
    [readOnly],
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await apiClient.patch(`/consultations/${consultationId}`, {
        customFields: {
          psychiatry: {
            moodRating: currentMood,
          },
        },
      });
      toast.success(t('specialties.psychiatry.moodSaved'));
      fetchMoodHistory();
    } catch {
      toast.error(t('specialties.psychiatry.moodSaveError'));
    } finally {
      setSaving(false);
    }
  }, [consultationId, currentMood, t, fetchMoodHistory]);

  const chartData = history.map((entry) => ({
    date: formatDate(entry.date),
    mood: entry.mood.moodRating,
    sleep: entry.mood.sleepQuality,
    appetite: entry.mood.appetite,
    energy: entry.mood.energy,
    concentration: entry.mood.concentration,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trend chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('specialties.psychiatry.moodTrend')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-md border bg-popover p-3 text-sm shadow-md">
                          <p className="mb-1 font-medium">{label}</p>
                          {payload.map((p) => (
                            <p key={p.dataKey} style={{ color: p.color }}>
                              {p.name}: {p.value}
                            </p>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="mood"
                    name={t('specialties.psychiatry.mood')}
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sleep"
                    name={t('specialties.psychiatry.sleepQuality')}
                    stroke="#6366f1"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="energy"
                    name={t('specialties.psychiatry.energy')}
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current session mood input */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SmilePlus className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">
              {t('specialties.psychiatry.currentSessionMood')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mood rating (1-10) */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {t('specialties.psychiatry.overallMood')} (1-10)
            </Label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={1}
                max={10}
                value={currentMood.moodRating}
                onChange={(e) =>
                  handleMoodChange('moodRating', parseInt(e.target.value, 10))
                }
                disabled={readOnly}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary disabled:cursor-default disabled:opacity-50"
              />
              <span className="min-w-[2.5rem] rounded-md border bg-muted px-2 py-1 text-center text-lg font-bold">
                {currentMood.moodRating}
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('specialties.psychiatry.veryLow')}</span>
              <span>{t('specialties.psychiatry.excellent')}</span>
            </div>
          </div>

          <Separator />

          {/* Symptom frequency trackers */}
          <div>
            <Label className="mb-3 block text-sm font-medium">
              {t('specialties.psychiatry.symptomTrackers')}
            </Label>
            <div className="grid gap-4 sm:grid-cols-2">
              {SYMPTOM_DOMAINS.map((domain) => (
                <div
                  key={domain.key}
                  className="space-y-2 rounded-lg border p-3"
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">
                      {t(`specialties.psychiatry.${domain.labelKey}`)}
                    </Label>
                    <span className="text-sm font-medium">
                      {currentMood[domain.key]}/{domain.max}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from(
                      { length: domain.max },
                      (_, i) => i + domain.min,
                    ).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleMoodChange(domain.key, val)}
                        disabled={readOnly}
                        className={`flex h-8 flex-1 items-center justify-center rounded-md border text-xs font-medium transition-colors ${
                          currentMood[domain.key] >= val
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background hover:bg-accent'
                        } disabled:cursor-default disabled:opacity-50`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save button */}
          {!readOnly && (
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {t('specialties.psychiatry.saveMood')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
