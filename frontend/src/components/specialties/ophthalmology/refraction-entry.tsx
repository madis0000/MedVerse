import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Glasses, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

export interface RefractionEye {
  sphere: number | null;
  cylinder: number | null;
  axis: number | null;
  add?: number | null;
  prism?: number | null;
  prismBase?: string;
}

export interface RefractionData {
  od: RefractionEye;
  os: RefractionEye;
  pd: number | null;
  type: string;
  notes?: string;
}

interface RefractionEntryProps {
  consultationId: string;
  readOnly?: boolean;
  existingData?: RefractionData;
}

const TYPE_OPTIONS = [
  'manifest',
  'cycloplegic',
  'autoRefraction',
  'overRefraction',
] as const;

const PRISM_BASE_OPTIONS = ['up', 'down', 'in', 'out'] as const;

const DEFAULT_EYE: RefractionEye = {
  sphere: null,
  cylinder: null,
  axis: null,
  add: null,
  prism: null,
  prismBase: '',
};

const DEFAULT_DATA: RefractionData = {
  od: { ...DEFAULT_EYE },
  os: { ...DEFAULT_EYE },
  pd: null,
  type: 'manifest',
  notes: '',
};

function formatDiopter(val: number | null): string {
  if (val === null) return '';
  return val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
}

export function RefractionEntry({
  consultationId,
  readOnly = false,
  existingData,
}: RefractionEntryProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<RefractionData>(existingData || DEFAULT_DATA);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate spherical equivalent: SE = Sphere + (Cylinder / 2)
  const seOD = useMemo(() => {
    if (data.od.sphere === null || data.od.cylinder === null) return null;
    return data.od.sphere + data.od.cylinder / 2;
  }, [data.od.sphere, data.od.cylinder]);

  const seOS = useMemo(() => {
    if (data.os.sphere === null || data.os.cylinder === null) return null;
    return data.os.sphere + data.os.cylinder / 2;
  }, [data.os.sphere, data.os.cylinder]);

  const autoSave = useCallback(
    (updatedData: RefractionData) => {
      if (readOnly) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        try {
          await apiClient.patch(`/consultations/${consultationId}`, {
            customFields: {
              ophthalmology: {
                refraction: updatedData,
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
    (eye: 'od' | 'os', field: keyof RefractionEye, value: number | string | null) => {
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
    <K extends keyof RefractionData>(field: K, value: RefractionData[K]) => {
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

  const renderEyeForm = (eye: 'od' | 'os', se: number | null) => {
    const eyeData = data[eye];
    const isOD = eye === 'od';
    return (
      <div className="space-y-4">
        <h4 className={`text-sm font-semibold ${isOD ? 'text-blue-700 dark:text-blue-400' : 'text-green-700 dark:text-green-400'}`}>
          {t(`specialties.ophthalmology.${eye}`)} — {t(`specialties.ophthalmology.${isOD ? 'rightEye' : 'leftEye'}`)}
        </h4>
        <div className="space-y-3 rounded-lg border p-4">
          {/* Sphere */}
          <div className="space-y-1.5">
            <Label className="text-sm">{t('specialties.ophthalmology.refraction.sphere')}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step={0.25}
                min={-20}
                max={20}
                value={eyeData.sphere ?? ''}
                onChange={(e) =>
                  updateEyeField(eye, 'sphere', e.target.value ? Number(e.target.value) : null)
                }
                disabled={readOnly}
                placeholder="0.00"
                className="max-w-[120px]"
              />
              <span className="text-sm text-muted-foreground">D</span>
              {eyeData.sphere !== null && (
                <span className="text-xs text-muted-foreground">{formatDiopter(eyeData.sphere)}</span>
              )}
            </div>
          </div>

          {/* Cylinder */}
          <div className="space-y-1.5">
            <Label className="text-sm">{t('specialties.ophthalmology.refraction.cylinder')}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step={0.25}
                min={-10}
                max={0}
                value={eyeData.cylinder ?? ''}
                onChange={(e) =>
                  updateEyeField(eye, 'cylinder', e.target.value ? Number(e.target.value) : null)
                }
                disabled={readOnly}
                placeholder="0.00"
                className="max-w-[120px]"
              />
              <span className="text-sm text-muted-foreground">D</span>
            </div>
          </div>

          {/* Axis */}
          <div className="space-y-1.5">
            <Label className="text-sm">{t('specialties.ophthalmology.refraction.axis')}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={180}
                value={eyeData.axis ?? ''}
                onChange={(e) =>
                  updateEyeField(eye, 'axis', e.target.value ? Number(e.target.value) : null)
                }
                disabled={readOnly}
                placeholder="1-180"
                className="max-w-[120px]"
              />
              <span className="text-sm text-muted-foreground">{'\u00B0'}</span>
            </div>
          </div>

          {/* Add (presbyopia) */}
          <div className="space-y-1.5">
            <Label className="text-sm">{t('specialties.ophthalmology.refraction.add')}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step={0.25}
                min={0}
                max={4}
                value={eyeData.add ?? ''}
                onChange={(e) =>
                  updateEyeField(eye, 'add', e.target.value ? Number(e.target.value) : null)
                }
                disabled={readOnly}
                placeholder="0.00"
                className="max-w-[120px]"
              />
              <span className="text-sm text-muted-foreground">D</span>
            </div>
          </div>

          <Separator />

          {/* Prism */}
          <div className="space-y-1.5">
            <Label className="text-sm">{t('specialties.ophthalmology.refraction.prism')}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step={0.5}
                min={0}
                max={40}
                value={eyeData.prism ?? ''}
                onChange={(e) =>
                  updateEyeField(eye, 'prism', e.target.value ? Number(e.target.value) : null)
                }
                disabled={readOnly}
                placeholder="0"
                className="max-w-[100px]"
              />
              <span className="text-xs text-muted-foreground">{'\u0394'}</span>
            </div>
          </div>

          {/* Prism Base */}
          <div className="space-y-1.5">
            <Label className="text-sm">{t('specialties.ophthalmology.refraction.prismBase')}</Label>
            <Select
              value={eyeData.prismBase || ''}
              onValueChange={(v) => updateEyeField(eye, 'prismBase', v)}
              disabled={readOnly}
            >
              <SelectTrigger className="max-w-[160px]">
                <SelectValue placeholder={t('specialties.ophthalmology.refraction.selectBase')} />
              </SelectTrigger>
              <SelectContent>
                {PRISM_BASE_OPTIONS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {t(`specialties.ophthalmology.refraction.bases.${b}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Spherical Equivalent */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              {t('specialties.ophthalmology.refraction.sphericalEquivalent')}
            </Label>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {se !== null ? `${formatDiopter(se)} D` : '--'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Glasses className="h-5 w-5 text-indigo-500" />
            {t('specialties.ophthalmology.refraction.title')}
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
        {/* Type */}
        <div className="space-y-2 max-w-[300px]">
          <Label>{t('specialties.ophthalmology.refraction.type')}</Label>
          <Select
            value={data.type}
            onValueChange={(v) => updateField('type', v)}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {t(`specialties.ophthalmology.refraction.types.${opt}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Two-column layout: OD | OS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderEyeForm('od', seOD)}
          {renderEyeForm('os', seOS)}
        </div>

        <Separator />

        {/* PD */}
        <div className="space-y-2 max-w-[200px]">
          <Label>{t('specialties.ophthalmology.refraction.pd')}</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={50}
              max={80}
              step={0.5}
              value={data.pd ?? ''}
              onChange={(e) =>
                updateField('pd', e.target.value ? Number(e.target.value) : null)
              }
              disabled={readOnly}
              placeholder="mm"
            />
            <span className="text-sm text-muted-foreground">mm</span>
          </div>
        </div>

        <Separator />

        {/* Notes */}
        <div className="space-y-2">
          <Label>{t('common.notes')}</Label>
          <Textarea
            value={data.notes || ''}
            onChange={(e) => updateField('notes', e.target.value)}
            disabled={readOnly}
            placeholder={t('specialties.ophthalmology.refraction.notesPlaceholder')}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
