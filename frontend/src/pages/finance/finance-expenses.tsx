import { useState } from 'react';
import {
  Receipt, Plus, Edit, Trash2, CheckCircle, XCircle,
  RotateCcw, FolderOpen,
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
  useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense,
  useExpenseCategories, useCreateExpenseCategory,
  useRecurringExpenses, useCreateRecurringExpense,
} from '@/api/finance';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const statusStyles: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  PAID: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

export function FinanceExpensesPage() {
  const [expenseDialog, setExpenseDialog] = useState(false);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [recurringDialog, setRecurringDialog] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    categoryId: '', description: '', amount: 0, vendor: '', reference: '',
    expenseDate: new Date().toISOString().split('T')[0], notes: '',
  });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: '', color: '' });
  const [recurringForm, setRecurringForm] = useState({
    categoryId: '', description: '', amount: 0, vendor: '',
    frequency: 'MONTHLY', startDate: new Date().toISOString().split('T')[0],
  });

  const { data: expenseData, isLoading } = useExpenses({});
  const { data: categories } = useExpenseCategories();
  const { data: recurring } = useRecurringExpenses();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const createCategory = useCreateExpenseCategory();
  const createRecurring = useCreateRecurringExpense();

  const handleCreateExpense = async () => {
    try {
      await createExpense.mutateAsync(expenseForm);
      setExpenseDialog(false);
      setExpenseForm({ categoryId: '', description: '', amount: 0, vendor: '', reference: '', expenseDate: new Date().toISOString().split('T')[0], notes: '' });
      toast.success('Expense recorded');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create expense');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await updateExpense.mutateAsync({ id, data: { status: 'APPROVED' } });
      toast.success('Expense approved');
    } catch { toast.error('Failed to approve expense'); }
  };

  const handleReject = async (id: string) => {
    try {
      await updateExpense.mutateAsync({ id, data: { status: 'REJECTED' } });
      toast.success('Expense rejected');
    } catch { toast.error('Failed to reject expense'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense.mutateAsync(id);
      toast.success('Expense deleted');
    } catch { toast.error('Failed to delete expense'); }
  };

  const handleCreateCategory = async () => {
    try {
      await createCategory.mutateAsync(categoryForm);
      setCategoryDialog(false);
      setCategoryForm({ name: '', description: '', icon: '', color: '' });
      toast.success('Category created');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create category');
    }
  };

  const handleCreateRecurring = async () => {
    try {
      await createRecurring.mutateAsync(recurringForm);
      setRecurringDialog(false);
      toast.success('Recurring expense created');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create recurring expense');
    }
  };

  // Compute summary
  const expenses = expenseData?.data || [];
  const monthlyTotal = expenses.reduce((s: number, e: any) => s + e.amount, 0);
  const pendingCount = expenses.filter((e: any) => e.status === 'PENDING').length;
  const recurringMonthly = (recurring || []).filter((r: any) => r.isActive).reduce((s: number, r: any) => s + r.amount, 0);

  if (isLoading) {
    return (
      <PageWrapper title="Expense Management">
        <TableSkeleton rows={6} />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Expense Management">
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Dialog open={expenseDialog} onOpenChange={setExpenseDialog}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Record Expense</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Category</Label>
                  <Select value={expenseForm.categoryId} onValueChange={(v) => setExpenseForm({ ...expenseForm, categoryId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {(categories || []).map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Amount</Label>
                    <Input type="number" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={expenseForm.expenseDate} onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Vendor</Label>
                  <Input value={expenseForm.vendor} onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })} />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setExpenseDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateExpense} disabled={createExpense.isPending}>
                  {createExpense.isPending ? 'Saving...' : 'Save Expense'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
            <DialogTrigger asChild>
              <Button variant="outline"><FolderOpen className="w-4 h-4 mr-2" /> Manage Categories</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Icon</Label>
                    <Input value={categoryForm.icon} onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })} placeholder="e.g. building" />
                  </div>
                  <div>
                    <Label>Color</Label>
                    <Input value={categoryForm.color} onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })} placeholder="e.g. #3b82f6" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCategoryDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateCategory} disabled={createCategory.isPending}>Save</Button>
              </DialogFooter>
              {/* Show existing categories */}
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium mb-2">Existing Categories</p>
                <div className="flex flex-wrap gap-2">
                  {(categories || []).map((c: any) => (
                    <Badge key={c.id} variant="outline">{c.name} ({c._count?.expenses || 0})</Badge>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Monthly Total</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(monthlyTotal)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
              <p className="text-2xl font-bold mt-1">{pendingCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Recurring Monthly</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(recurringMonthly)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Categories</p>
              <p className="text-2xl font-bold mt-1">{(categories || []).length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Expenses</TabsTrigger>
            <TabsTrigger value="recurring">Recurring</TabsTrigger>
            <TabsTrigger value="categories">By Category</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardContent className="pt-6">
                {!expenses.length ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No expenses recorded</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium">Date</th>
                          <th className="text-left py-2 font-medium">Description</th>
                          <th className="text-left py-2 font-medium">Category</th>
                          <th className="text-left py-2 font-medium">Vendor</th>
                          <th className="text-right py-2 font-medium">Amount</th>
                          <th className="text-left py-2 font-medium">Status</th>
                          <th className="text-right py-2 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map((e: any) => (
                          <tr key={e.id} className="border-b last:border-0">
                            <td className="py-2">{formatDate(e.expenseDate)}</td>
                            <td className="py-2">{e.description}</td>
                            <td className="py-2">{e.category?.name}</td>
                            <td className="py-2">{e.vendor || '-'}</td>
                            <td className="py-2 text-right font-medium">{formatCurrency(e.amount)}</td>
                            <td className="py-2">
                              <Badge className={cn('text-xs', statusStyles[e.status])}>{e.status}</Badge>
                            </td>
                            <td className="py-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {e.status === 'PENDING' && (
                                  <>
                                    <Button variant="ghost" size="sm" onClick={() => handleApprove(e.id)}>
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleReject(e.id)}>
                                      <XCircle className="w-4 h-4 text-red-600" />
                                    </Button>
                                  </>
                                )}
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(e.id)}>
                                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recurring">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Recurring Expenses</CardTitle>
                <Dialog open={recurringDialog} onOpenChange={setRecurringDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Recurring Expense</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Category</Label>
                        <Select value={recurringForm.categoryId} onValueChange={(v) => setRecurringForm({ ...recurringForm, categoryId: v })}>
                          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                          <SelectContent>
                            {(categories || []).map((c: any) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Input value={recurringForm.description} onChange={(e) => setRecurringForm({ ...recurringForm, description: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Amount</Label>
                          <Input type="number" step="0.01" value={recurringForm.amount} onChange={(e) => setRecurringForm({ ...recurringForm, amount: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div>
                          <Label>Frequency</Label>
                          <Select value={recurringForm.frequency} onValueChange={(v) => setRecurringForm({ ...recurringForm, frequency: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="WEEKLY">Weekly</SelectItem>
                              <SelectItem value="BIWEEKLY">Biweekly</SelectItem>
                              <SelectItem value="MONTHLY">Monthly</SelectItem>
                              <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                              <SelectItem value="YEARLY">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Start Date</Label>
                        <Input type="date" value={recurringForm.startDate} onChange={(e) => setRecurringForm({ ...recurringForm, startDate: e.target.value })} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setRecurringDialog(false)}>Cancel</Button>
                      <Button onClick={handleCreateRecurring} disabled={createRecurring.isPending}>Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {!(recurring || []).length ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No recurring expenses</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium">Description</th>
                          <th className="text-left py-2 font-medium">Category</th>
                          <th className="text-left py-2 font-medium">Frequency</th>
                          <th className="text-right py-2 font-medium">Amount</th>
                          <th className="text-left py-2 font-medium">Next Due</th>
                          <th className="text-left py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(recurring || []).map((r: any) => (
                          <tr key={r.id} className="border-b last:border-0">
                            <td className="py-2">{r.description}</td>
                            <td className="py-2">{r.category?.name}</td>
                            <td className="py-2">{r.frequency}</td>
                            <td className="py-2 text-right font-medium">{formatCurrency(r.amount)}</td>
                            <td className="py-2">{r.nextDueDate ? formatDate(r.nextDueDate) : '-'}</td>
                            <td className="py-2">
                              <Badge variant={r.isActive ? 'default' : 'secondary'}>
                                {r.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(categories || []).map((c: any) => (
                <Card key={c.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{c.name}</h3>
                      <Badge variant="outline">{c._count?.expenses || 0} expenses</Badge>
                    </div>
                    {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageWrapper>
  );
}
