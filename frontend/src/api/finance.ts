import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

// ─── Dashboard ──────────────────────────────────────────────────

export function useFinanceDashboard(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['finance', 'dashboard', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/dashboard', { params });
      return data;
    },
  });
}

export function useFinanceCashflow(months?: number) {
  return useQuery({
    queryKey: ['finance', 'cashflow', months],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/dashboard/cashflow', { params: { months } });
      return data;
    },
  });
}

export function useFinanceSparklines() {
  return useQuery({
    queryKey: ['finance', 'sparklines'],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/dashboard/sparklines');
      return data;
    },
  });
}

// ─── Daily Operations ──────────────────────────────────────────

export function useDailySummary(date: string) {
  return useQuery({
    queryKey: ['finance', 'daily', date],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/daily/summary', { params: { date } });
      return data;
    },
    enabled: !!date,
  });
}

export function useCloseDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/finance/daily/close', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'daily'] });
    },
  });
}

export function useDailyHistory() {
  return useQuery({
    queryKey: ['finance', 'daily', 'history'],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/daily/history');
      return data;
    },
  });
}

// ─── Revenue Analytics ──────────────────────────────────────────

export function useRevenueAnalytics(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['finance', 'revenue', 'analytics', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/revenue/analytics', { params });
      return data;
    },
  });
}

export function useRevenueByDoctor(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['finance', 'revenue', 'by-doctor', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/revenue/by-doctor', { params });
      return data;
    },
  });
}

export function useRevenueBySpecialty(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['finance', 'revenue', 'by-specialty', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/revenue/by-specialty', { params });
      return data;
    },
  });
}

export function useRevenueByService(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['finance', 'revenue', 'by-service', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/revenue/by-service', { params });
      return data;
    },
  });
}

export function useRevenueByPaymentMethod(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['finance', 'revenue', 'by-payment-method', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/revenue/by-payment-method', { params });
      return data;
    },
  });
}

export function useRevenueTrends(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['finance', 'revenue', 'trends', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/revenue/trends', { params });
      return data;
    },
  });
}

export function useRevenueForecast() {
  return useQuery({
    queryKey: ['finance', 'revenue', 'forecast'],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/revenue/forecast');
      return data;
    },
  });
}

// ─── Expenses ──────────────────────────────────────────────────

export function useExpenses(params?: any) {
  return useQuery({
    queryKey: ['finance', 'expenses', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/expenses', { params });
      return data;
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/finance/expenses', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'expenses'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'dashboard'] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data: payload }: { id: string; data: any }) => {
      const { data } = await apiClient.patch(`/finance/expenses/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'expenses'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'dashboard'] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/finance/expenses/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'expenses'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'dashboard'] });
    },
  });
}

// ─── Expense Categories ────────────────────────────────────────

export function useExpenseCategories() {
  return useQuery({
    queryKey: ['finance', 'expense-categories'],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/expense-categories');
      return data;
    },
  });
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/finance/expense-categories', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'expense-categories'] });
    },
  });
}

export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/finance/expense-categories/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'expense-categories'] });
    },
  });
}

// ─── Recurring Expenses ────────────────────────────────────────

export function useRecurringExpenses() {
  return useQuery({
    queryKey: ['finance', 'recurring-expenses'],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/recurring-expenses');
      return data;
    },
  });
}

export function useCreateRecurringExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/finance/recurring-expenses', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'recurring-expenses'] });
    },
  });
}

// ─── Reports ──────────────────────────────────────────────────

export function useProfitLossReport(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['finance', 'reports', 'profit-loss', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/reports/profit-loss', { params });
      return data;
    },
  });
}

export function useAccountsReceivable() {
  return useQuery({
    queryKey: ['finance', 'reports', 'accounts-receivable'],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/reports/accounts-receivable');
      return data;
    },
  });
}

export function useCashFlowReport(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['finance', 'reports', 'cash-flow', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/reports/cash-flow', { params });
      return data;
    },
  });
}

// ─── Data Entry ────────────────────────────────────────────────

export function useUpdateDailyEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ year, month, day, data: payload }: { year: number; month: number; day: number; data: any }) => {
      const { data } = await apiClient.patch(`/finance/data-entry/${year}/${month}/${day}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
  });
}

// ─── Write-offs ────────────────────────────────────────────────

export function useWriteOffs(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['finance', 'write-offs', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/write-offs', { params });
      return data;
    },
  });
}

export function useCreateWriteOff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/finance/write-offs', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}
