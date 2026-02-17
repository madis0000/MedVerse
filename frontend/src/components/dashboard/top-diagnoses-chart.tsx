import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DiagnosisDataPoint {
  name: string;
  count: number;
}

const fallbackData: DiagnosisDataPoint[] = [
  { name: 'Hypertension', count: 142 },
  { name: 'Type 2 Diabetes', count: 98 },
  { name: 'Upper Resp. Infection', count: 87 },
  { name: 'Low Back Pain', count: 76 },
  { name: 'Anxiety Disorder', count: 65 },
  { name: 'Hyperlipidemia', count: 58 },
  { name: 'Allergic Rhinitis', count: 52 },
  { name: 'Migraine', count: 44 },
];

export function TopDiagnosesChart() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'top-diagnoses'],
    queryFn: async () => {
      const { data } = await apiClient.get('/dashboard/top-diagnoses');
      return data;
    },
  });

  const chartData: DiagnosisDataPoint[] = data?.data || fallbackData;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{t('dashboard.topDiagnoses')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[280px] flex items-center justify-center">
            <div className="h-full w-full bg-muted/50 rounded animate-pulse" />
          </div>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={120}
                  className="text-muted-foreground"
                />
                <Tooltip
                  formatter={(value: number) => [value, t('dashboard.topDiagnoses')]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
