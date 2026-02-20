import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Line,
  ComposedChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Plus } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { getGrowthDataSet, type GrowthDataSet, type GrowthPoint } from './growth-data';

interface GrowthChartProps {
  patientId: string;
  patientDob: string;
  patientSex: string;
  consultationId?: string;
  readOnly?: boolean;
}

interface PatientMeasurement {
  ageMonths: number;
  value: number;
  date: string;
}

type ChartType = 'weight' | 'height' | 'headCircumference' | 'bmi';

export function GrowthChart({
  patientId,
  patientDob,
  patientSex,
  consultationId,
  readOnly,
}: GrowthChartProps) {
  const { t } = useTranslation();
  const [chartType, setChartType] = useState<ChartType>('weight');
  const [measurements, setMeasurements] = useState<PatientMeasurement[]>([]);
  const [newAge, setNewAge] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddForm, setShowAddForm] = useState(false);

  const sex = (patientSex?.toLowerCase() === 'female' ? 'female' : 'male') as 'male' | 'female';

  const dataSet: GrowthDataSet = useMemo(
    () => getGrowthDataSet(chartType, sex),
    [chartType, sex],
  );

  // Load measurements from consultations
  useEffect(() => {
    const loadMeasurements = async () => {
      try {
        const { data } = await apiClient.get(`/consultations`, {
          params: { patientId, limit: 100 },
        });
        const consultations = data.data ?? data ?? [];
        const allMeasurements: PatientMeasurement[] = [];
        for (const c of consultations) {
          const growthData = c.customFields?.pediatrics?.growthMeasurements;
          if (Array.isArray(growthData)) {
            for (const m of growthData) {
              if (m.type === chartType && m.value != null) {
                allMeasurements.push({
                  ageMonths: m.ageMonths,
                  value: m.value,
                  date: m.date ?? c.createdAt,
                });
              }
            }
          }
        }
        allMeasurements.sort((a, b) => a.ageMonths - b.ageMonths);
        setMeasurements(allMeasurements);
      } catch {
        // silent fail - chart still renders with reference data
      }
    };
    if (patientId) loadMeasurements();
  }, [patientId, chartType]);

  const handleAddMeasurement = useCallback(async () => {
    const ageVal = parseFloat(newAge);
    const valNum = parseFloat(newValue);
    if (isNaN(ageVal) || isNaN(valNum) || !consultationId) return;

    const newEntry: PatientMeasurement = {
      ageMonths: ageVal,
      value: valNum,
      date: newDate,
    };

    try {
      // Fetch current consultation to get existing customFields
      const { data: consultation } = await apiClient.get(`/consultations/${consultationId}`);
      const existing = consultation.customFields?.pediatrics?.growthMeasurements ?? [];
      const updated = [
        ...existing,
        { type: chartType, ageMonths: ageVal, value: valNum, date: newDate },
      ];

      await apiClient.patch(`/consultations/${consultationId}`, {
        customFields: {
          ...consultation.customFields,
          pediatrics: {
            ...consultation.customFields?.pediatrics,
            growthMeasurements: updated,
          },
        },
      });

      setMeasurements((prev) =>
        [...prev, newEntry].sort((a, b) => a.ageMonths - b.ageMonths),
      );
      setNewAge('');
      setNewValue('');
      setShowAddForm(false);
      toast.success(t('specialties.pediatrics.growth.measurementSaved'));
    } catch {
      toast.error(t('specialties.pediatrics.growth.saveFailed'));
    }
  }, [newAge, newValue, newDate, chartType, consultationId, t]);

  // Merge percentile data with patient measurements for the chart
  const chartData = useMemo(() => {
    const referenceMap = new Map<number, GrowthPoint>();
    for (const pt of dataSet.data) {
      referenceMap.set(pt.ageMonths, pt);
    }

    // Merge in patient measurements at specific ages
    const measurementMap = new Map<number, number>();
    for (const m of measurements) {
      measurementMap.set(m.ageMonths, m.value);
    }

    const allAges = new Set<number>();
    dataSet.data.forEach((d) => allAges.add(d.ageMonths));
    measurements.forEach((m) => allAges.add(m.ageMonths));

    return Array.from(allAges)
      .sort((a, b) => a - b)
      .map((age) => {
        const ref = referenceMap.get(age);
        return {
          ageMonths: age,
          p3: ref?.p3 ?? undefined,
          p10: ref?.p10 ?? undefined,
          p25: ref?.p25 ?? undefined,
          p50: ref?.p50 ?? undefined,
          p75: ref?.p75 ?? undefined,
          p90: ref?.p90 ?? undefined,
          p97: ref?.p97 ?? undefined,
          patient: measurementMap.get(age) ?? undefined,
        };
      });
  }, [dataSet, measurements]);

  const chartTypeOptions: { value: ChartType; labelKey: string }[] = [
    { value: 'weight', labelKey: 'specialties.pediatrics.growth.weight' },
    { value: 'height', labelKey: 'specialties.pediatrics.growth.height' },
    { value: 'headCircumference', labelKey: 'specialties.pediatrics.growth.headCircumference' },
    { value: 'bmi', labelKey: 'specialties.pediatrics.growth.bmi' },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t('specialties.pediatrics.growth.title')}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select
            value={chartType}
            onValueChange={(v) => setChartType(v as ChartType)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {chartTypeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline">
            {sex === 'male'
              ? t('specialties.pediatrics.growth.boys')
              : t('specialties.pediatrics.growth.girls')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="ageMonths"
                label={{
                  value: t('specialties.pediatrics.growth.ageMonths'),
                  position: 'insideBottom',
                  offset: -5,
                }}
                tickFormatter={(v) => `${v}`}
              />
              <YAxis
                label={{
                  value: `${dataSet.unit}`,
                  angle: -90,
                  position: 'insideLeft',
                }}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    p3: 'P3',
                    p10: 'P10',
                    p25: 'P25',
                    p50: 'P50',
                    p75: 'P75',
                    p90: 'P90',
                    p97: 'P97',
                    patient: t('specialties.pediatrics.growth.patient'),
                  };
                  return [`${value} ${dataSet.unit}`, labels[name] ?? name];
                }}
                labelFormatter={(v) =>
                  `${t('specialties.pediatrics.growth.ageMonths')}: ${v}`
                }
              />
              <Legend />

              {/* p3-p10 band (light red) */}
              <Area
                type="monotone"
                dataKey="p3"
                stackId="percentiles"
                stroke="none"
                fill="transparent"
                name="P3"
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="p10"
                stroke="#fca5a5"
                strokeWidth={1}
                fill="#fecaca"
                fillOpacity={0.3}
                name="P10"
                connectNulls
              />
              {/* p10-p25 band (light yellow) */}
              <Area
                type="monotone"
                dataKey="p25"
                stroke="#fcd34d"
                strokeWidth={1}
                fill="#fef3c7"
                fillOpacity={0.3}
                name="P25"
                connectNulls
              />
              {/* p25-p75 band (light green) */}
              <Area
                type="monotone"
                dataKey="p75"
                stroke="#86efac"
                strokeWidth={1}
                fill="#dcfce7"
                fillOpacity={0.4}
                name="P75"
                connectNulls
              />
              {/* p75-p90 band (light yellow) */}
              <Area
                type="monotone"
                dataKey="p90"
                stroke="#fcd34d"
                strokeWidth={1}
                fill="#fef3c7"
                fillOpacity={0.3}
                name="P90"
                connectNulls
              />
              {/* p90-p97 band (light red) */}
              <Area
                type="monotone"
                dataKey="p97"
                stroke="#fca5a5"
                strokeWidth={1}
                fill="#fecaca"
                fillOpacity={0.3}
                name="P97"
                connectNulls
              />

              {/* p50 reference line */}
              <ReferenceLine stroke="#22c55e" strokeDasharray="5 5" />
              <Line
                type="monotone"
                dataKey="p50"
                stroke="#16a34a"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                name="P50"
                connectNulls
              />

              {/* Patient measurements overlaid */}
              <Line
                type="monotone"
                dataKey="patient"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 5, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                name={t('specialties.pediatrics.growth.patient')}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend description */}
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-red-200" />
            P3-P10 / P90-P97
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-yellow-100" />
            P10-P25 / P75-P90
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-green-100" />
            P25-P75
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-1 bg-green-600" />
            P50
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-1 bg-blue-600" style={{ borderRadius: 2 }} />
            {t('specialties.pediatrics.growth.patient')}
          </span>
        </div>

        {/* Measurements table */}
        {measurements.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">
                {t('specialties.pediatrics.growth.measurements')}
              </h4>
              <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground border-b pb-1">
                <span>{t('specialties.pediatrics.growth.ageMonths')}</span>
                <span>
                  {t('specialties.pediatrics.growth.value')} ({dataSet.unit})
                </span>
                <span>{t('common.date')}</span>
              </div>
              {measurements.map((m, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 text-sm">
                  <span>{m.ageMonths}</span>
                  <span>
                    {m.value} {dataSet.unit}
                  </span>
                  <span>{m.date}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Add measurement form */}
        {!readOnly && consultationId && (
          <>
            <Separator className="my-4" />
            {showAddForm ? (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">
                  {t('specialties.pediatrics.growth.addMeasurement')}
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>{t('specialties.pediatrics.growth.ageMonths')}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="60"
                      step="0.5"
                      value={newAge}
                      onChange={(e) => setNewAge(e.target.value)}
                      placeholder="0-60"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>
                      {t('specialties.pediatrics.growth.value')} ({dataSet.unit})
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{t('common.date')}</Label>
                    <Input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddMeasurement}>
                    {t('common.save')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('specialties.pediatrics.growth.addMeasurement')}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
