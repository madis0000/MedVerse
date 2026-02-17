import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { CalendarDays, Save, ChevronLeft, ChevronRight, Loader2, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import apiClient from '@/lib/api-client';

const MONTH_KEYS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

const DAY_OF_WEEK_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const DEFAULT_EXPENSES = [
  { categoryName: 'Rent & Facilities', amount: 0, description: 'Loyer' },
  { categoryName: 'Professional Services', amount: 0, description: 'Impots' },
  { categoryName: 'Insurance', amount: 0, description: 'CASNOS' },
  { categoryName: 'Staff Salaries', amount: 0, description: 'Salaire Base Assistante' },
  { categoryName: 'Insurance', amount: 0, description: 'CNAS Assistante' },
  { categoryName: 'Maintenance', amount: 0, description: 'Ménage' },
];

const INPUT_CLASS = "h-8 text-right text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

interface DayEntry {
  day: number;
  dayOfWeekIndex: number;
  isWeekend: boolean;
  revenue: string;
  patientsEffective: string;
  newPatients: string;
  totalPatients: string;
  fullPricePatients: string;
  hasData: boolean;
}

interface ExpenseEntry {
  categoryName: string;
  amount: string;
  description: string;
}

function getDayOfWeekIndex(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay();
}

function isWeekendDay(year: number, month: number, day: number): boolean {
  const dow = new Date(year, month - 1, day).getDay();
  return dow === 5 || dow === 6; // Friday=5, Saturday=6 (Algerian weekend)
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function formatDZD(amount: number): string {
  return amount.toLocaleString('fr-DZ') + ' DZD';
}

export function FinanceDataEntryPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingData, setExistingData] = useState<any>(null);

  // Build days grid for the month
  const days: DayEntry[] = useMemo(() => {
    const count = getDaysInMonth(year, month);
    return Array.from({ length: count }, (_, i) => {
      const day = i + 1;
      const dowIndex = getDayOfWeekIndex(year, month, day);
      const weekend = isWeekendDay(year, month, day);
      return {
        day,
        dayOfWeekIndex: dowIndex,
        isWeekend: weekend,
        revenue: '',
        patientsEffective: '',
        newPatients: '',
        totalPatients: '',
        fullPricePatients: '',
        hasData: false,
      };
    });
  }, [year, month]);

  const [dayEntries, setDayEntries] = useState<DayEntry[]>(days);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>(
    DEFAULT_EXPENSES.map((e) => ({ ...e, amount: String(e.amount) }))
  );

  // Reset when month/year changes
  useEffect(() => {
    setDayEntries(days);
    setExpenses(DEFAULT_EXPENSES.map((e) => ({ ...e, amount: String(e.amount) })));
    loadExistingData();
  }, [year, month]);

  async function loadExistingData() {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/finance/data-entry/${year}/${month}`);
      setExistingData(data);
      if (data.days?.length) {
        setDayEntries((prev) =>
          prev.map((d) => {
            const existing = data.days.find((ed: any) => ed.day === d.day);
            if (existing) {
              return {
                ...d,
                revenue: String(existing.revenue),
                patientsEffective: String(existing.patientsEffective || ''),
                newPatients: String(existing.newPatients || ''),
                totalPatients: String(existing.totalPatients || ''),
                fullPricePatients: String(existing.fullPricePatients || ''),
                hasData: true,
              };
            }
            return d;
          })
        );
      }
      if (data.expenses?.length) {
        const merged = DEFAULT_EXPENSES.map((def) => {
          const existing = data.expenses.find(
            (e: any) => e.description === def.description
          );
          return {
            categoryName: def.categoryName,
            amount: existing ? String(existing.amount) : String(def.amount),
            description: def.description,
          };
        });
        for (const e of data.expenses) {
          if (!merged.find((m) => m.description === e.description)) {
            merged.push({ categoryName: e.categoryName, amount: String(e.amount), description: e.description });
          }
        }
        setExpenses(merged);
      }
    } catch {
      // No existing data, that's fine
    } finally {
      setLoading(false);
    }
  }

  function updateDay(index: number, field: keyof DayEntry, value: string) {
    setDayEntries((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  // Expense dialog state
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingExpenseIdx, setEditingExpenseIdx] = useState<number | null>(null);
  const [expenseForm, setExpenseForm] = useState({ categoryName: '', description: '', amount: '' });

  function openEditExpense(idx: number) {
    const e = expenses[idx];
    setExpenseForm({ categoryName: e.categoryName, description: e.description, amount: e.amount });
    setEditingExpenseIdx(idx);
    setExpenseDialogOpen(true);
  }

  function openNewExpense() {
    setExpenseForm({ categoryName: '', description: '', amount: '' });
    setEditingExpenseIdx(null);
    setExpenseDialogOpen(true);
  }

  function saveExpenseForm() {
    if (!expenseForm.categoryName.trim()) return;
    if (editingExpenseIdx !== null) {
      setExpenses((prev) => {
        const updated = [...prev];
        updated[editingExpenseIdx] = { ...expenseForm };
        return updated;
      });
    } else {
      setExpenses((prev) => [...prev, { ...expenseForm }]);
    }
    setExpenseDialogOpen(false);
  }

  function removeExpense(idx: number) {
    setExpenses((prev) => prev.filter((_, i) => i !== idx));
    setExpenseDialogOpen(false);
  }

  // Totals
  const revenueTotal = dayEntries.reduce((sum, d) => sum + (parseFloat(d.revenue) || 0), 0);
  const patientsTotal = dayEntries.reduce((sum, d) => sum + (parseInt(d.patientsEffective) || 0), 0);
  const newPatientsTotal = dayEntries.reduce((sum, d) => sum + (parseInt(d.newPatients) || 0), 0);
  const totalPatientsTotal = dayEntries.reduce((sum, d) => sum + (parseInt(d.totalPatients) || 0), 0);
  const fullPriceTotal = dayEntries.reduce((sum, d) => sum + (parseInt(d.fullPricePatients) || 0), 0);
  const workingDaysWithData = dayEntries.filter((d) => !d.isWeekend && parseFloat(d.revenue) > 0).length;
  const expenseTotal = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const netIncome = revenueTotal - expenseTotal;

  async function handleSave() {
    const daysData = dayEntries
      .filter((d) => !d.isWeekend && d.revenue !== '' && !isNaN(parseFloat(d.revenue)) && !d.hasData)
      .map((d) => ({
        day: d.day,
        revenue: parseFloat(d.revenue),
        patientsEffective: parseInt(d.patientsEffective) || 0,
        newPatients: parseInt(d.newPatients) || 0,
        totalPatients: parseInt(d.totalPatients) || 0,
        fullPricePatients: parseInt(d.fullPricePatients) || 0,
      }));

    const expensesData = expenses
      .filter((e) => e.amount !== '' && !isNaN(parseFloat(e.amount)) && e.categoryName)
      .map((e) => ({
        categoryName: e.categoryName,
        amount: parseFloat(e.amount),
        description: e.description,
      }));

    if (daysData.length === 0 && expensesData.length === 0) {
      toast.info(t('finance.dataEntry.noNewData'));
      return;
    }

    setSaving(true);
    try {
      const { data } = await apiClient.post('/finance/data-entry', {
        year,
        month,
        days: daysData,
        expenses: expensesData,
      });
      toast.success(
        t('finance.dataEntry.savedSummary', {
          invoices: data.invoices,
          payments: data.payments,
          closings: data.closings,
          expenses: data.expenses,
        })
      );
      loadExistingData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('finance.dataEntry.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  }

  const translatedMonthName = t(`finance.dataEntry.months.${MONTH_KEYS[month - 1]}`);

  function getDayOfWeekLabel(dayOfWeekIndex: number): string {
    return t(`finance.dataEntry.daysOfWeek.${DAY_OF_WEEK_KEYS[dayOfWeekIndex]}`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/finance')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> {t('nav.finance')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('finance.dataEntry.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('finance.dataEntry.subtitle')}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {t('finance.dataEntry.saveMonth')}
        </Button>
      </div>

      {/* Month Navigator */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              <span className="text-xl font-semibold">{translatedMonthName} {year}</span>
            </div>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">{t('finance.dataEntry.revenue')}</p>
            <p className="text-lg font-bold text-green-600">{formatDZD(revenueTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">{t('finance.dataEntry.expenses')}</p>
            <p className="text-lg font-bold text-red-600">{formatDZD(expenseTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">{t('finance.dataEntry.netIncome')}</p>
            <p className={`text-lg font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatDZD(netIncome)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">{t('finance.dataEntry.workingDays')}</p>
            <p className="text-lg font-bold">{workingDaysWithData}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">{t('finance.dataEntry.patientsSeen')}</p>
            <p className="text-lg font-bold">{patientsTotal}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">{t('finance.dataEntry.newPatients')}</p>
            <p className="text-lg font-bold text-blue-600">{newPatientsTotal}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">{t('finance.dataEntry.fullPrice')}</p>
            <p className="text-lg font-bold text-purple-600">{fullPriceTotal}</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Revenue Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            {t('finance.dataEntry.dailyRevenue')}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_0_hsl(var(--border))]">
                  <tr>
                    <th className="text-left py-2.5 px-3 w-[50px]">{t('finance.dataEntry.columns.day')}</th>
                    <th className="text-left py-2.5 px-2 w-[44px]">{t('finance.dataEntry.columns.dow')}</th>
                    <th className="text-right py-2.5 px-1 min-w-[140px]">{t('finance.dataEntry.columns.revenueDZD')}</th>
                    <th className="text-right py-2.5 px-1 w-[88px]">{t('finance.dataEntry.columns.patEff')}</th>
                    <th className="text-right py-2.5 px-1 w-[88px]">{t('finance.dataEntry.columns.new')}</th>
                    <th className="text-right py-2.5 px-1 w-[88px]">{t('finance.dataEntry.columns.patNum')}</th>
                    <th className="text-right py-2.5 px-1 w-[88px]">{t('finance.dataEntry.columns.fullPaid')}</th>
                  </tr>
                </thead>
                <tbody>
                  {dayEntries.map((entry, idx) => (
                    <tr
                      key={entry.day}
                      className={`border-b transition-colors ${
                        entry.isWeekend
                          ? 'bg-muted/40 text-muted-foreground'
                          : entry.hasData
                          ? 'bg-green-50 dark:bg-green-950/20'
                          : 'hover:bg-muted/20'
                      }`}
                    >
                      <td className="py-1 px-3 font-medium">{entry.day}</td>
                      <td className="py-1 px-2 text-xs">{getDayOfWeekLabel(entry.dayOfWeekIndex)}</td>
                      <td className="py-1 px-1">
                        <Input
                          type="number"
                          className={`${INPUT_CLASS} min-w-[120px]`}
                          placeholder={entry.isWeekend ? '—' : '0'}
                          disabled={entry.isWeekend || entry.hasData}
                          value={entry.revenue}
                          onChange={(e) => updateDay(idx, 'revenue', e.target.value)}
                        />
                      </td>
                      <td className="py-1 px-1">
                        <Input
                          type="number"
                          className={`${INPUT_CLASS} w-[72px]`}
                          placeholder={entry.isWeekend ? '—' : '0'}
                          disabled={entry.isWeekend || entry.hasData}
                          value={entry.patientsEffective}
                          onChange={(e) => updateDay(idx, 'patientsEffective', e.target.value)}
                        />
                      </td>
                      <td className="py-1 px-1">
                        <Input
                          type="number"
                          className={`${INPUT_CLASS} w-[72px]`}
                          placeholder={entry.isWeekend ? '—' : '0'}
                          disabled={entry.isWeekend || entry.hasData}
                          value={entry.newPatients}
                          onChange={(e) => updateDay(idx, 'newPatients', e.target.value)}
                        />
                      </td>
                      <td className="py-1 px-1">
                        <Input
                          type="number"
                          className={`${INPUT_CLASS} w-[72px]`}
                          placeholder={entry.isWeekend ? '—' : '0'}
                          disabled={entry.isWeekend || entry.hasData}
                          value={entry.totalPatients}
                          onChange={(e) => updateDay(idx, 'totalPatients', e.target.value)}
                        />
                      </td>
                      <td className="py-1 px-1">
                        <Input
                          type="number"
                          className={`${INPUT_CLASS} w-[72px]`}
                          placeholder={entry.isWeekend ? '—' : '0'}
                          disabled={entry.isWeekend || entry.hasData}
                          value={entry.fullPricePatients}
                          onChange={(e) => updateDay(idx, 'fullPricePatients', e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 bg-card shadow-[0_-1px_0_0_hsl(var(--border))]">
                  <tr className="border-t-2 font-bold">
                    <td className="py-2 px-3" colSpan={2}>{t('finance.dataEntry.totals')}</td>
                    <td className="py-2 px-1 text-right text-green-600">{formatDZD(revenueTotal)}</td>
                    <td className="py-2 px-1 text-right">{patientsTotal}</td>
                    <td className="py-2 px-1 text-right">{newPatientsTotal}</td>
                    <td className="py-2 px-1 text-right">{totalPatientsTotal}</td>
                    <td className="py-2 px-1 text-right">{fullPriceTotal}</td>
                  </tr>
                  {workingDaysWithData > 0 && (
                    <tr className="text-muted-foreground text-xs">
                      <td className="py-1 px-3" colSpan={2}>{t('finance.dataEntry.dailyAverage')}</td>
                      <td className="py-1 px-1 text-right">{formatDZD(Math.round(revenueTotal / workingDaysWithData))}</td>
                      <td className="py-1 px-1 text-right">{(patientsTotal / workingDaysWithData).toFixed(1)}</td>
                      <td className="py-1 px-1 text-right">{(newPatientsTotal / workingDaysWithData).toFixed(1)}</td>
                      <td className="py-1 px-1 text-right">{(totalPatientsTotal / workingDaysWithData).toFixed(1)}</td>
                      <td className="py-1 px-1 text-right">{(fullPriceTotal / workingDaysWithData).toFixed(1)}</td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Expenses */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('finance.dataEntry.monthlyExpenses')}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{t('finance.dataEntry.clickToEdit')}</p>
            </div>
            <Button variant="outline" size="sm" onClick={openNewExpense}>
              <Plus className="w-4 h-4 mr-1" /> {t('finance.dataEntry.addTransaction')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {expenses.map((expense, idx) => {
              const hasAmount = (parseFloat(expense.amount) || 0) > 0;
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between py-2.5 px-3 border-b last:border-b-0 cursor-pointer rounded-sm transition-colors ${
                    hasAmount
                      ? 'bg-blue-50/60 hover:bg-blue-100/60 dark:bg-blue-950/15 dark:hover:bg-blue-950/25'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => openEditExpense(idx)}
                >
                  <div>
                    <span className="text-sm font-medium">{expense.categoryName}</span>
                    {expense.description && (
                      <span className="text-sm text-muted-foreground ml-2">— {expense.description}</span>
                    )}
                  </div>
                  <span className={`text-sm font-medium tabular-nums ${hasAmount ? '' : 'text-muted-foreground'}`}>
                    {formatDZD(parseFloat(expense.amount) || 0)}
                  </span>
                </div>
              );
            })}
            <div className="flex items-center justify-between py-3 px-3 border-t-2 font-bold">
              <span>{t('finance.dataEntry.totalExpenses')}</span>
              <span className="text-red-600 tabular-nums">{formatDZD(expenseTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Transaction Dialog */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingExpenseIdx !== null
                ? t('finance.dataEntry.editTransaction')
                : t('finance.dataEntry.addTransaction')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>{t('finance.dataEntry.columns.category')}</Label>
              <Input
                value={expenseForm.categoryName}
                onChange={(e) => setExpenseForm((f) => ({ ...f, categoryName: e.target.value }))}
                disabled={editingExpenseIdx !== null && editingExpenseIdx < DEFAULT_EXPENSES.length}
                placeholder={t('finance.dataEntry.columns.category')}
              />
            </div>
            <div>
              <Label>{t('finance.dataEntry.columns.description')}</Label>
              <Input
                value={expenseForm.description}
                onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))}
                disabled={editingExpenseIdx !== null && editingExpenseIdx < DEFAULT_EXPENSES.length}
                placeholder={t('finance.dataEntry.columns.description')}
              />
            </div>
            <div>
              <Label>{t('finance.dataEntry.columns.amountDZD')}</Label>
              <Input
                type="number"
                className={INPUT_CLASS}
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            {editingExpenseIdx !== null && editingExpenseIdx >= DEFAULT_EXPENSES.length && (
              <Button
                variant="destructive"
                size="sm"
                className="mr-auto"
                onClick={() => removeExpense(editingExpenseIdx)}
              >
                <Trash2 className="w-4 h-4 mr-1" /> {t('common.delete')}
              </Button>
            )}
            <Button variant="outline" onClick={() => setExpenseDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={saveExpenseForm}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Net Summary */}
      <Card className={netIncome >= 0 ? 'border-green-200 bg-green-50/50 dark:bg-green-950/10' : 'border-red-200 bg-red-50/50 dark:bg-red-950/10'}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('finance.dataEntry.netIncome')} ({translatedMonthName} {year})</p>
              <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatDZD(netIncome)}
              </p>
            </div>
            {revenueTotal > 0 && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{t('finance.dataEntry.profitMargin')}</p>
                <p className={`text-xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {((netIncome / revenueTotal) * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {t('finance.dataEntry.saveMonthData')}
        </Button>
      </div>
    </div>
  );
}
