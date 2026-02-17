import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, CalendarDays, Plus, FileBarChart, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function QuickActionsPanel() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const actions = [
    { labelKey: 'finance.quickActions.dataEntry', icon: CalendarDays, path: '/finance/data-entry', variant: 'default' as const },
    { labelKey: 'finance.quickActions.closeToday', icon: CalendarCheck, path: '/finance/daily', variant: 'outline' as const },
    { labelKey: 'finance.quickActions.recordExpense', icon: Plus, path: '/finance/expenses', variant: 'outline' as const },
    { labelKey: 'finance.quickActions.viewPL', icon: FileBarChart, path: '/finance/reports', variant: 'outline' as const },
    { labelKey: 'finance.quickActions.revenueDrilldown', icon: BarChart3, path: '/finance/revenue', variant: 'outline' as const },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{t('finance.quickActions.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <Button
              key={action.labelKey}
              variant={action.variant}
              className="h-auto py-3 flex flex-col items-center gap-1"
              onClick={() => navigate(action.path)}
            >
              <action.icon className="w-4 h-4" />
              <span className="text-xs">{t(action.labelKey)}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
