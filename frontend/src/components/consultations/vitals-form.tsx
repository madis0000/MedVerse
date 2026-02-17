import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Thermometer, Wind, Activity, Scale, Ruler, Droplets, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { VitalSign } from '@/types';

interface VitalsFormProps {
  consultationId: string;
  existingVitals?: VitalSign | null;
  readOnly?: boolean;
  onSaved?: (vitals: VitalSign) => void;
}

interface VitalsData {
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  heartRate: string;
  temperature: string;
  spO2: string;
  weight: string;
  height: string;
  respiratoryRate: string;
  notes: string;
}

const INITIAL_VITALS: VitalsData = {
  bloodPressureSystolic: '',
  bloodPressureDiastolic: '',
  heartRate: '',
  temperature: '',
  spO2: '',
  weight: '',
  height: '',
  respiratoryRate: '',
  notes: '',
};

function calculateBMI(weightKg: number, heightCm: number): number | null {
  if (weightKg <= 0 || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'underweight', color: 'text-yellow-600' };
  if (bmi < 25) return { label: 'normal', color: 'text-green-600' };
  if (bmi < 30) return { label: 'overweight', color: 'text-orange-600' };
  return { label: 'obese', color: 'text-red-600' };
}

export function VitalsForm({
  consultationId,
  existingVitals,
  readOnly,
  onSaved,
}: VitalsFormProps) {
  const { t } = useTranslation();
  const [vitals, setVitals] = useState<VitalsData>(INITIAL_VITALS);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (existingVitals) {
      setVitals({
        bloodPressureSystolic: existingVitals.bloodPressureSystolic?.toString() ?? '',
        bloodPressureDiastolic: existingVitals.bloodPressureDiastolic?.toString() ?? '',
        heartRate: existingVitals.heartRate?.toString() ?? '',
        temperature: existingVitals.temperature?.toString() ?? '',
        spO2: existingVitals.spO2?.toString() ?? '',
        weight: existingVitals.weight?.toString() ?? '',
        height: existingVitals.height?.toString() ?? '',
        respiratoryRate: existingVitals.respiratoryRate?.toString() ?? '',
        notes: existingVitals.notes ?? '',
      });
    }
  }, [existingVitals]);

  const bmi = useMemo(() => {
    const w = parseFloat(vitals.weight);
    const h = parseFloat(vitals.height);
    if (isNaN(w) || isNaN(h)) return null;
    return calculateBMI(w, h);
  }, [vitals.weight, vitals.height]);

  const bmiCategory = useMemo(() => {
    if (bmi === null) return null;
    return getBMICategory(bmi);
  }, [bmi]);

  const handleChange = useCallback(
    (field: keyof VitalsData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setVitals((prev) => ({ ...prev, [field]: e.target.value }));
    },
    [],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const payload: Record<string, unknown> = {};
    if (vitals.bloodPressureSystolic) payload.bloodPressureSystolic = Number(vitals.bloodPressureSystolic);
    if (vitals.bloodPressureDiastolic) payload.bloodPressureDiastolic = Number(vitals.bloodPressureDiastolic);
    if (vitals.heartRate) payload.heartRate = Number(vitals.heartRate);
    if (vitals.temperature) payload.temperature = Number(vitals.temperature);
    if (vitals.spO2) payload.spO2 = Number(vitals.spO2);
    if (vitals.weight) payload.weight = Number(vitals.weight);
    if (vitals.height) payload.height = Number(vitals.height);
    if (vitals.respiratoryRate) payload.respiratoryRate = Number(vitals.respiratoryRate);
    if (bmi !== null) payload.bmi = Math.round(bmi * 10) / 10;
    if (vitals.notes.trim()) payload.notes = vitals.notes.trim();

    try {
      const { data } = await apiClient.post(
        `/consultations/${consultationId}/vitals`,
        payload,
      );
      toast.success(t('consultations.vitalsForm.saveSuccess'));
      onSaved?.(data);
    } catch {
      toast.error(t('consultations.vitalsForm.saveError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          {t('consultations.vitals')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Blood Pressure */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Droplets className="h-3.5 w-3.5 text-red-500" />
              {t('consultations.vitalsForm.bloodPressure')} ({t('consultations.vitalsForm.mmHg')})
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder={t('consultations.vitalsForm.systolic')}
                value={vitals.bloodPressureSystolic}
                onChange={handleChange('bloodPressureSystolic')}
                disabled={readOnly}
                min={0}
                max={300}
              />
              <span className="text-muted-foreground font-medium">/</span>
              <Input
                type="number"
                placeholder={t('consultations.vitalsForm.diastolic')}
                value={vitals.bloodPressureDiastolic}
                onChange={handleChange('bloodPressureDiastolic')}
                disabled={readOnly}
                min={0}
                max={200}
              />
            </div>
          </div>

          {/* Heart Rate */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-red-500" />
              {t('consultations.vitalsForm.heartRate')} ({t('consultations.vitalsForm.bpm')})
            </Label>
            <Input
              type="number"
              placeholder={t('consultations.vitalsForm.heartRate')}
              value={vitals.heartRate}
              onChange={handleChange('heartRate')}
              disabled={readOnly}
              min={0}
              max={300}
            />
          </div>

          {/* Temperature */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Thermometer className="h-3.5 w-3.5 text-orange-500" />
              {t('consultations.vitalsForm.temperature')} ({t('consultations.vitalsForm.celsius')})
            </Label>
            <Input
              type="number"
              step="0.1"
              placeholder={t('consultations.vitalsForm.temperature')}
              value={vitals.temperature}
              onChange={handleChange('temperature')}
              disabled={readOnly}
              min={30}
              max={45}
            />
          </div>

          {/* SpO2 */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Wind className="h-3.5 w-3.5 text-blue-500" />
              {t('consultations.vitalsForm.oxygenSaturation')} (%)
            </Label>
            <Input
              type="number"
              placeholder={t('consultations.vitalsForm.oxygenSaturation')}
              value={vitals.spO2}
              onChange={handleChange('spO2')}
              disabled={readOnly}
              min={0}
              max={100}
            />
          </div>

          {/* Respiratory Rate */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Wind className="h-3.5 w-3.5 text-teal-500" />
              {t('consultations.vitalsForm.respiratoryRate')} ({t('consultations.vitalsForm.breathsPerMin')})
            </Label>
            <Input
              type="number"
              placeholder={t('consultations.vitalsForm.respiratoryRate')}
              value={vitals.respiratoryRate}
              onChange={handleChange('respiratoryRate')}
              disabled={readOnly}
              min={0}
              max={80}
            />
          </div>

          {/* Weight */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5 text-purple-500" />
              {t('consultations.vitalsForm.weight')} ({t('consultations.vitalsForm.kg')})
            </Label>
            <Input
              type="number"
              step="0.1"
              placeholder={t('consultations.vitalsForm.weight')}
              value={vitals.weight}
              onChange={handleChange('weight')}
              disabled={readOnly}
              min={0}
              max={500}
            />
          </div>

          {/* Height */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Ruler className="h-3.5 w-3.5 text-indigo-500" />
              {t('consultations.vitalsForm.height')} ({t('consultations.vitalsForm.cm')})
            </Label>
            <Input
              type="number"
              step="0.1"
              placeholder={t('consultations.vitalsForm.height')}
              value={vitals.height}
              onChange={handleChange('height')}
              disabled={readOnly}
              min={0}
              max={300}
            />
          </div>

          {/* BMI Display */}
          {bmi !== null && (
            <div className="rounded-md border bg-muted/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('consultations.vitalsForm.bmi')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">
                    {bmi.toFixed(1)}
                  </span>
                  {bmiCategory && (
                    <Badge variant="outline" className={cn('text-xs', bmiCategory.color)}>
                      {t(`consultations.vitalsForm.bmiCategory.${bmiCategory.label}`)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>{t('consultations.vitalsForm.notes')}</Label>
            <Textarea
              placeholder={t('consultations.vitalsForm.notesPlaceholder')}
              value={vitals.notes}
              onChange={handleChange('notes')}
              disabled={readOnly}
              rows={2}
            />
          </div>

          {!readOnly && (
            <Button type="submit" className="w-full gap-2" disabled={submitting}>
              <Save className="h-4 w-4" />
              {submitting ? t('consultations.vitalsForm.saving') : t('consultations.vitalsForm.saveVitals')}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
