import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ScanEye, Copy } from 'lucide-react';
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

export interface EyeAnteriorExam {
  lids: string;
  conjunctiva: string;
  cornea: string;
  anteriorChamber: string;
  iris: string;
  pupil: string;
  lens: string;
  notes?: string;
}

export interface AnteriorSegmentData {
  od: EyeAnteriorExam;
  os: EyeAnteriorExam;
  notes?: string;
}

interface AnteriorSegmentProps {
  consultationId: string;
  readOnly?: boolean;
  existingData?: AnteriorSegmentData;
}

const FIELD_OPTIONS: Record<keyof Omit<EyeAnteriorExam, 'notes'>, string[]> = {
  lids: ['normal', 'ptosis', 'entropion', 'ectropion', 'chalazion', 'hordeolum', 'swelling'],
  conjunctiva: ['clearWhite', 'injected', 'chemotic', 'subconjHemorrhage', 'papillae', 'follicles'],
  cornea: ['clear', 'edema', 'opacity', 'ulcer', 'abrasion', 'keraticPrecipitates', 'bandKeratopathy', 'arcus'],
  anteriorChamber: ['deepQuiet', 'shallow', 'cells', 'flare', 'hyphema', 'hypopyon'],
  iris: ['normal', 'atrophic', 'neovascularization', 'synechiae', 'heterochromia'],
  pupil: ['roundReactive', 'irregular', 'fixedDilated', 'marcusGunn'],
  lens: ['clear', 'nuclearSclerosis', 'corticalCataract', 'psc', 'iol', 'aphakic', 'subluxated'],
};

const NORMAL_VALUES: Record<string, string[]> = {
  lids: ['normal'],
  conjunctiva: ['clearWhite'],
  cornea: ['clear'],
  anteriorChamber: ['deepQuiet'],
  iris: ['normal'],
  pupil: ['roundReactive'],
  lens: ['clear'],
};

const DEFAULT_EYE: EyeAnteriorExam = {
  lids: '',
  conjunctiva: '',
  cornea: '',
  anteriorChamber: '',
  iris: '',
  pupil: '',
  lens: '',
};

const DEFAULT_DATA: AnteriorSegmentData = {
  od: { ...DEFAULT_EYE },
  os: { ...DEFAULT_EYE },
  notes: '',
};

export function AnteriorSegment({
  consultationId,
  readOnly = false,
  existingData,
}: AnteriorSegmentProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<AnteriorSegmentData>(existingData || DEFAULT_DATA);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const autoSave = useCallback(
    (updatedData: AnteriorSegmentData) => {
      if (readOnly) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        try {
          await apiClient.patch(`/consultations/${consultationId}`, {
            customFields: {
              ophthalmology: {
                anteriorSegment: updatedData,
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
    (eye: 'od' | 'os', field: keyof EyeAnteriorExam, value: string) => {
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

  const getAbnormalFindings = (eye: EyeAnteriorExam): string[] => {
    const abnormal: string[] = [];
    for (const [field, value] of Object.entries(eye)) {
      if (field === 'notes' || !value) continue;
      const normals = NORMAL_VALUES[field];
      if (normals && !normals.includes(value)) {
        abnormal.push(field);
      }
    }
    return abnormal;
  };

  const odAbnormal = getAbnormalFindings(data.od);
  const osAbnormal = getAbnormalFindings(data.os);

  const renderField = (
    eye: 'od' | 'os',
    field: keyof Omit<EyeAnteriorExam, 'notes'>,
  ) => {
    const options = FIELD_OPTIONS[field];
    const value = data[eye][field];
    const isAbnormal = value && NORMAL_VALUES[field] && !NORMAL_VALUES[field].includes(value);

    return (
      <div className="space-y-1.5" key={`${eye}-${field}`}>
        <Label className="text-sm">
          {t(`specialties.ophthalmology.anteriorSegment.fields.${field}`)}
        </Label>
        <Select
          value={value}
          onValueChange={(v) => updateEyeField(eye, field, v)}
          disabled={readOnly}
        >
          <SelectTrigger className={isAbnormal ? 'border-orange-400' : ''}>
            <SelectValue
              placeholder={t('specialties.ophthalmology.anteriorSegment.select')}
            />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {t(`specialties.ophthalmology.anteriorSegment.options.${field}.${opt}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const fields = Object.keys(FIELD_OPTIONS) as (keyof Omit<EyeAnteriorExam, 'notes'>)[];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ScanEye className="h-5 w-5 text-teal-500" />
            {t('specialties.ophthalmology.anteriorSegment.title')}
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
        {/* Abnormal findings summary */}
        {(odAbnormal.length > 0 || osAbnormal.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {odAbnormal.map((f) => (
              <Badge key={`od-${f}`} variant="outline" className="border-orange-400 text-orange-700 dark:text-orange-300">
                OD: {t(`specialties.ophthalmology.anteriorSegment.fields.${f}`)} - {t(`specialties.ophthalmology.anteriorSegment.options.${f}.${data.od[f as keyof EyeAnteriorExam]}`)}
              </Badge>
            ))}
            {osAbnormal.map((f) => (
              <Badge key={`os-${f}`} variant="outline" className="border-orange-400 text-orange-700 dark:text-orange-300">
                OS: {t(`specialties.ophthalmology.anteriorSegment.fields.${f}`)} - {t(`specialties.ophthalmology.anteriorSegment.options.${f}.${data.os[f as keyof EyeAnteriorExam]}`)}
              </Badge>
            ))}
          </div>
        )}

        {/* Two-column layout: OD | OS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* OD (Right Eye) */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400">
              {t('specialties.ophthalmology.od')} — {t('specialties.ophthalmology.rightEye')}
            </h4>
            <div className="space-y-3 rounded-lg border p-4">
              {fields.map((field) => renderField('od', field))}
            </div>
          </div>

          {/* OS (Left Eye) */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-green-700 dark:text-green-400">
              {t('specialties.ophthalmology.os')} — {t('specialties.ophthalmology.leftEye')}
            </h4>
            <div className="space-y-3 rounded-lg border p-4">
              {fields.map((field) => renderField('os', field))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Notes */}
        <div className="space-y-2">
          <Label>{t('common.notes')}</Label>
          <Textarea
            value={data.notes || ''}
            onChange={(e) => {
              const updated = { ...data, notes: e.target.value };
              setData(updated);
              autoSave(updated);
            }}
            disabled={readOnly}
            placeholder={t('specialties.ophthalmology.anteriorSegment.notesPlaceholder')}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
