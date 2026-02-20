import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Copy, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

export interface FundusEyeExam {
  opticDisc: string;
  cupToDiscRatio: string;
  neuroretinalRim: string;
  vessels: string;
  macula: string;
  periphery: string;
  vitreous: string;
  notes?: string;
}

export interface FundusData {
  od: FundusEyeExam;
  os: FundusEyeExam;
  method: string;
  notes?: string;
}

interface FundusExamProps {
  consultationId: string;
  readOnly?: boolean;
  existingData?: FundusData;
}

const METHOD_OPTIONS = ['direct', 'indirect', 'slitLampWithLens', 'oct'] as const;

const FIELD_OPTIONS: Record<keyof Omit<FundusEyeExam, 'notes' | 'cupToDiscRatio'>, string[]> = {
  opticDisc: ['normal', 'pale', 'edematous', 'cupped', 'tilted', 'drusen'],
  neuroretinalRim: ['intact', 'thinning', 'notching', 'pallor'],
  vessels: ['normal', 'avNicking', 'tortuous', 'neovascularization', 'attenuated'],
  macula: ['normal', 'drusen', 'edema', 'hole', 'erm', 'atrophy'],
  periphery: ['normal', 'latticeDegeneration', 'holesTears', 'detachment', 'hemorrhage'],
  vitreous: ['clear', 'cells', 'hemorrhage', 'detachment', 'floaters'],
};

const NORMAL_VALUES: Record<string, string[]> = {
  opticDisc: ['normal'],
  neuroretinalRim: ['intact'],
  vessels: ['normal'],
  macula: ['normal'],
  periphery: ['normal'],
  vitreous: ['clear'],
};

const CD_RATIO_OPTIONS = [
  '0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9',
] as const;

const DEFAULT_EYE: FundusEyeExam = {
  opticDisc: '',
  cupToDiscRatio: '',
  neuroretinalRim: '',
  vessels: '',
  macula: '',
  periphery: '',
  vitreous: '',
};

const DEFAULT_DATA: FundusData = {
  od: { ...DEFAULT_EYE },
  os: { ...DEFAULT_EYE },
  method: 'direct',
  notes: '',
};

/** Simple SVG visualization of cup-to-disc ratio */
function CDRatioVisual({ ratio, label }: { ratio: string; label: string }) {
  if (!ratio) return null;
  const cdValue = parseFloat(ratio);
  if (isNaN(cdValue) || cdValue <= 0 || cdValue > 1) return null;

  const outerRadius = 32;
  const innerRadius = outerRadius * cdValue;
  const isGlaucomaSuspect = cdValue >= 0.6;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={80} height={80} viewBox="0 0 80 80">
        {/* Outer disc (neuroretinal rim) */}
        <circle
          cx={40}
          cy={40}
          r={outerRadius}
          fill="#fde68a"
          stroke={isGlaucomaSuspect ? '#ef4444' : '#f59e0b'}
          strokeWidth={2}
        />
        {/* Inner cup */}
        <circle
          cx={40}
          cy={40}
          r={innerRadius}
          fill="white"
          stroke="#d1d5db"
          strokeWidth={1}
        />
        {/* Label */}
        <text
          x={40}
          y={42}
          textAnchor="middle"
          fontSize={10}
          fontWeight="bold"
          fill={isGlaucomaSuspect ? '#ef4444' : '#374151'}
        >
          {ratio}
        </text>
      </svg>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function FundusExam({
  consultationId,
  readOnly = false,
  existingData,
}: FundusExamProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<FundusData>(existingData || DEFAULT_DATA);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const autoSave = useCallback(
    (updatedData: FundusData) => {
      if (readOnly) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        try {
          await apiClient.patch(`/consultations/${consultationId}`, {
            customFields: {
              ophthalmology: {
                fundus: updatedData,
              },
            },
          });
        } catch {
          toast.error(t('specialties.ophthalmology.saveFailed'));
        }
      }, 1500);
    },
    [consultationId, readOnly, t]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const updateEyeField = useCallback(
    (eye: 'od' | 'os', field: keyof FundusEyeExam, value: string) => {
      setData((prev) => {
        const updated = {
          ...prev,
          [eye]: { ...prev[eye], [field]: value },
        };
        autoSave(updated);
        return updated;
      });
    },
    [autoSave]
  );

  const updateField = useCallback(
    <K extends keyof FundusData>(field: K, value: FundusData[K]) => {
      setData((prev) => {
        const updated = { ...prev, [field]: value };
        autoSave(updated);
        return updated;
      });
    },
    [autoSave]
  );

  const copyODtoOS = useCallback(() => {
    setData((prev) => {
      const updated = {
        ...prev,
        os: { ...prev.od },
      };
      autoSave(updated);
      return updated;
    });
    toast.success(t('specialties.ophthalmology.copiedODtoOS'));
  }, [autoSave, t]);

  const isGlaucomaSuspect = (cdr: string): boolean => {
    if (!cdr) return false;
    return parseFloat(cdr) >= 0.6;
  };

  const renderField = (
    eye: 'od' | 'os',
    field: keyof Omit<FundusEyeExam, 'notes' | 'cupToDiscRatio'>,
  ) => {
    const options = FIELD_OPTIONS[field];
    const value = data[eye][field];
    const isAbnormal = value && NORMAL_VALUES[field] && !NORMAL_VALUES[field].includes(value);

    return (
      <div className="space-y-1.5" key={`${eye}-${field}`}>
        <Label className="text-sm">
          {t(`specialties.ophthalmology.fundus.fields.${field}`)}
        </Label>
        <Select
          value={value}
          onValueChange={(v) => updateEyeField(eye, field, v)}
          disabled={readOnly}
        >
          <SelectTrigger className={isAbnormal ? 'border-orange-400' : ''}>
            <SelectValue
              placeholder={t('specialties.ophthalmology.fundus.select')}
            />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {t(`specialties.ophthalmology.fundus.options.${field}.${opt}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const fields = Object.keys(FIELD_OPTIONS) as (keyof Omit<FundusEyeExam, 'notes' | 'cupToDiscRatio'>)[];

  const renderEyeSection = (eye: 'od' | 'os') => {
    const isOD = eye === 'od';
    const cdr = data[eye].cupToDiscRatio;
    const glaucomaSuspect = isGlaucomaSuspect(cdr);

    return (
      <div className="space-y-4">
        <h4 className={`text-sm font-semibold ${isOD ? 'text-blue-700 dark:text-blue-400' : 'text-green-700 dark:text-green-400'}`}>
          {t(`specialties.ophthalmology.${eye}`)} — {t(`specialties.ophthalmology.${isOD ? 'rightEye' : 'leftEye'}`)}
        </h4>
        <div className="space-y-3 rounded-lg border p-4">
          {/* Optic Disc */}
          {renderField(eye, 'opticDisc')}

          {/* C/D Ratio with visualization */}
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-1.5">
              {t('specialties.ophthalmology.fundus.fields.cupToDiscRatio')}
              {glaucomaSuspect && (
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-[10px]">
                  <AlertTriangle className="h-3 w-3 mr-0.5" />
                  {t('specialties.ophthalmology.fundus.glaucomaSuspect')}
                </Badge>
              )}
            </Label>
            <div className="flex items-start gap-4">
              <Select
                value={cdr}
                onValueChange={(v) => updateEyeField(eye, 'cupToDiscRatio', v)}
                disabled={readOnly}
              >
                <SelectTrigger className={`max-w-[120px] ${glaucomaSuspect ? 'border-red-400' : ''}`}>
                  <SelectValue
                    placeholder={t('specialties.ophthalmology.fundus.selectCDR')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {CD_RATIO_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <CDRatioVisual
                ratio={cdr}
                label={`C/D ${isOD ? 'OD' : 'OS'}`}
              />
            </div>
          </div>

          {/* Remaining fields */}
          {fields.filter((f) => f !== 'opticDisc').map((field) => renderField(eye, field))}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-amber-500" />
            {t('specialties.ophthalmology.fundus.title')}
          </CardTitle>
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={copyODtoOS}>
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              {t('specialties.ophthalmology.copyODtoOS')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Method */}
        <div className="space-y-2 max-w-[300px]">
          <Label>{t('specialties.ophthalmology.fundus.method')}</Label>
          <Select
            value={data.method}
            onValueChange={(v) => updateField('method', v)}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METHOD_OPTIONS.map((m) => (
                <SelectItem key={m} value={m}>
                  {t(`specialties.ophthalmology.fundus.methods.${m}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Two-column layout: OD | OS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderEyeSection('od')}
          {renderEyeSection('os')}
        </div>

        <Separator />

        {/* Notes */}
        <div className="space-y-2">
          <Label>{t('common.notes')}</Label>
          <Textarea
            value={data.notes || ''}
            onChange={(e) => updateField('notes', e.target.value)}
            disabled={readOnly}
            placeholder={t('specialties.ophthalmology.fundus.notesPlaceholder')}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
