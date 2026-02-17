import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Save, ChevronLeft, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';
import apiClient from '@/lib/api-client';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const DEFAULT_EXPENSES = [
  { categoryName: 'Rent & Facilities', amount: 40000, description: 'Loyer' },
  { categoryName: 'Professional Services', amount: 3000, description: 'Impots' },
  { categoryName: 'Insurance', amount: 5400, description: 'CASNOS' },
  { categoryName: 'Staff Salaries', amount: 10000, description: 'Salaire Base Assistante' },
  { categoryName: 'Insurance', amount: 2700, description: 'CNAS Assistante' },
  { categoryName: 'Maintenance', amount: 1000, description: 'Ménage' },
];

const INPUT_CLASS = "h-8 text-right text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

interface DayEntry {
  day: number;
  dayOfWeek: string;
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

function getDayOfWeek(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
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
      const dow = getDayOfWeek(year, month, day);
      const weekend = isWeekendDay(year, month, day);
      return {
        day,
        dayOfWeek: dow,
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

  function updateExpense(index: number, field: keyof ExpenseEntry, value: string) {
    setExpenses((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function addExpenseRow() {
    setExpenses((prev) => [...prev, { categoryName: '', amount: '', description: '' }]);
  }

  function removeExpenseRow(index: number) {
    setExpenses((prev) => prev.filter((_, i) => i !== index));
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
      toast.info('No new data to save');
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
        `Saved: ${data.invoices} invoices, ${data.payments} payments, ${data.closings} closings, ${data.expenses} expenses`
      );
      loadExistingData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save data');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/finance')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Finance
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Monthly Data Entry</h1>
            <p className="text-sm text-muted-foreground">Enter daily revenue and monthly expenses</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Month
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
              <span className="text-xl font-semibold">{MONTH_NAMES[month - 1]} {year}</span>
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
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="text-lg font-bold text-green-600">{formatDZD(revenueTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Expenses</p>
            <p className="text-lg font-bold text-red-600">{formatDZD(expenseTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Net Income</p>
            <p className={`text-lg font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatDZD(netIncome)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Working Days</p>
            <p className="text-lg font-bold">{workingDaysWithData}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Patients Seen</p>
            <p className="text-lg font-bold">{patientsTotal}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">New Patients</p>
            <p className="text-lg font-bold text-blue-600">{newPatientsTotal}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Full Price</p>
            <p className="text-lg font-bold text-purple-600">{fullPriceTotal}</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Revenue Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Daily Revenue
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
                    <th className="text-left py-2.5 px-3 w-[50px]">Day</th>
                    <th className="text-left py-2.5 px-2 w-[44px]">Dow</th>
                    <th className="text-right py-2.5 px-1 min-w-[140px]">Revenue (DZD)</th>
                    <th className="text-right py-2.5 px-1 w-[88px]">Pat. Eff</th>
                    <th className="text-right py-2.5 px-1 w-[88px]">New</th>
                    <th className="text-right py-2.5 px-1 w-[88px]">Pat. #</th>
                    <th className="text-right py-2.5 px-1 w-[88px]">Full Paid</th>
                    <th className="text-center py-2.5 px-2 w-[72px]">Status</th>
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
                      <td className="py-1 px-2 text-xs">{entry.dayOfWeek}</td>
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
                      <td className="py-1 px-2 text-center">
                        {entry.isWeekend ? (
                          <Badge variant="outline" className="text-[10px]">Weekend</Badge>
                        ) : entry.hasData ? (
                          <Badge className="text-[10px] bg-green-600">Saved</Badge>
                        ) : parseFloat(entry.revenue) > 0 ? (
                          <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-600">New</Badge>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 bg-card shadow-[0_-1px_0_0_hsl(var(--border))]">
                  <tr className="border-t-2 font-bold">
                    <td className="py-2 px-3" colSpan={2}>Totals</td>
                    <td className="py-2 px-1 text-right text-green-600">{formatDZD(revenueTotal)}</td>
                    <td className="py-2 px-1 text-right">{patientsTotal}</td>
                    <td className="py-2 px-1 text-right">{newPatientsTotal}</td>
                    <td className="py-2 px-1 text-right">{totalPatientsTotal}</td>
                    <td className="py-2 px-1 text-right">{fullPriceTotal}</td>
                    <td></td>
                  </tr>
                  {workingDaysWithData > 0 && (
                    <tr className="text-muted-foreground text-xs">
                      <td className="py-1 px-3" colSpan={2}>Daily Average</td>
                      <td className="py-1 px-1 text-right">{formatDZD(Math.round(revenueTotal / workingDaysWithData))}</td>
                      <td className="py-1 px-1 text-right">{(patientsTotal / workingDaysWithData).toFixed(1)}</td>
                      <td className="py-1 px-1 text-right">{(newPatientsTotal / workingDaysWithData).toFixed(1)}</td>
                      <td className="py-1 px-1 text-right">{(totalPatientsTotal / workingDaysWithData).toFixed(1)}</td>
                      <td className="py-1 px-1 text-right">{(fullPriceTotal / workingDaysWithData).toFixed(1)}</td>
                      <td></td>
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
            <CardTitle>Monthly Expenses</CardTitle>
            <Button variant="outline" size="sm" onClick={addExpenseRow}>
              + Add Line
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Category</th>
                  <th className="text-left py-2 px-2">Description</th>
                  <th className="text-right py-2 px-2">Amount (DZD)</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/20">
                    <td className="py-1 px-1">
                      <Input
                        className="h-8 text-sm"
                        value={expense.categoryName}
                        onChange={(e) => updateExpense(idx, 'categoryName', e.target.value)}
                        placeholder="Category"
                      />
                    </td>
                    <td className="py-1 px-1">
                      <Input
                        className="h-8 text-sm"
                        value={expense.description}
                        onChange={(e) => updateExpense(idx, 'description', e.target.value)}
                        placeholder="Description"
                      />
                    </td>
                    <td className="py-1 px-1">
                      <Input
                        type="number"
                        className={INPUT_CLASS}
                        value={expense.amount}
                        onChange={(e) => updateExpense(idx, 'amount', e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td className="py-1 px-1">
                      {idx >= DEFAULT_EXPENSES.length && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500"
                          onClick={() => removeExpenseRow(idx)}
                        >
                          ×
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-bold">
                  <td className="py-2 px-2" colSpan={2}>Total Expenses</td>
                  <td className="py-2 px-2 text-right text-red-600">{formatDZD(expenseTotal)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Net Summary */}
      <Card className={netIncome >= 0 ? 'border-green-200 bg-green-50/50 dark:bg-green-950/10' : 'border-red-200 bg-red-50/50 dark:bg-red-950/10'}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Net Income ({MONTH_NAMES[month - 1]} {year})</p>
              <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatDZD(netIncome)}
              </p>
            </div>
            {revenueTotal > 0 && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Profit Margin</p>
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
          Save Month Data
        </Button>
      </div>
    </div>
  );
}
