import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAccountsReceivable } from '@/api/finance';
import { formatCurrency } from '@/lib/utils';

export function OutstandingReceivablesCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data } = useAccountsReceivable();

  const overdueInvoices = data?.buckets
    ?.flatMap((b: any) => b.invoices)
    ?.sort((a: any, b: any) => b.outstanding - a.outstanding)
    ?.slice(0, 5) || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{t('finance.receivables.topOverdue')}</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate('/finance/reports')}>
          {t('common.viewAll')} <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        {overdueInvoices.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t('finance.receivables.noOutstanding')}</p>
        ) : (
          <div className="space-y-3">
            {overdueInvoices.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.patient?.firstName} {inv.patient?.lastName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-600">{formatCurrency(inv.outstanding)}</p>
                  <p className="text-xs text-muted-foreground">{t('finance.receivables.daysOverdue', { days: inv.daysOld })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
