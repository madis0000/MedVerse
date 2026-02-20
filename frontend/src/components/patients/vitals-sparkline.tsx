import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

interface VitalsSparklineProps {
  data: { date: string; value: number }[];
  color?: string;
  height?: number;
  unit?: string;
}

export function VitalsSparkline({ data, color = '#3b82f6', height = 40, unit }: VitalsSparklineProps) {
  if (!data || data.length < 2) return null;

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: color }}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '11px',
              padding: '4px 8px',
            }}
            formatter={(value: number) => [`${value}${unit ? ` ${unit}` : ''}`, '']}
            labelFormatter={(label: string) => new Date(label).toLocaleDateString()}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
