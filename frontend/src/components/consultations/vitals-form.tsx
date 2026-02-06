import { useState, useEffect, useMemo, useCallback } from 'react';
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
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-yellow-600' };
  if (bmi < 25) return { label: 'Normal', color: 'text-green-600' };
  if (bmi < 30) return { label: 'Overweight', color: 'text-orange-600' };
  return { label: 'Obese', color: 'text-red-600' };
}

export function VitalsForm({
  consultationId,
  existingVitals,
  readOnly,
  onSaved,
}: VitalsFormProps) {
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
      toast.success('Vitals saved successfully');
      onSaved?.(data);
    } catch {
      toast.error('Failed to save vitals');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Vital Signs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Blood Pressure */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Droplets className="h-3.5 w-3.5 text-red-500" />
              Blood Pressure (mmHg)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Systolic"
                value={vitals.bloodPressureSystolic}
                onChange={handleChange('bloodPressureSystolic')}
                disabled={readOnly}
                min={0}
                max={300}
              />
              <span className="text-muted-foreground font-medium">/</span>
              <Input
                type="number"
                placeholder="Diastolic"
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
              Heart Rate (bpm)
            </Label>
            <Input
              type="number"
              placeholder="Heart rate"
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
              Temperature (C)
            </Label>
            <Input
              type="number"
              step="0.1"
              placeholder="Temperature"
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
              SpO2 (%)
            </Label>
            <Input
              type="number"
              placeholder="Oxygen saturation"
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
              Respiratory Rate (breaths/min)
            </Label>
            <Input
              type="number"
              placeholder="Respiratory rate"
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
              Weight (kg)
            </Label>
            <Input
              type="number"
              step="0.1"
              placeholder="Weight"
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
              Height (cm)
            </Label>
            <Input
              type="number"
              step="0.1"
              placeholder="Height"
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
                <span className="text-sm font-medium">BMI</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">
                    {bmi.toFixed(1)}
                  </span>
                  {bmiCategory && (
                    <Badge variant="outline" className={cn('text-xs', bmiCategory.color)}>
                      {bmiCategory.label}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              placeholder="Additional notes about vitals..."
              value={vitals.notes}
              onChange={handleChange('notes')}
              disabled={readOnly}
              rows={2}
            />
          </div>

          {!readOnly && (
            <Button type="submit" className="w-full gap-2" disabled={submitting}>
              <Save className="h-4 w-4" />
              {submitting ? 'Saving...' : 'Save Vitals'}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
