import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TrendDataPoint {
  date: string;
  value: number;
}

interface ResultTrendChartProps {
  title?: string;
  data: TrendDataPoint[];
  normalRangeMin?: number;
  normalRangeMax?: number;
  unit?: string;
}

export function ResultTrendChart({
  title = 'Result Trend',
  data,
  normalRangeMin,
  normalRangeMax,
  unit,
}: ResultTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No trend data available
          </p>
        </CardContent>
      </Card>
    );
  }

  const values = data.map((d) => d.value);
  const allValues = [...values];
  if (normalRangeMin !== undefined) allValues.push(normalRangeMin);
  if (normalRangeMax !== undefined) allValues.push(normalRangeMax);

  const minY = Math.floor(Math.min(...allValues) * 0.9);
  const maxY = Math.ceil(Math.max(...allValues) * 1.1);

  const formattedData = data.map((d) => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {title}
          {unit && (
            <span className="text-sm font-normal text-muted-foreground ml-2">({unit})</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={formattedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis
              domain={[minY, maxY]}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(val: number) => [
                `${val}${unit ? ` ${unit}` : ''}`,
                'Value',
              ]}
            />

            {normalRangeMin !== undefined && normalRangeMax !== undefined && (
              <ReferenceArea
                y1={normalRangeMin}
                y2={normalRangeMax}
                fill="hsl(var(--primary))"
                fillOpacity={0.08}
                stroke="none"
              />
            )}

            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4, fill: 'hsl(var(--primary))' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>

        {(normalRangeMin !== undefined || normalRangeMax !== undefined) && (
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground justify-center">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-primary/10 border border-primary/20" />
              <span>
                Normal range: {normalRangeMin ?? '---'} - {normalRangeMax ?? '---'}
                {unit ? ` ${unit}` : ''}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
