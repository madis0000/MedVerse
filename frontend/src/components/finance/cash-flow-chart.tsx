import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CashFlowData {
  month: string;
  inflows: number;
  outflows: number;
  net: number;
}

interface CashFlowChartProps {
  data: CashFlowData[];
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const { t } = useTranslation();

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('finance.cashFlow.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">{t('finance.cashFlow.noData')}</p>
        </CardContent>
      </Card>
    );
  }

  const maxVal = Math.max(...data.flatMap(d => [d.inflows, d.outflows]), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('finance.cashFlow.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.month} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.month}</span>
                <span className={item.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {t('finance.cashFlow.net')}: ${item.net.toLocaleString()}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16">{t('finance.cashFlow.inflow')}</span>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${(item.inflows / maxVal) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs w-20 text-right">${item.inflows.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16">{t('finance.cashFlow.outflow')}</span>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${(item.outflows / maxVal) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs w-20 text-right">${item.outflows.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">{t('finance.cashFlow.inflows')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">{t('finance.cashFlow.outflows')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
