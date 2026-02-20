import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import apiClient from '@/lib/api-client';

export interface StressTestData {
  protocol: string;
  duration: number | null;
  metsAchieved: number | null;
  baselineHR: number | null;
  peakHR: number | null;
  targetHR: number | null;
  percentTargetAchieved: number | null;
  baselineSBP: number | null;
  baselineDBP: number | null;
  peakSBP: number | null;
  peakDBP: number | null;
  symptoms: string[];
  ecgChanges: string[];
  conclusion: string;
  interpretation: string;
}

interface StressTestFormProps {
  consultationId: string;
  readOnly?: boolean;
  existingData?: StressTestData;
}

const PROTOCOL_OPTIONS = ['bruce', 'modifiedBruce', 'pharmDobutamine', 'pharmAdenosine'] as const;

const SYMPTOM_OPTIONS = [
  'none',
  'chestPain',
  'dyspnea',
  'fatigue',
  'dizziness',
  'legPain',
] as const;

const ECG_CHANGE_OPTIONS = [
  'none',
  'stDepression',
  'stElevation',
  'arrhythmia',
] as const;

const CONCLUSION_OPTIONS = [
  'normal',
  'positiveForIschemia',
  'equivocal',
  'nonDiagnostic',
] as const;

const DEFAULT_STRESS_TEST: StressTestData = {
  protocol: '',
  duration: null,
  metsAchieved: null,
  baselineHR: null,
  peakHR: null,
  targetHR: null,
  percentTargetAchieved: null,
  baselineSBP: null,
  baselineDBP: null,
  peakSBP: null,
  peakDBP: null,
  symptoms: [],
  ecgChanges: [],
  conclusion: '',
  interpretation: '',
};

export function StressTestForm({
  consultationId,
  readOnly = false,
  existingData,
}: StressTestFormProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<StressTestData>(existingData || DEFAULT_STRESS_TEST);
  const [patientAge, setPatientAge] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Auto-calculate target HR (220 - age) and % achieved
  const targetHR = useMemo(() => {
    if (!patientAge || patientAge <= 0) return null;
    return 220 - patientAge;
  }, [patientAge]);

  const percentTarget = useMemo(() => {
    if (!targetHR || !data.peakHR) return null;
    return Math.round((data.peakHR / targetHR) * 100);
  }, [targetHR, data.peakHR]);

  const autoSave = useCallback(
    (updatedData: StressTestData) => {
      if (readOnly) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        try {
          await apiClient.patch(`/consultations/${consultationId}`, {
            customFields: {
              cardiology: {
                stressTest: {
                  ...updatedData,
                  targetHR,
                  percentTargetAchieved: percentTarget,
                },
              },
            },
          });
        } catch {
          toast.error(t('specialties.cardiology.stressTest.saveFailed'));
        }
      }, 1500);
    },
    [consultationId, readOnly, targetHR, percentTarget, t]
  );

  const updateField = useCallback(
    <K extends keyof StressTestData>(field: K, value: StressTestData[K]) => {
      setData((prev) => {
        const updated = { ...prev, [field]: value };
        autoSave(updated);
        return updated;
      });
    },
    [autoSave]
  );

  const toggleArrayField = useCallback(
    (field: 'symptoms' | 'ecgChanges', item: string) => {
      setData((prev) => {
        let newItems: string[];
        if (item === 'none') {
          newItems = prev[field].includes('none') ? [] : ['none'];
        } else {
          const withoutNone = prev[field].filter((i) => i !== 'none');
          newItems = withoutNone.includes(item)
            ? withoutNone.filter((i) => i !== item)
            : [...withoutNone, item];
        }
        const updated = { ...prev, [field]: newItems };
        autoSave(updated);
        return updated;
      });
    },
    [autoSave]
  );

  const saveManually = useCallback(async () => {
    setSaving(true);
    try {
      await apiClient.patch(`/consultations/${consultationId}`, {
        customFields: {
          cardiology: {
            stressTest: {
              ...data,
              targetHR,
              percentTargetAchieved: percentTarget,
            },
          },
        },
      });
      toast.success(t('specialties.cardiology.stressTest.saved'));
    } catch {
      toast.error(t('specialties.cardiology.stressTest.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [consultationId, data, targetHR, percentTarget, t]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Activity className="h-5 w-5 text-emerald-500" />
          {t('specialties.cardiology.stressTest.title')}
        </h3>
        {!readOnly && (
          <Button onClick={saveManually} disabled={saving} size="sm">
            <Save className="mr-2 h-4 w-4" />
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        )}
      </div>

      {/* Protocol & Duration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {t('specialties.cardiology.stressTest.protocolSection')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t('specialties.cardiology.stressTest.protocol')}</Label>
              <Select
                value={data.protocol}
                onValueChange={(v) => updateField('protocol', v)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('specialties.cardiology.stressTest.selectProtocol')} />
                </SelectTrigger>
                <SelectContent>
                  {PROTOCOL_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {t(`specialties.cardiology.stressTest.protocols.${p}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('specialties.cardiology.stressTest.duration')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={60}
                  value={data.duration ?? ''}
                  onChange={(e) => updateField('duration', e.target.value ? Number(e.target.value) : null)}
                  disabled={readOnly}
                  placeholder="min"
                />
                <span className="text-sm text-muted-foreground">min</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('specialties.cardiology.stressTest.mets')}</Label>
              <Input
                type="number"
                min={0}
                max={25}
                step={0.1}
                value={data.metsAchieved ?? ''}
                onChange={(e) => updateField('metsAchieved', e.target.value ? Number(e.target.value) : null)}
                disabled={readOnly}
                placeholder="METs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Heart Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {t('specialties.cardiology.stressTest.heartRateSection')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>{t('specialties.cardiology.stressTest.patientAge')}</Label>
              <Input
                type="number"
                min={0}
                max={120}
                value={patientAge || ''}
                onChange={(e) => setPatientAge(Number(e.target.value))}
                disabled={readOnly}
                placeholder={t('specialties.cardiology.stressTest.ageForTarget')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('specialties.cardiology.stressTest.baselineHR')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={250}
                  value={data.baselineHR ?? ''}
                  onChange={(e) => updateField('baselineHR', e.target.value ? Number(e.target.value) : null)}
                  disabled={readOnly}
                  placeholder="bpm"
                />
                <span className="text-xs text-muted-foreground">bpm</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('specialties.cardiology.stressTest.peakHR')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={250}
                  value={data.peakHR ?? ''}
                  onChange={(e) => updateField('peakHR', e.target.value ? Number(e.target.value) : null)}
                  disabled={readOnly}
                  placeholder="bpm"
                />
                <span className="text-xs text-muted-foreground">bpm</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('specialties.cardiology.stressTest.targetHR')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={targetHR ? `${targetHR} bpm` : '--'}
                  disabled
                  className="bg-muted"
                />
              </div>
              {percentTarget !== null && (
                <Badge
                  className={
                    percentTarget >= 85
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }
                >
                  {percentTarget}% {t('specialties.cardiology.stressTest.ofTarget')}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blood Pressure */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {t('specialties.cardiology.stressTest.bloodPressure')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-2">
                {t('specialties.cardiology.stressTest.baseline')}
              </h5>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={300}
                  value={data.baselineSBP ?? ''}
                  onChange={(e) => updateField('baselineSBP', e.target.value ? Number(e.target.value) : null)}
                  disabled={readOnly}
                  placeholder="SBP"
                  className="w-24"
                />
                <span className="text-sm">/</span>
                <Input
                  type="number"
                  min={0}
                  max={200}
                  value={data.baselineDBP ?? ''}
                  onChange={(e) => updateField('baselineDBP', e.target.value ? Number(e.target.value) : null)}
                  disabled={readOnly}
                  placeholder="DBP"
                  className="w-24"
                />
                <span className="text-xs text-muted-foreground">mmHg</span>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-2">
                {t('specialties.cardiology.stressTest.peak')}
              </h5>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={300}
                  value={data.peakSBP ?? ''}
                  onChange={(e) => updateField('peakSBP', e.target.value ? Number(e.target.value) : null)}
                  disabled={readOnly}
                  placeholder="SBP"
                  className="w-24"
                />
                <span className="text-sm">/</span>
                <Input
                  type="number"
                  min={0}
                  max={200}
                  value={data.peakDBP ?? ''}
                  onChange={(e) => updateField('peakDBP', e.target.value ? Number(e.target.value) : null)}
                  disabled={readOnly}
                  placeholder="DBP"
                  className="w-24"
                />
                <span className="text-xs text-muted-foreground">mmHg</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Symptoms & ECG Changes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {t('specialties.cardiology.stressTest.findingsSection')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">
              {t('specialties.cardiology.stressTest.symptoms')}
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SYMPTOM_OPTIONS.map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <Checkbox
                    id={`symptom-${s}`}
                    checked={data.symptoms.includes(s)}
                    onCheckedChange={() => toggleArrayField('symptoms', s)}
                    disabled={readOnly}
                  />
                  <Label htmlFor={`symptom-${s}`}>
                    {t(`specialties.cardiology.stressTest.symptomOptions.${s}`)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <Label className="mb-2 block">
              {t('specialties.cardiology.stressTest.ecgChanges')}
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {ECG_CHANGE_OPTIONS.map((e) => (
                <div key={e} className="flex items-center gap-2">
                  <Checkbox
                    id={`ecgchange-${e}`}
                    checked={data.ecgChanges.includes(e)}
                    onCheckedChange={() => toggleArrayField('ecgChanges', e)}
                    disabled={readOnly}
                  />
                  <Label htmlFor={`ecgchange-${e}`}>
                    {t(`specialties.cardiology.stressTest.ecgChangeOptions.${e}`)}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conclusion */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {t('specialties.cardiology.stressTest.conclusionSection')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('specialties.cardiology.stressTest.conclusion')}</Label>
            <Select
              value={data.conclusion}
              onValueChange={(v) => updateField('conclusion', v)}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('specialties.cardiology.stressTest.selectConclusion')} />
              </SelectTrigger>
              <SelectContent>
                {CONCLUSION_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`specialties.cardiology.stressTest.conclusions.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('specialties.cardiology.stressTest.interpretation')}</Label>
            <Textarea
              value={data.interpretation}
              onChange={(e) => updateField('interpretation', e.target.value)}
              disabled={readOnly}
              placeholder={t('specialties.cardiology.stressTest.interpretationPlaceholder')}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
