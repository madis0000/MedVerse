import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export interface ECGFindings {
  rate: number | null;
  rhythm: string;
  axis: string;
  prInterval: number | null;
  qrsDuration: number | null;
  qtInterval: number | null;
  qtc: number | null;
  stChanges: string[];
  stChangeLeads: string;
  interpretation: string;
}

interface ECGFindingsFormProps {
  consultationId: string;
  readOnly?: boolean;
  existingData?: ECGFindings;
}

const RHYTHM_OPTIONS = [
  'sinus',
  'atrialFibrillation',
  'atrialFlutter',
  'svt',
  'vt',
  'paced',
  'other',
] as const;

const AXIS_OPTIONS = [
  'normal',
  'leftAxisDeviation',
  'rightAxisDeviation',
  'extremeAxis',
] as const;

const ST_CHANGE_OPTIONS = [
  'none',
  'stElevation',
  'stDepression',
  'tWaveInversion',
  'tWaveFlattening',
] as const;

const DEFAULT_ECG: ECGFindings = {
  rate: null,
  rhythm: '',
  axis: '',
  prInterval: null,
  qrsDuration: null,
  qtInterval: null,
  qtc: null,
  stChanges: [],
  stChangeLeads: '',
  interpretation: '',
};

export function ECGFindingsForm({
  consultationId,
  readOnly = false,
  existingData,
}: ECGFindingsFormProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<ECGFindings>(existingData || DEFAULT_ECG);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate QTc using Bazett formula: QTc = QT / sqrt(RR), RR = 60/HR
  const qtc = useMemo(() => {
    if (!data.qtInterval || !data.rate || data.rate <= 0) return null;
    const rrSeconds = 60 / data.rate;
    const qtSeconds = data.qtInterval / 1000;
    const qtcValue = qtSeconds / Math.sqrt(rrSeconds);
    return Math.round(qtcValue * 1000);
  }, [data.qtInterval, data.rate]);

  // Debounced auto-save
  const autoSave = useCallback(
    (updatedData: ECGFindings) => {
      if (readOnly) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        try {
          await apiClient.patch(`/consultations/${consultationId}`, {
            customFields: {
              cardiology: {
                ecg: { ...updatedData, qtc },
              },
            },
          });
        } catch {
          toast.error(t('specialties.cardiology.ecg.saveFailed'));
        }
      }, 1500);
    },
    [consultationId, readOnly, qtc, t]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const updateField = useCallback(
    <K extends keyof ECGFindings>(field: K, value: ECGFindings[K]) => {
      setData((prev) => {
        const updated = { ...prev, [field]: value };
        autoSave(updated);
        return updated;
      });
    },
    [autoSave]
  );

  const toggleSTChange = useCallback(
    (change: string) => {
      setData((prev) => {
        let newChanges: string[];
        if (change === 'none') {
          newChanges = prev.stChanges.includes('none') ? [] : ['none'];
        } else {
          const withoutNone = prev.stChanges.filter((c) => c !== 'none');
          newChanges = withoutNone.includes(change)
            ? withoutNone.filter((c) => c !== change)
            : [...withoutNone, change];
        }
        const updated = { ...prev, stChanges: newChanges };
        autoSave(updated);
        return updated;
      });
    },
    [autoSave]
  );

  const getQTcInterpretation = useCallback(
    (qtcVal: number | null): { label: string; color: string } => {
      if (!qtcVal) return { label: '', color: '' };
      if (qtcVal < 440)
        return { label: t('specialties.cardiology.ecg.qtcNormal'), color: 'bg-green-100 text-green-800' };
      if (qtcVal < 500)
        return { label: t('specialties.cardiology.ecg.qtcBorderline'), color: 'bg-yellow-100 text-yellow-800' };
      return { label: t('specialties.cardiology.ecg.qtcProlonged'), color: 'bg-red-100 text-red-800' };
    },
    [t]
  );

  const qtcInterp = getQTcInterpretation(qtc);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-5 w-5 text-blue-500" />
          {t('specialties.cardiology.ecg.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rate and Rhythm */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('specialties.cardiology.ecg.rate')}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={300}
                value={data.rate ?? ''}
                onChange={(e) => updateField('rate', e.target.value ? Number(e.target.value) : null)}
                disabled={readOnly}
                placeholder="bpm"
              />
              <span className="text-sm text-muted-foreground">bpm</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('specialties.cardiology.ecg.rhythm')}</Label>
            <Select
              value={data.rhythm}
              onValueChange={(v) => updateField('rhythm', v)}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('specialties.cardiology.ecg.selectRhythm')} />
              </SelectTrigger>
              <SelectContent>
                {RHYTHM_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`specialties.cardiology.ecg.rhythms.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Axis */}
        <div className="space-y-2">
          <Label>{t('specialties.cardiology.ecg.axis')}</Label>
          <Select
            value={data.axis}
            onValueChange={(v) => updateField('axis', v)}
            disabled={readOnly}
          >
            <SelectTrigger className="max-w-[300px]">
              <SelectValue placeholder={t('specialties.cardiology.ecg.selectAxis')} />
            </SelectTrigger>
            <SelectContent>
              {AXIS_OPTIONS.map((a) => (
                <SelectItem key={a} value={a}>
                  {t(`specialties.cardiology.ecg.axes.${a}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Intervals */}
        <div>
          <h4 className="text-sm font-medium mb-3">
            {t('specialties.cardiology.ecg.intervals')}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>{t('specialties.cardiology.ecg.prInterval')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={500}
                  value={data.prInterval ?? ''}
                  onChange={(e) =>
                    updateField('prInterval', e.target.value ? Number(e.target.value) : null)
                  }
                  disabled={readOnly}
                  placeholder="ms"
                />
                <span className="text-xs text-muted-foreground">ms</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('specialties.cardiology.ecg.qrsDuration')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={300}
                  value={data.qrsDuration ?? ''}
                  onChange={(e) =>
                    updateField('qrsDuration', e.target.value ? Number(e.target.value) : null)
                  }
                  disabled={readOnly}
                  placeholder="ms"
                />
                <span className="text-xs text-muted-foreground">ms</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('specialties.cardiology.ecg.qtInterval')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={700}
                  value={data.qtInterval ?? ''}
                  onChange={(e) =>
                    updateField('qtInterval', e.target.value ? Number(e.target.value) : null)
                  }
                  disabled={readOnly}
                  placeholder="ms"
                />
                <span className="text-xs text-muted-foreground">ms</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('specialties.cardiology.ecg.qtcCalculated')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={qtc ? `${qtc} ms` : '--'}
                  disabled
                  className="bg-muted"
                />
                {qtc && qtcInterp.label && (
                  <Badge className={qtcInterp.color}>{qtcInterp.label}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* ST Changes */}
        <div>
          <h4 className="text-sm font-medium mb-3">
            {t('specialties.cardiology.ecg.stChanges')}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ST_CHANGE_OPTIONS.map((sc) => (
              <div key={sc} className="flex items-center gap-2">
                <Checkbox
                  id={`st-${sc}`}
                  checked={data.stChanges.includes(sc)}
                  onCheckedChange={() => toggleSTChange(sc)}
                  disabled={readOnly}
                />
                <Label htmlFor={`st-${sc}`}>
                  {t(`specialties.cardiology.ecg.stOptions.${sc}`)}
                </Label>
              </div>
            ))}
          </div>

          {data.stChanges.length > 0 && !data.stChanges.includes('none') && (
            <div className="mt-3 space-y-2">
              <Label>{t('specialties.cardiology.ecg.affectedLeads')}</Label>
              <Input
                value={data.stChangeLeads}
                onChange={(e) => updateField('stChangeLeads', e.target.value)}
                disabled={readOnly}
                placeholder={t('specialties.cardiology.ecg.affectedLeadsPlaceholder')}
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Interpretation */}
        <div className="space-y-2">
          <Label>{t('specialties.cardiology.ecg.interpretation')}</Label>
          <Textarea
            value={data.interpretation}
            onChange={(e) => updateField('interpretation', e.target.value)}
            disabled={readOnly}
            placeholder={t('specialties.cardiology.ecg.interpretationPlaceholder')}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
