import { useState } from 'react';
import {
  Calendar, Clock, CreditCard, Banknote, Building2,
  Shield, CheckCircle, AlertCircle, Plus,
} from 'lucide-react';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/loading-skeleton';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useDailySummary, useCloseDay, useDailyHistory } from '@/api/finance';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const statusStyles: Record<string, string> = {
  OPEN: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CLOSED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  RECONCILED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

export function FinanceDailyPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closingForm, setClosingForm] = useState({
    actualCash: 0, actualCard: 0, actualInsurance: 0, actualBankTransfer: 0, notes: '',
  });

  const { data: daily, isLoading } = useDailySummary(selectedDate);
  const { data: history } = useDailyHistory();
  const closeDay = useCloseDay();

  const handleCloseDay = async () => {
    try {
      await closeDay.mutateAsync({ date: selectedDate, ...closingForm });
      setCloseDialogOpen(false);
      toast.success('Day closed successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to close day');
    }
  };

  if (isLoading) {
    return (
      <PageWrapper title="Daily Operations">
        <TableSkeleton rows={6} />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Daily Operations">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-4">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <Badge className={cn(statusStyles[daily?.status || 'OPEN'])}>
            {daily?.status || 'OPEN'}
          </Badge>
          {daily?.status === 'OPEN' && (
            <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setClosingForm({
                    actualCash: daily?.totals?.cash || 0,
                    actualCard: daily?.totals?.card || 0,
                    actualInsurance: daily?.totals?.insurance || 0,
                    actualBankTransfer: daily?.totals?.bankTransfer || 0,
                    notes: '',
                  });
                }}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Close Day
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Close Day - {selectedDate}</DialogTitle>
                  <DialogDescription>Enter actual amounts collected for reconciliation</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Expected Cash</Label>
                      <p className="text-sm font-medium">{formatCurrency(daily?.totals?.cash || 0)}</p>
                    </div>
                    <div>
                      <Label>Actual Cash</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={closingForm.actualCash}
                        onChange={(e) => setClosingForm({ ...closingForm, actualCash: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Expected Card</Label>
                      <p className="text-sm font-medium">{formatCurrency(daily?.totals?.card || 0)}</p>
                    </div>
                    <div>
                      <Label>Actual Card</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={closingForm.actualCard}
                        onChange={(e) => setClosingForm({ ...closingForm, actualCard: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Expected Insurance</Label>
                      <p className="text-sm font-medium">{formatCurrency(daily?.totals?.insurance || 0)}</p>
                    </div>
                    <div>
                      <Label>Actual Insurance</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={closingForm.actualInsurance}
                        onChange={(e) => setClosingForm({ ...closingForm, actualInsurance: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Expected Transfer</Label>
                      <p className="text-sm font-medium">{formatCurrency(daily?.totals?.bankTransfer || 0)}</p>
                    </div>
                    <div>
                      <Label>Actual Transfer</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={closingForm.actualBankTransfer}
                        onChange={(e) => setClosingForm({ ...closingForm, actualBankTransfer: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={closingForm.notes}
                      onChange={(e) => setClosingForm({ ...closingForm, notes: e.target.value })}
                      placeholder="Optional closing notes..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCloseDay} disabled={closeDay.isPending}>
                    {closeDay.isPending ? 'Closing...' : 'Confirm Close'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Cash</p>
                <Banknote className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold mt-2">{formatCurrency(daily?.totals?.cash || 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Card</p>
                <CreditCard className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold mt-2">{formatCurrency(daily?.totals?.card || 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Insurance</p>
                <Shield className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold mt-2">{formatCurrency(daily?.totals?.insurance || 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Bank Transfer</p>
                <Building2 className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-2xl font-bold mt-2">{formatCurrency(daily?.totals?.bankTransfer || 0)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Payments and Consultations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payments ({daily?.counts?.payments || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {!daily?.payments?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">No payments recorded</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {daily.payments.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{p.invoice?.patient?.firstName} {p.invoice?.patient?.lastName}</p>
                        <p className="text-xs text-muted-foreground">{p.invoice?.invoiceNumber} - {p.method}</p>
                      </div>
                      <p className="text-sm font-bold">{formatCurrency(p.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Consultations ({daily?.counts?.consultations || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {!daily?.consultations?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">No consultations today</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {daily.consultations.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{c.patient?.firstName} {c.patient?.lastName}</p>
                        <p className="text-xs text-muted-foreground">Dr. {c.doctor?.firstName} {c.doctor?.lastName}</p>
                      </div>
                      <Badge variant="outline">{c.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Daily closing history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Closing History</CardTitle>
          </CardHeader>
          <CardContent>
            {!history?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">No closing history</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Date</th>
                      <th className="text-left py-2 font-medium">Status</th>
                      <th className="text-right py-2 font-medium">Total</th>
                      <th className="text-right py-2 font-medium">Variance</th>
                      <th className="text-left py-2 font-medium">Closed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h: any) => (
                      <tr key={h.id} className="border-b last:border-0">
                        <td className="py-2">{formatDate(h.date)}</td>
                        <td className="py-2">
                          <Badge className={cn('text-xs', statusStyles[h.status])}>{h.status}</Badge>
                        </td>
                        <td className="py-2 text-right">
                          {formatCurrency(h.actualCash + h.actualCard + h.actualInsurance + h.actualBankTransfer)}
                        </td>
                        <td className={cn('py-2 text-right', (h.varianceTotal || 0) < 0 ? 'text-red-600' : 'text-green-600')}>
                          {formatCurrency(h.varianceTotal || 0)}
                        </td>
                        <td className="py-2">
                          {h.closedBy ? `${h.closedBy.firstName} ${h.closedBy.lastName}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
