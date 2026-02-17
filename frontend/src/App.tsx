import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { AppLayout } from '@/components/layout/app-layout';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoginPage } from '@/pages/login';
import { NotFoundPage } from '@/pages/not-found';
import { DashboardPage } from '@/pages/dashboard';
import { PatientListPage } from '@/pages/patients/patient-list';
import { PatientCreatePage } from '@/pages/patients/patient-create';
import { PatientProfilePage } from '@/pages/patients/patient-profile';
import { AppointmentCalendarPage } from '@/pages/appointments/appointment-calendar';
import { ConsultationFormPage } from '@/pages/consultations/consultation-form';
import { PrescriptionWriterPage } from '@/pages/prescriptions/prescription-writer';
import { LabManagementPage } from '@/pages/laboratory/lab-management';
import { InvoiceListPage } from '@/pages/billing/invoice-list';
import { InvoiceDetailPage } from '@/pages/billing/invoice-detail';
import { DocumentManagerPage } from '@/pages/documents/document-manager';
import { UserManagementPage } from '@/pages/users/user-management';
import { SettingsPage } from '@/pages/settings/settings-page';
import { AuditLogPage } from '@/pages/audit-log';
import { FinanceDashboardPage } from '@/pages/finance/finance-dashboard';
import { FinanceDailyPage } from '@/pages/finance/finance-daily';
import { FinanceRevenuePage } from '@/pages/finance/finance-revenue';
import { FinanceExpensesPage } from '@/pages/finance/finance-expenses';
import { FinanceReportsPage } from '@/pages/finance/finance-reports';
import { FinanceDataEntryPage } from '@/pages/finance/finance-data-entry';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="patients" element={<PatientListPage />} />
              <Route path="patients/new" element={<PatientCreatePage />} />
              <Route path="patients/:id" element={<PatientProfilePage />} />
              <Route path="appointments" element={<AppointmentCalendarPage />} />
              <Route path="consultations/:id" element={<ConsultationFormPage />} />
              <Route path="prescriptions" element={<PrescriptionWriterPage />} />
              <Route path="laboratory" element={<LabManagementPage />} />
              <Route path="billing" element={<InvoiceListPage />} />
              <Route path="billing/:id" element={<InvoiceDetailPage />} />
              <Route path="finance" element={<FinanceDashboardPage />} />
              <Route path="finance/daily" element={<FinanceDailyPage />} />
              <Route path="finance/revenue" element={<FinanceRevenuePage />} />
              <Route path="finance/expenses" element={<FinanceExpensesPage />} />
              <Route path="finance/reports" element={<FinanceReportsPage />} />
              <Route path="finance/data-entry" element={<FinanceDataEntryPage />} />
              <Route path="documents" element={<DocumentManagerPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="audit-log" element={<AuditLogPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
