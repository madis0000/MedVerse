import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#2563EB', '#0D9488', '#D97706', '#DC2626', '#7C3AED'];

interface PatientDemographicsChartProps {
  data?: { name: string; value: number }[];
}

export function PatientDemographicsChart({ data }: PatientDemographicsChartProps) {
  const defaultData = [
    { name: 'Male', value: 0 },
    { name: 'Female', value: 0 },
    { name: 'Other', value: 0 },
  ];

  const chartData = data || defaultData;

  return (
    <div className="bg-card border rounded-lg p-6">
      <h3 className="font-medium mb-4">Patient Demographics</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
