import {
  Users,
  CalendarCheck,
  DollarSign,
  FlaskConical,
  Stethoscope,
  ClipboardList,
  Activity,
  Clock,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth-store';
import { useAdminDashboard, useDoctorDashboard } from '@/api/dashboard';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { DashboardSkeleton } from '@/components/ui/loading-skeleton';
import { StatsCard } from '@/components/dashboard/stats-card';
import { AppointmentWidget } from '@/components/dashboard/appointment-widget';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { TopDiagnosesChart } from '@/components/dashboard/top-diagnoses-chart';
import { DoctorScheduleWidget } from '@/components/dashboard/doctor-schedule-widget';
import { formatCurrency } from '@/lib/utils';
import type { Role } from '@/types';

function AdminDashboard() {
  const { t } = useTranslation();
  const { data, isLoading } = useAdminDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const stats = data?.data || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t('dashboard.admin.totalPatients')}
          value={stats.totalPatients?.toLocaleString() || '0'}
          change={stats.patientGrowth}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title={t('dashboard.admin.appointmentsToday')}
          value={stats.appointmentsToday || 0}
          change={stats.appointmentGrowth}
          icon={CalendarCheck}
          color="green"
        />
        <StatsCard
          title={t('dashboard.admin.revenueMonth')}
          value={formatCurrency(stats.monthlyRevenue || 0)}
          change={stats.revenueGrowth}
          icon={DollarSign}
          color="amber"
        />
        <StatsCard
          title={t('dashboard.admin.pendingLabs')}
          value={stats.pendingLabs || 0}
          icon={FlaskConical}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        <TopDiagnosesChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppointmentWidget />
        <RecentActivityCard
          pendingLabs={stats.pendingLabs || 0}
          completedToday={stats.completedToday || 0}
          newPatients={stats.newPatientsToday || 0}
        />
      </div>
    </div>
  );
}

function DoctorDashboard() {
  const { t } = useTranslation();
  const { data, isLoading } = useDoctorDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const stats = data?.data || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t('dashboard.doctor.todaysPatients')}
          value={stats.todayPatients || 0}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title={t('dashboard.doctor.pendingConsultations')}
          value={stats.pendingConsultations || 0}
          icon={Stethoscope}
          color="green"
        />
        <StatsCard
          title={t('dashboard.doctor.pendingLabResults')}
          value={stats.pendingLabs || 0}
          icon={FlaskConical}
          color="amber"
        />
        <StatsCard
          title={t('dashboard.doctor.completedToday')}
          value={stats.completedToday || 0}
          icon={ClipboardList}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DoctorScheduleWidget />
        <AppointmentWidget />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentConsultationsCard consultations={stats.recentConsultations || []} />
        <PendingLabsCard labs={stats.pendingLabOrders || []} />
      </div>
    </div>
  );
}

function GenericDashboard({ role }: { role: Role }) {
  const { t } = useTranslation();

  const roleLabels: Record<string, string> = {
    NURSE: t('roles.NURSE'),
    RECEPTIONIST: t('roles.RECEPTIONIST'),
    LAB_TECH: t('roles.LAB_TECH'),
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Activity className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {t('dashboard.generic.welcome', { role: roleLabels[role] || t('roles.staffMember') })}
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {t('dashboard.generic.dashboardReady')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {role === 'NURSE' && (
          <>
            <StatsCard title={t('dashboard.nurse.patientsWaiting')} value={0} icon={Users} color="blue" />
            <StatsCard title={t('dashboard.nurse.vitalsToRecord')} value={0} icon={Activity} color="green" />
            <StatsCard title={t('dashboard.nurse.checkInsToday')} value={0} icon={CalendarCheck} color="amber" />
            <StatsCard title={t('dashboard.nurse.tasksPending')} value={0} icon={ClipboardList} color="purple" />
          </>
        )}
        {role === 'RECEPTIONIST' && (
          <>
            <StatsCard title={t('dashboard.receptionist.todaysAppointments')} value={0} icon={CalendarCheck} color="blue" />
            <StatsCard title={t('dashboard.receptionist.checkedIn')} value={0} icon={Users} color="green" />
            <StatsCard title={t('dashboard.receptionist.pendingPayments')} value={0} icon={DollarSign} color="amber" />
            <StatsCard title={t('dashboard.receptionist.noShows')} value={0} icon={Clock} color="red" />
          </>
        )}
        {role === 'LAB_TECH' && (
          <>
            <StatsCard title={t('dashboard.labTech.pendingOrders')} value={0} icon={FlaskConical} color="blue" />
            <StatsCard title={t('dashboard.labTech.inProcessing')} value={0} icon={Activity} color="green" />
            <StatsCard title={t('dashboard.labTech.completedToday')} value={0} icon={ClipboardList} color="amber" />
            <StatsCard title={t('dashboard.labTech.urgentOrders')} value={0} icon={Clock} color="red" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppointmentWidget />
      </div>
    </div>
  );
}

interface RecentConsultation {
  id: string;
  patientName: string;
  diagnosis?: string;
  completedAt: string;
}

function RecentConsultationsCard({ consultations }: { consultations: RecentConsultation[] }) {
  const { t, i18n } = useTranslation();

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-6 pb-2">
        <h3 className="text-base font-semibold text-foreground">{t('dashboard.recentConsultations')}</h3>
      </div>
      <div className="p-6 pt-2">
        {consultations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Stethoscope className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{t('dashboard.noRecentConsultations')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {consultations.slice(0, 5).map((consultation) => (
              <div
                key={consultation.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {consultation.patientName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {consultation.diagnosis || t('dashboard.noDiagnosisRecorded')}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(consultation.completedAt).toLocaleTimeString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface PendingLab {
  id: string;
  patientName: string;
  testName: string;
  priority: string;
  createdAt: string;
}

function PendingLabsCard({ labs }: { labs: PendingLab[] }) {
  const { t } = useTranslation();

  const priorityColors: Record<string, string> = {
    STAT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    URGENT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    ROUTINE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-6 pb-2">
        <h3 className="text-base font-semibold text-foreground">{t('dashboard.pendingLabResults')}</h3>
      </div>
      <div className="p-6 pt-2">
        {labs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FlaskConical className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{t('dashboard.noPendingLabResults')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {labs.slice(0, 5).map((lab) => (
              <div
                key={lab.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{lab.patientName}</p>
                  <p className="text-xs text-muted-foreground">{lab.testName}</p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                    priorityColors[lab.priority] || priorityColors.ROUTINE
                  }`}
                >
                  {t(`laboratory.priority.${lab.priority}`, lab.priority)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RecentActivityCard({
  pendingLabs,
  completedToday,
  newPatients,
}: {
  pendingLabs: number;
  completedToday: number;
  newPatients: number;
}) {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-6 pb-2">
        <h3 className="text-base font-semibold text-foreground">{t('dashboard.quickStats')}</h3>
      </div>
      <div className="p-6 pt-2 space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <ClipboardList className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{t('dashboard.completedToday')}</p>
              <p className="text-xs text-muted-foreground">{t('dashboard.appointmentsFinished')}</p>
            </div>
          </div>
          <span className="text-lg font-bold text-foreground">{completedToday}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <FlaskConical className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{t('dashboard.pendingLabs')}</p>
              <p className="text-xs text-muted-foreground">{t('dashboard.awaitingResults')}</p>
            </div>
          </div>
          <span className="text-lg font-bold text-foreground">{pendingLabs}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{t('dashboard.newPatients')}</p>
              <p className="text-xs text-muted-foreground">{t('dashboard.registeredToday')}</p>
            </div>
          </div>
          <span className="text-lg font-bold text-foreground">{newPatients}</span>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const role = user?.role || 'RECEPTIONIST';

  const greeting = getGreeting(t);
  const displayName = user ? `${user.firstName}` : '';

  return (
    <PageWrapper title={`${greeting}, ${displayName}`}>
      {role === 'SUPER_ADMIN' && <AdminDashboard />}
      {role === 'DOCTOR' && <DoctorDashboard />}
      {role !== 'SUPER_ADMIN' && role !== 'DOCTOR' && <GenericDashboard role={role} />}
    </PageWrapper>
  );
}

function getGreeting(t: (key: string) => string) {
  const hour = new Date().getHours();
  if (hour < 12) return t('dashboard.greeting.morning');
  if (hour < 17) return t('dashboard.greeting.afternoon');
  return t('dashboard.greeting.evening');
}
