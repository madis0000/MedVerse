import { useState } from 'react';
import {
  FileBarChart, Download, AlertTriangle,
} from 'lucide-react';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TableSkeleton } from '@/components/ui/loading-skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  useProfitLossReport, useAccountsReceivable, useCashFlowReport,
  useWriteOffs, useCreateWriteOff,
} from '@/api/finance';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function FinanceReportsPage() {
  const now = new Date();
  const [startDate, setStartDate] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);
  const [writeOffDialog, setWriteOffDialog] = useState(false);
  const [writeOffForm, setWriteOffForm] = useState({
    invoiceId: '', amount: 0, reason: 'BAD_DEBT' as string, description: '',
  });

  const params = { startDate, endDate };
  const { data: pl, isLoading: plLoading } = useProfitLossReport(params);
  const { data: ar } = useAccountsReceivable();
  const { data: cashFlow } = useCashFlowReport(params);
  const { data: writeOffsData } = useWriteOffs(params);
  const createWriteOff = useCreateWriteOff();

  const handleWriteOff = async () => {
    try {
      await createWriteOff.mutateAsync(writeOffForm);
      setWriteOffDialog(false);
      setWriteOffForm({ invoiceId: '', amount: 0, reason: 'BAD_DEBT', description: '' });
      toast.success('Write-off recorded');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create write-off');
    }
  };

  // Quick date range presets
  const setPreset = (preset: string) => {
    const today = new Date();
    let s = new Date();
    switch (preset) {
      case 'today': s = today; break;
      case 'week': s = new Date(today); s.setDate(s.getDate() - 7); break;
      case 'month': s = new Date(today.getFullYear(), today.getMonth(), 1); break;
      case 'lastMonth':
        s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        today.setDate(0); break;
      case 'quarter': s = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1); break;
      case 'year': s = new Date(today.getFullYear(), 0, 1); break;
    }
    setStartDate(s.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  return (
    <PageWrapper title="Financial Reports">
      <div className="space-y-6">
        {/* Date range */}
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label>Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-auto" />
          </div>
          <div>
            <Label>End Date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-auto" />
          </div>
          <div className="flex gap-1">
            {['month', 'lastMonth', 'quarter', 'year'].map((p) => (
              <Button key={p} variant="outline" size="sm" onClick={() => setPreset(p)}>
                {p === 'lastMonth' ? 'Last Month' : p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <Tabs defaultValue="pl">
          <TabsList>
            <TabsTrigger value="pl">Profit & Loss</TabsTrigger>
            <TabsTrigger value="ar">AR Aging</TabsTrigger>
            <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            <TabsTrigger value="writeoffs">Write-Offs</TabsTrigger>
          </TabsList>

          <TabsContent value="pl">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profit & Loss Statement</CardTitle>
              </CardHeader>
              <CardContent>
                {plLoading ? (
                  <TableSkeleton rows={6} />
                ) : !pl ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No data</p>
                ) : (
                  <div className="space-y-6">
                    {/* Revenue */}
                    <div>
                      <h3 className="font-semibold text-green-700 dark:text-green-400 mb-2">Revenue</h3>
                      <div className="space-y-1">
                        {pl.revenue.items.map((item: any) => (
                          <div key={item.category} className="flex justify-between text-sm py-1 border-b border-dashed">
                            <span className="text-muted-foreground">{item.category}</span>
                            <span>{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-bold pt-2 border-t-2 text-green-700 dark:text-green-400">
                          <span>Total Revenue</span>
                          <span>{formatCurrency(pl.revenue.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Expenses */}
                    <div>
                      <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">Expenses</h3>
                      <div className="space-y-1">
                        {pl.expenses.items.map((item: any) => (
                          <div key={item.category} className="flex justify-between text-sm py-1 border-b border-dashed">
                            <span className="text-muted-foreground">{item.category}</span>
                            <span>{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-bold pt-2 border-t-2 text-red-700 dark:text-red-400">
                          <span>Total Expenses</span>
                          <span>{formatCurrency(pl.expenses.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Net */}
                    <div className={cn('p-4 rounded-lg', pl.netIncome >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20')}>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">Net Income</span>
                        <div className="text-right">
                          <p className={cn('text-2xl font-bold', pl.netIncome >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400')}>
                            {formatCurrency(pl.netIncome)}
                          </p>
                          <p className="text-sm text-muted-foreground">{pl.profitMargin}% margin</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ar">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Accounts Receivable Aging</CardTitle>
              </CardHeader>
              <CardContent>
                {!ar ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No data</p>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Outstanding</p>
                      <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                        {formatCurrency(ar.totalOutstanding)}
                      </p>
                    </div>

                    {/* Aging buckets */}
                    <div className="space-y-4">
                      {ar.buckets.map((bucket: any, i: number) => {
                        const maxBucket = Math.max(...ar.buckets.map((b: any) => b.total), 1);
                        const barColors = ['bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-400', 'bg-red-600'];
                        return (
                          <div key={bucket.label}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="font-medium">{bucket.label}</span>
                              <span>{formatCurrency(bucket.total)} ({bucket.count} invoices)</span>
                            </div>
                            <div className="h-4 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn('h-full rounded-full', barColors[i])}
                                style={{ width: `${(bucket.total / maxBucket) * 100}%` }}
                              />
                            </div>
                            {/* Invoice details */}
                            {bucket.invoices.length > 0 && (
                              <div className="mt-2 ml-4 space-y-1">
                                {bucket.invoices.slice(0, 5).map((inv: any) => (
                                  <div key={inv.id} className="flex items-center justify-between text-xs">
                                    <span>{inv.invoiceNumber} - {inv.patient?.firstName} {inv.patient?.lastName}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{formatCurrency(inv.outstanding)}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs"
                                        onClick={() => {
                                          setWriteOffForm({
                                            invoiceId: inv.id,
                                            amount: inv.outstanding,
                                            reason: 'BAD_DEBT',
                                            description: '',
                                          });
                                          setWriteOffDialog(true);
                                        }}
                                      >
                                        Write Off
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cashflow">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cash Flow Statement</CardTitle>
              </CardHeader>
              <CardContent>
                {!cashFlow ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No data</p>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold">Operating Activities</h3>
                      <div className="flex justify-between text-sm py-2 border-b">
                        <span>Cash received from patients</span>
                        <span className="text-green-600 font-medium">{formatCurrency(cashFlow.operating.cashFromPatients)}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2 border-b">
                        <span>Cash paid to suppliers/expenses</span>
                        <span className="text-red-600 font-medium">({formatCurrency(cashFlow.operating.cashToSuppliers)})</span>
                      </div>
                      <div className="flex justify-between font-bold pt-2 border-t-2">
                        <span>Net Operating Cash Flow</span>
                        <span className={cashFlow.operating.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(cashFlow.operating.net)}
                        </span>
                      </div>
                    </div>

                    <div className={cn('p-4 rounded-lg', cashFlow.closingBalance >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20')}>
                      <div className="flex justify-between items-center">
                        <span className="font-bold">Net Cash Position</span>
                        <span className={cn('text-xl font-bold', cashFlow.closingBalance >= 0 ? 'text-green-700' : 'text-red-700')}>
                          {formatCurrency(cashFlow.closingBalance)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="writeoffs">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Write-Offs</CardTitle>
                {writeOffsData && (
                  <Badge variant="outline">
                    Total: {formatCurrency(writeOffsData.totalWrittenOff || 0)}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                {!writeOffsData?.data?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No write-offs recorded</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium">Date</th>
                          <th className="text-left py-2 font-medium">Invoice</th>
                          <th className="text-left py-2 font-medium">Patient</th>
                          <th className="text-left py-2 font-medium">Reason</th>
                          <th className="text-right py-2 font-medium">Amount</th>
                          <th className="text-left py-2 font-medium">Approved By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {writeOffsData.data.map((w: any) => (
                          <tr key={w.id} className="border-b last:border-0">
                            <td className="py-2">{formatDate(w.createdAt)}</td>
                            <td className="py-2">{w.invoice?.invoiceNumber}</td>
                            <td className="py-2">{w.invoice?.patient?.firstName} {w.invoice?.patient?.lastName}</td>
                            <td className="py-2">
                              <Badge variant="outline" className="text-xs">{w.reason.replace(/_/g, ' ')}</Badge>
                            </td>
                            <td className="py-2 text-right font-medium text-red-600">{formatCurrency(w.amount)}</td>
                            <td className="py-2">{w.approvedBy?.firstName} {w.approvedBy?.lastName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Write-off Dialog */}
        <Dialog open={writeOffDialog} onOpenChange={setWriteOffDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Write-Off</DialogTitle>
              <DialogDescription>Write off an unpaid balance from an invoice</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={writeOffForm.amount}
                  onChange={(e) => setWriteOffForm({ ...writeOffForm, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Reason</Label>
                <Select value={writeOffForm.reason} onValueChange={(v) => setWriteOffForm({ ...writeOffForm, reason: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BAD_DEBT">Bad Debt</SelectItem>
                    <SelectItem value="CHARITY_CARE">Charity Care</SelectItem>
                    <SelectItem value="INSURANCE_ADJUSTMENT">Insurance Adjustment</SelectItem>
                    <SelectItem value="ADMINISTRATIVE">Administrative</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={writeOffForm.description}
                  onChange={(e) => setWriteOffForm({ ...writeOffForm, description: e.target.value })}
                  placeholder="Optional description..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setWriteOffDialog(false)}>Cancel</Button>
              <Button onClick={handleWriteOff} disabled={createWriteOff.isPending} variant="destructive">
                {createWriteOff.isPending ? 'Processing...' : 'Confirm Write-Off'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageWrapper>
  );
}
