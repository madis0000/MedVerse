import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

export interface VisualAcuityData {
  od: { uncorrected: string; corrected: string; pinhole?: string };
  os: { uncorrected: string; corrected: string; pinhole?: string };
  method: string;
  nearVisionOD?: string;
  nearVisionOS?: string;
  notes?: string;
}

interface VisualAcuityProps {
  consultationId: string;
  readOnly?: boolean;
  existingData?: VisualAcuityData;
}

const SNELLEN_OPTIONS = [
  '20/20', '20/25', '20/30', '20/40', '20/50', '20/60',
  '20/70', '20/80', '20/100', '20/200', '20/400',
  'CF', 'HM', 'LP', 'NLP',
] as const;

const NEAR_VISION_OPTIONS = [
  'J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'J7',
  'N5', 'N6', 'N8', 'N10', 'N12', 'N14', 'N18', 'N24', 'N36', 'N48',
] as const;

const METHOD_OPTIONS = [
  'snellen', 'logMAR', 'countingFingers', 'handMotion', 'lightPerception', 'nlp',
] as const;

const DEFAULT_DATA: VisualAcuityData = {
  od: { uncorrected: '', corrected: '' },
  os: { uncorrected: '', corrected: '' },
  method: 'snellen',
  notes: '',
};

function getVAColorClass(va: string): string {
  if (!va) return '';
  const goodVA = ['20/20', '20/25', '20/30'];
  const mildVA = ['20/40', '20/50', '20/60', '20/70'];
  const moderateVA = ['20/80', '20/100', '20/200'];
  if (goodVA.includes(va)) return 'border-green-500 bg-green-50 dark:bg-green-950';
  if (mildVA.includes(va)) return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950';
  if (moderateVA.includes(va)) return 'border-orange-500 bg-orange-50 dark:bg-orange-950';
  return 'border-red-500 bg-red-50 dark:bg-red-950';
}

function getVABadgeVariant(va: string): string {
  if (!va) return '';
  const goodVA = ['20/20', '20/25', '20/30'];
  const mildVA = ['20/40', '20/50', '20/60', '20/70'];
  const moderateVA = ['20/80', '20/100', '20/200'];
  if (goodVA.includes(va)) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (mildVA.includes(va)) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  if (moderateVA.includes(va)) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
}

export function VisualAcuity({
  consultationId,
  readOnly = false,
  existingData,
}: VisualAcuityProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<VisualAcuityData>(existingData || DEFAULT_DATA);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const autoSave = useCallback(
    (updatedData: VisualAcuityData) => {
      if (readOnly) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        try {
          await apiClient.patch(`/consultations/${consultationId}`, {
            customFields: {
              ophthalmology: {
                visualAcuity: updatedData,
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

  const updateData = useCallback(
    (updater: (prev: VisualAcuityData) => VisualAcuityData) => {
      setData((prev) => {
        const updated = updater(prev);
        autoSave(updated);
        return updated;
      });
    },
    [autoSave]
  );

  const renderEyeVASelect = (
    eye: 'od' | 'os',
    field: 'uncorrected' | 'corrected' | 'pinhole',
    labelKey: string
  ) => {
    const value = data[eye][field as keyof typeof data.od] || '';
    return (
      <div className="space-y-1.5">
        <Label className="text-sm">{t(labelKey)}</Label>
        <Select
          value={value}
          onValueChange={(v) =>
            updateData((prev) => ({
              ...prev,
              [eye]: { ...prev[eye], [field]: v },
            }))
          }
          disabled={readOnly}
        >
          <SelectTrigger className={value ? getVAColorClass(value) : ''}>
            <SelectValue placeholder={t('specialties.ophthalmology.visualAcuity.selectVA')} />
          </SelectTrigger>
          <SelectContent>
            {SNELLEN_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {value && (
          <Badge className={getVABadgeVariant(value)}>{value}</Badge>
        )}
      </div>
    );
  };

  const renderNearVisionSelect = (eye: 'od' | 'os', labelKey: string) => {
    const field = eye === 'od' ? 'nearVisionOD' : 'nearVisionOS';
    const value = data[field] || '';
    return (
      <div className="space-y-1.5">
        <Label className="text-sm">{t(labelKey)}</Label>
        <Select
          value={value}
          onValueChange={(v) =>
            updateData((prev) => ({ ...prev, [field]: v }))
          }
          disabled={readOnly}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('specialties.ophthalmology.visualAcuity.selectNearVA')} />
          </SelectTrigger>
          <SelectContent>
            {NEAR_VISION_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Eye className="h-5 w-5 text-blue-500" />
          {t('specialties.ophthalmology.visualAcuity.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Method selector */}
        <div className="space-y-2 max-w-[300px]">
          <Label>{t('specialties.ophthalmology.visualAcuity.method')}</Label>
          <Select
            value={data.method}
            onValueChange={(v) => updateData((prev) => ({ ...prev, method: v }))}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METHOD_OPTIONS.map((m) => (
                <SelectItem key={m} value={m}>
                  {t(`specialties.ophthalmology.visualAcuity.methods.${m}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Two-column layout: OD | OS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* OD (Right Eye) */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400">
              {t('specialties.ophthalmology.od')} — {t('specialties.ophthalmology.rightEye')}
            </h4>
            <div className="space-y-3 rounded-lg border p-4">
              {renderEyeVASelect('od', 'uncorrected', 'specialties.ophthalmology.visualAcuity.uncorrected')}
              {renderEyeVASelect('od', 'corrected', 'specialties.ophthalmology.visualAcuity.corrected')}
              {renderEyeVASelect('od', 'pinhole', 'specialties.ophthalmology.visualAcuity.pinhole')}
              {renderNearVisionSelect('od', 'specialties.ophthalmology.visualAcuity.nearVision')}
            </div>
          </div>

          {/* OS (Left Eye) */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-green-700 dark:text-green-400">
              {t('specialties.ophthalmology.os')} — {t('specialties.ophthalmology.leftEye')}
            </h4>
            <div className="space-y-3 rounded-lg border p-4">
              {renderEyeVASelect('os', 'uncorrected', 'specialties.ophthalmology.visualAcuity.uncorrected')}
              {renderEyeVASelect('os', 'corrected', 'specialties.ophthalmology.visualAcuity.corrected')}
              {renderEyeVASelect('os', 'pinhole', 'specialties.ophthalmology.visualAcuity.pinhole')}
              {renderNearVisionSelect('os', 'specialties.ophthalmology.visualAcuity.nearVision')}
            </div>
          </div>
        </div>

        <Separator />

        {/* Notes */}
        <div className="space-y-2">
          <Label>{t('common.notes')}</Label>
          <Textarea
            value={data.notes || ''}
            onChange={(e) => updateData((prev) => ({ ...prev, notes: e.target.value }))}
            disabled={readOnly}
            placeholder={t('specialties.ophthalmology.visualAcuity.notesPlaceholder')}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
