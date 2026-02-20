import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import apiClient from '@/lib/api-client';

interface CardiacTrendsProps {
  patientId: string;
}

interface VitalRecord {
  date: string;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
}

interface LipidRecord {
  date: string;
  ldl?: number;
  hdl?: number;
  totalCholesterol?: number;
  triglycerides?: number;
}

interface EFRecord {
  date: string;
  ef: number;
}

export function CardiacTrends({ patientId }: CardiacTrendsProps) {
  const { t } = useTranslation();
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [lipids, setLipids] = useState<LipidRecord[]>([]);
  const [efData, setEFData] = useState<EFRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch vitals from patient consultations
      const params: Record<string, string> = {};
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      const [vitalsRes, consultationsRes] = await Promise.all([
        apiClient
          .get(`/patients/${patientId}/vitals`, { params })
          .catch(() => ({ data: [] })),
        apiClient
          .get(`/consultations`, { params: { patientId, ...params } })
          .catch(() => ({ data: { data: [] } })),
      ]);

      // Process vitals
      const vitalsData: VitalRecord[] = Array.isArray(vitalsRes.data)
        ? vitalsRes.data.map((v: Record<string, unknown>) => ({
            date: formatDate(v.date as string || v.createdAt as string),
            systolic: v.systolic as number | undefined,
            diastolic: v.diastolic as number | undefined,
            heartRate: v.heartRate as number | undefined,
          }))
        : [];
      setVitals(vitalsData);

      // Process consultations for lipid and EF data from customFields
      const consultations = Array.isArray(consultationsRes.data)
        ? consultationsRes.data
        : consultationsRes.data?.data || [];

      const lipidData: LipidRecord[] = [];
      const efRecords: EFRecord[] = [];

      for (const consult of consultations) {
        const cardio = consult.customFields?.cardiology;
        if (!cardio) continue;

        const dateStr = formatDate(consult.date || consult.createdAt);

        if (cardio.lipids) {
          lipidData.push({
            date: dateStr,
            ldl: cardio.lipids.ldl,
            hdl: cardio.lipids.hdl,
            totalCholesterol: cardio.lipids.totalCholesterol,
            triglycerides: cardio.lipids.triglycerides,
          });
        }

        if (cardio.echo?.ef) {
          efRecords.push({
            date: dateStr,
            ef: cardio.echo.ef,
          });
        }
      }

      setLipids(lipidData);
      setEFData(efRecords);
    } catch {
      // Silently handle errors - charts will show empty state
    } finally {
      setLoading(false);
    }
  }, [patientId, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  }

  const EmptyChart = () => (
    <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
      {t('specialties.cardiology.trends.noData')}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          {t('specialties.cardiology.trends.title')}
        </h3>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm">{t('common.from')}</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[150px] h-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">{t('common.to')}</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[150px] h-9"
            />
          </div>
        </div>
      </div>

      {/* BP Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {t('specialties.cardiology.trends.bpTrend')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vitals.length > 0 && vitals.some((v) => v.systolic || v.diastolic) ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={vitals}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis domain={[40, 200]} fontSize={12} />
                <Tooltip />
                <Legend />
                <ReferenceLine
                  y={140}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{ value: '140', position: 'right', fontSize: 10 }}
                />
                <ReferenceLine
                  y={120}
                  stroke="#22c55e"
                  strokeDasharray="3 3"
                  label={{ value: '120', position: 'right', fontSize: 10 }}
                />
                <ReferenceLine
                  y={90}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{ value: '90', position: 'right', fontSize: 10 }}
                />
                <ReferenceLine
                  y={80}
                  stroke="#22c55e"
                  strokeDasharray="3 3"
                  label={{ value: '80', position: 'right', fontSize: 10 }}
                />
                <Line
                  type="monotone"
                  dataKey="systolic"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name={t('specialties.cardiology.trends.systolic')}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="diastolic"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name={t('specialties.cardiology.trends.diastolic')}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </CardContent>
      </Card>

      {/* HR Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {t('specialties.cardiology.trends.hrTrend')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vitals.length > 0 && vitals.some((v) => v.heartRate) ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={vitals}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis domain={[40, 150]} fontSize={12} />
                <Tooltip />
                <Legend />
                <ReferenceLine
                  y={100}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{ value: '100', position: 'right', fontSize: 10 }}
                />
                <ReferenceLine
                  y={60}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label={{ value: '60', position: 'right', fontSize: 10 }}
                />
                <Line
                  type="monotone"
                  dataKey="heartRate"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name={t('specialties.cardiology.trends.heartRate')}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </CardContent>
      </Card>

      {/* Lipid Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {t('specialties.cardiology.trends.lipidPanel')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lipids.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={lipids}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ldl"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name={t('specialties.cardiology.trends.ldl')}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="hdl"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name={t('specialties.cardiology.trends.hdl')}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="totalCholesterol"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name={t('specialties.cardiology.trends.totalCholesterol')}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="triglycerides"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name={t('specialties.cardiology.trends.triglycerides')}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </CardContent>
      </Card>

      {/* EF% Progression */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {t('specialties.cardiology.trends.efProgression')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {efData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={efData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis domain={[0, 80]} fontSize={12} />
                <Tooltip />
                <Legend />
                <ReferenceLine
                  y={55}
                  stroke="#22c55e"
                  strokeDasharray="3 3"
                  label={{ value: '55%', position: 'right', fontSize: 10 }}
                />
                <Line
                  type="monotone"
                  dataKey="ef"
                  stroke="#ec4899"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name={t('specialties.cardiology.trends.ejectionFraction')}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
