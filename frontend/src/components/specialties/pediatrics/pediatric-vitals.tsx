import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Heart, Thermometer, Wind, Activity, Scale, Calculator } from 'lucide-react';
import { getGrowthDataSet } from './growth-data';

// ===== Types =====

interface PediatricVitalsProps {
  patientId: string;
  patientDob: string;
  consultationId: string;
  patientSex?: string;
  vitals?: {
    heartRate?: number;
    respiratoryRate?: number;
    systolicBP?: number;
    diastolicBP?: number;
    temperature?: number;
    oxygenSaturation?: number;
    weight?: number;
    height?: number;
  };
}

interface VitalRange {
  min: number;
  max: number;
}

interface AgeGroup {
  label: string;
  labelKey: string;
  minMonths: number;
  maxMonths: number;
  heartRate: VitalRange;
  respiratoryRate: VitalRange;
  systolicBP: VitalRange;
}

interface PedMedication {
  nameKey: string;
  dosePerKg: number;
  unit: string;
  frequency: string;
  maxDose?: number;
  frequencyKey: string;
}

// ===== Data =====

const AGE_GROUPS: AgeGroup[] = [
  {
    label: 'Newborn',
    labelKey: 'specialties.pediatrics.vitals.ageGroups.newborn',
    minMonths: 0,
    maxMonths: 1,
    heartRate: { min: 120, max: 160 },
    respiratoryRate: { min: 30, max: 60 },
    systolicBP: { min: 60, max: 80 },
  },
  {
    label: 'Infant',
    labelKey: 'specialties.pediatrics.vitals.ageGroups.infant',
    minMonths: 1,
    maxMonths: 12,
    heartRate: { min: 100, max: 150 },
    respiratoryRate: { min: 25, max: 40 },
    systolicBP: { min: 70, max: 100 },
  },
  {
    label: 'Toddler',
    labelKey: 'specialties.pediatrics.vitals.ageGroups.toddler',
    minMonths: 12,
    maxMonths: 36,
    heartRate: { min: 90, max: 130 },
    respiratoryRate: { min: 20, max: 30 },
    systolicBP: { min: 80, max: 110 },
  },
  {
    label: 'Preschool',
    labelKey: 'specialties.pediatrics.vitals.ageGroups.preschool',
    minMonths: 36,
    maxMonths: 72,
    heartRate: { min: 80, max: 120 },
    respiratoryRate: { min: 18, max: 25 },
    systolicBP: { min: 85, max: 115 },
  },
  {
    label: 'School Age',
    labelKey: 'specialties.pediatrics.vitals.ageGroups.schoolAge',
    minMonths: 72,
    maxMonths: 144,
    heartRate: { min: 70, max: 110 },
    respiratoryRate: { min: 16, max: 22 },
    systolicBP: { min: 90, max: 120 },
  },
  {
    label: 'Adolescent',
    labelKey: 'specialties.pediatrics.vitals.ageGroups.adolescent',
    minMonths: 144,
    maxMonths: 999,
    heartRate: { min: 60, max: 100 },
    respiratoryRate: { min: 12, max: 20 },
    systolicBP: { min: 100, max: 135 },
  },
];

const COMMON_MEDICATIONS: PedMedication[] = [
  {
    nameKey: 'specialties.pediatrics.vitals.meds.paracetamol',
    dosePerKg: 15,
    unit: 'mg',
    frequency: 'q4-6h',
    maxDose: 1000,
    frequencyKey: 'specialties.pediatrics.vitals.meds.q4to6h',
  },
  {
    nameKey: 'specialties.pediatrics.vitals.meds.ibuprofen',
    dosePerKg: 10,
    unit: 'mg',
    frequency: 'q6-8h',
    maxDose: 400,
    frequencyKey: 'specialties.pediatrics.vitals.meds.q6to8h',
  },
  {
    nameKey: 'specialties.pediatrics.vitals.meds.amoxicillin',
    dosePerKg: 25,
    unit: 'mg',
    frequency: 'q8h (standard)',
    maxDose: 500,
    frequencyKey: 'specialties.pediatrics.vitals.meds.q8h',
  },
  {
    nameKey: 'specialties.pediatrics.vitals.meds.amoxicillinHigh',
    dosePerKg: 50,
    unit: 'mg',
    frequency: 'q8h (high dose)',
    maxDose: 1000,
    frequencyKey: 'specialties.pediatrics.vitals.meds.q8hHigh',
  },
  {
    nameKey: 'specialties.pediatrics.vitals.meds.cephalexin',
    dosePerKg: 25,
    unit: 'mg',
    frequency: 'q6h',
    maxDose: 500,
    frequencyKey: 'specialties.pediatrics.vitals.meds.q6h',
  },
  {
    nameKey: 'specialties.pediatrics.vitals.meds.azithromycin',
    dosePerKg: 10,
    unit: 'mg',
    frequency: 'Day 1, then 5mg/kg',
    maxDose: 500,
    frequencyKey: 'specialties.pediatrics.vitals.meds.day1Then5',
  },
];

// ===== Helpers =====

function getAgeInMonths(dob: string): number {
  const dobDate = new Date(dob);
  const now = new Date();
  const years = now.getFullYear() - dobDate.getFullYear();
  const months = now.getMonth() - dobDate.getMonth();
  const days = now.getDate() - dobDate.getDate();
  let total = years * 12 + months;
  if (days < 0) total -= 1;
  return Math.max(total, 0);
}

function getAgeGroup(ageMonths: number): AgeGroup {
  for (const ag of AGE_GROUPS) {
    if (ageMonths >= ag.minMonths && ageMonths < ag.maxMonths) return ag;
  }
  return AGE_GROUPS[AGE_GROUPS.length - 1];
}

function getVitalStatus(
  value: number | undefined,
  range: VitalRange,
): 'normal' | 'low' | 'high' | 'unknown' {
  if (value == null) return 'unknown';
  if (value < range.min) return 'low';
  if (value > range.max) return 'high';
  return 'normal';
}

function getApproxPercentile(
  weight: number,
  ageMonths: number,
  sex: 'male' | 'female',
): string {
  const ds = getGrowthDataSet('weight', sex);
  // Find closest age point
  let closest = ds.data[0];
  let minDiff = Infinity;
  for (const pt of ds.data) {
    const diff = Math.abs(pt.ageMonths - ageMonths);
    if (diff < minDiff) {
      minDiff = diff;
      closest = pt;
    }
  }

  if (weight <= closest.p3) return '< 3rd';
  if (weight <= closest.p10) return '3rd - 10th';
  if (weight <= closest.p25) return '10th - 25th';
  if (weight <= closest.p50) return '25th - 50th';
  if (weight <= closest.p75) return '50th - 75th';
  if (weight <= closest.p90) return '75th - 90th';
  if (weight <= closest.p97) return '90th - 97th';
  return '> 97th';
}

// ===== Component =====

export function PediatricVitals({
  patientId,
  patientDob,
  consultationId,
  patientSex,
  vitals,
}: PediatricVitalsProps) {
  const { t } = useTranslation();
  const [dosingWeight, setDosingWeight] = useState(vitals?.weight?.toString() ?? '');

  const ageMonths = useMemo(() => getAgeInMonths(patientDob), [patientDob]);
  const ageGroup = useMemo(() => getAgeGroup(ageMonths), [ageMonths]);
  const sex = (patientSex?.toLowerCase() === 'female' ? 'female' : 'male') as 'male' | 'female';

  const weightPercentile = useMemo(() => {
    if (vitals?.weight && ageMonths <= 60) {
      return getApproxPercentile(vitals.weight, ageMonths, sex);
    }
    return null;
  }, [vitals?.weight, ageMonths, sex]);

  const dosingWeightNum = parseFloat(dosingWeight);

  // Build vital card data
  const vitalCards = useMemo(() => {
    const hrStatus = getVitalStatus(vitals?.heartRate, ageGroup.heartRate);
    const rrStatus = getVitalStatus(vitals?.respiratoryRate, ageGroup.respiratoryRate);
    const bpStatus = getVitalStatus(vitals?.systolicBP, ageGroup.systolicBP);

    return [
      {
        icon: Heart,
        labelKey: 'specialties.pediatrics.vitals.heartRate',
        value: vitals?.heartRate,
        unit: t('consultations.vitalsForm.bpm'),
        range: ageGroup.heartRate,
        status: hrStatus,
      },
      {
        icon: Wind,
        labelKey: 'specialties.pediatrics.vitals.respiratoryRate',
        value: vitals?.respiratoryRate,
        unit: t('consultations.vitalsForm.breathsPerMin'),
        range: ageGroup.respiratoryRate,
        status: rrStatus,
      },
      {
        icon: Activity,
        labelKey: 'specialties.pediatrics.vitals.systolicBP',
        value: vitals?.systolicBP,
        unit: t('consultations.vitalsForm.mmHg'),
        range: ageGroup.systolicBP,
        status: bpStatus,
      },
    ];
  }, [vitals, ageGroup, t]);

  const statusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'text-green-600';
      case 'low':
        return 'text-blue-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 text-green-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Age group and reference */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              {t('specialties.pediatrics.vitals.title')}
            </span>
            <Badge variant="outline">
              {t(ageGroup.labelKey)} ({ageMonths} {t('specialties.pediatrics.vitals.months')})
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Vitals grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {vitalCards.map((vc) => {
              const Icon = vc.icon;
              return (
                <div
                  key={vc.labelKey}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <Icon className="h-4 w-4" />
                      {t(vc.labelKey)}
                    </span>
                    {vc.value != null && vc.status !== 'unknown' && (
                      <Badge className={statusBadgeVariant(vc.status)}>
                        {t(`specialties.pediatrics.vitals.statusLabels.${vc.status}`)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-bold ${statusColor(vc.status)}`}>
                      {vc.value ?? '--'}
                    </span>
                    <span className="text-sm text-muted-foreground">{vc.unit}</span>
                  </div>
                  {/* Range bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{vc.range.min}</span>
                      <span>
                        {t('specialties.pediatrics.vitals.normalRange')}
                      </span>
                      <span>{vc.range.max}</span>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-green-400 rounded-full"
                        style={{
                          left: '10%',
                          right: '10%',
                        }}
                      />
                      {vc.value != null && (
                        <div
                          className={`absolute top-0 w-2 h-2 rounded-full border border-white ${
                            vc.status === 'normal'
                              ? 'bg-green-600'
                              : vc.status === 'high'
                                ? 'bg-red-600'
                                : 'bg-blue-600'
                          }`}
                          style={{
                            left: `${Math.min(
                              Math.max(
                                ((vc.value - vc.range.min + (vc.range.max - vc.range.min) * 0.2) /
                                  ((vc.range.max - vc.range.min) * 1.4)) *
                                  100,
                                0,
                              ),
                              100,
                            )}%`,
                            transform: 'translateX(-50%)',
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional vitals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {vitals?.temperature != null && (
              <div className="border rounded-lg p-2">
                <div className="text-muted-foreground text-xs">
                  {t('specialties.pediatrics.vitals.temperature')}
                </div>
                <div className="font-semibold">
                  {vitals.temperature} {t('consultations.vitalsForm.celsius')}
                </div>
              </div>
            )}
            {vitals?.oxygenSaturation != null && (
              <div className="border rounded-lg p-2">
                <div className="text-muted-foreground text-xs">
                  {t('specialties.pediatrics.vitals.oxygenSat')}
                </div>
                <div className="font-semibold">{vitals.oxygenSaturation}%</div>
              </div>
            )}
            {vitals?.weight != null && (
              <div className="border rounded-lg p-2">
                <div className="text-muted-foreground text-xs">
                  {t('specialties.pediatrics.vitals.weight')}
                </div>
                <div className="font-semibold">
                  {vitals.weight} {t('consultations.vitalsForm.kg')}
                </div>
                {weightPercentile && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {t('specialties.pediatrics.vitals.percentile')}: {weightPercentile}
                  </div>
                )}
              </div>
            )}
            {vitals?.height != null && (
              <div className="border rounded-lg p-2">
                <div className="text-muted-foreground text-xs">
                  {t('specialties.pediatrics.vitals.height')}
                </div>
                <div className="font-semibold">
                  {vitals.height} {t('consultations.vitalsForm.cm')}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weight-based Dosing Calculator */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-5 w-5" />
            {t('specialties.pediatrics.vitals.dosingCalculator')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <Label className="whitespace-nowrap">
              <Scale className="h-4 w-4 inline mr-1" />
              {t('specialties.pediatrics.vitals.weightForDosing')}
            </Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              className="w-32"
              value={dosingWeight}
              onChange={(e) => setDosingWeight(e.target.value)}
              placeholder="kg"
            />
            <span className="text-sm text-muted-foreground">
              {t('consultations.vitalsForm.kg')}
            </span>
          </div>

          {!isNaN(dosingWeightNum) && dosingWeightNum > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">
                      {t('specialties.pediatrics.vitals.medication')}
                    </th>
                    <th className="text-left py-2 pr-4 font-medium">
                      {t('specialties.pediatrics.vitals.dosePerKg')}
                    </th>
                    <th className="text-left py-2 pr-4 font-medium">
                      {t('specialties.pediatrics.vitals.calculatedDose')}
                    </th>
                    <th className="text-left py-2 font-medium">
                      {t('specialties.pediatrics.vitals.frequency')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMMON_MEDICATIONS.map((med) => {
                    const rawDose = dosingWeightNum * med.dosePerKg;
                    const dose = med.maxDose
                      ? Math.min(rawDose, med.maxDose)
                      : rawDose;
                    const capped = med.maxDose && rawDose > med.maxDose;

                    return (
                      <tr key={med.nameKey} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{t(med.nameKey)}</td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {med.dosePerKg} {med.unit}/kg
                        </td>
                        <td className="py-2 pr-4">
                          <span className="font-semibold">
                            {dose.toFixed(1)} {med.unit}
                          </span>
                          {capped && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {t('specialties.pediatrics.vitals.maxDoseCapped')}
                            </Badge>
                          )}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {t(med.frequencyKey)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('specialties.pediatrics.vitals.enterWeight')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
