import { useNavigate } from 'react-router-dom';
import { CalendarCheck, CalendarDays, Plus, FileBarChart, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function QuickActionsPanel() {
  const navigate = useNavigate();

  const actions = [
    { label: 'Data Entry', icon: CalendarDays, path: '/finance/data-entry', variant: 'default' as const },
    { label: 'Close Today', icon: CalendarCheck, path: '/finance/daily', variant: 'outline' as const },
    { label: 'Record Expense', icon: Plus, path: '/finance/expenses', variant: 'outline' as const },
    { label: 'View P&L', icon: FileBarChart, path: '/finance/reports', variant: 'outline' as const },
    { label: 'Revenue Drilldown', icon: BarChart3, path: '/finance/revenue', variant: 'outline' as const },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              className="h-auto py-3 flex flex-col items-center gap-1"
              onClick={() => navigate(action.path)}
            >
              <action.icon className="w-4 h-4" />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
