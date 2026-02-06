import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRevenueData } from '@/api/dashboard';

interface RevenueDataPoint {
  month: string;
  revenue: number;
}

const fallbackData: RevenueDataPoint[] = [
  { month: 'Jan', revenue: 18500 },
  { month: 'Feb', revenue: 22300 },
  { month: 'Mar', revenue: 19800 },
  { month: 'Apr', revenue: 24100 },
  { month: 'May', revenue: 27600 },
  { month: 'Jun', revenue: 23400 },
  { month: 'Jul', revenue: 29100 },
  { month: 'Aug', revenue: 31200 },
  { month: 'Sep', revenue: 28700 },
  { month: 'Oct', revenue: 33400 },
  { month: 'Nov', revenue: 30100 },
  { month: 'Dec', revenue: 35800 },
];

function formatCurrencyShort(value: number) {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value}`;
}

export function RevenueChart() {
  const { data, isLoading } = useRevenueData('monthly');

  const chartData: RevenueDataPoint[] = data?.data || fallbackData;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Revenue Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[280px] flex items-center justify-center">
            <div className="h-full w-full bg-muted/50 rounded animate-pulse" />
          </div>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  tickFormatter={formatCurrencyShort}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <Tooltip
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
