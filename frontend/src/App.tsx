import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore, User } from '@/stores/auth-store';
import { AppLayout } from '@/components/layout/app-layout';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import('@/pages/login').then(m => ({ default: m.LoginPage })));
const NotFoundPage = lazy(() => import('@/pages/not-found').then(m => ({ default: m.NotFoundPage })));
const DashboardPage = lazy(() => import('@/pages/dashboard').then(m => ({ default: m.DashboardPage })));
const PatientListPage = lazy(() => import('@/pages/patients/patient-list').then(m => ({ default: m.PatientListPage })));
const PatientCreatePage = lazy(() => import('@/pages/patients/patient-create').then(m => ({ default: m.PatientCreatePage })));
const PatientProfilePage = lazy(() => import('@/pages/patients/patient-profile').then(m => ({ default: m.PatientProfilePage })));
const AppointmentCalendarPage = lazy(() => import('@/pages/appointments/appointment-calendar').then(m => ({ default: m.AppointmentCalendarPage })));
const ConsultationFormPage = lazy(() => import('@/pages/consultations/consultation-form').then(m => ({ default: m.ConsultationFormPage })));
const PrescriptionWriterPage = lazy(() => import('@/pages/prescriptions/prescription-writer').then(m => ({ default: m.PrescriptionWriterPage })));
const LabManagementPage = lazy(() => import('@/pages/laboratory/lab-management').then(m => ({ default: m.LabManagementPage })));
const InvoiceListPage = lazy(() => import('@/pages/billing/invoice-list').then(m => ({ default: m.InvoiceListPage })));
const InvoiceDetailPage = lazy(() => import('@/pages/billing/invoice-detail').then(m => ({ default: m.InvoiceDetailPage })));
const DocumentManagerPage = lazy(() => import('@/pages/documents/document-manager').then(m => ({ default: m.DocumentManagerPage })));
const UserManagementPage = lazy(() => import('@/pages/users/user-management').then(m => ({ default: m.UserManagementPage })));
const SettingsPage = lazy(() => import('@/pages/settings/settings-page').then(m => ({ default: m.SettingsPage })));
const AuditLogPage = lazy(() => import('@/pages/audit-log').then(m => ({ default: m.AuditLogPage })));
const FinanceDashboardPage = lazy(() => import('@/pages/finance/finance-dashboard').then(m => ({ default: m.FinanceDashboardPage })));
const FinanceDailyPage = lazy(() => import('@/pages/finance/finance-daily').then(m => ({ default: m.FinanceDailyPage })));
const FinanceRevenuePage = lazy(() => import('@/pages/finance/finance-revenue').then(m => ({ default: m.FinanceRevenuePage })));
const FinanceExpensesPage = lazy(() => import('@/pages/finance/finance-expenses').then(m => ({ default: m.FinanceExpensesPage })));
const FinanceReportsPage = lazy(() => import('@/pages/finance/finance-reports').then(m => ({ default: m.FinanceReportsPage })));
const FinanceDataEntryPage = lazy(() => import('@/pages/finance/finance-data-entry').then(m => ({ default: m.FinanceDataEntryPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

type RoleType = User['role'];

function RoleGuard({ roles, children }: { roles: RoleType[]; children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
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
                <Route path="finance" element={<RoleGuard roles={['SUPER_ADMIN']}><FinanceDashboardPage /></RoleGuard>} />
                <Route path="finance/daily" element={<RoleGuard roles={['SUPER_ADMIN']}><FinanceDailyPage /></RoleGuard>} />
                <Route path="finance/revenue" element={<RoleGuard roles={['SUPER_ADMIN']}><FinanceRevenuePage /></RoleGuard>} />
                <Route path="finance/expenses" element={<RoleGuard roles={['SUPER_ADMIN']}><FinanceExpensesPage /></RoleGuard>} />
                <Route path="finance/reports" element={<RoleGuard roles={['SUPER_ADMIN']}><FinanceReportsPage /></RoleGuard>} />
                <Route path="finance/data-entry" element={<RoleGuard roles={['SUPER_ADMIN']}><FinanceDataEntryPage /></RoleGuard>} />
                <Route path="documents" element={<DocumentManagerPage />} />
                <Route path="users" element={<RoleGuard roles={['SUPER_ADMIN']}><UserManagementPage /></RoleGuard>} />
                <Route path="settings" element={<RoleGuard roles={['SUPER_ADMIN']}><SettingsPage /></RoleGuard>} />
                <Route path="audit-log" element={<RoleGuard roles={['SUPER_ADMIN']}><AuditLogPage /></RoleGuard>} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
