import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth-store';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClinicProfileForm } from '@/components/settings/clinic-profile-form';
import { SpecialtyManager } from '@/components/settings/specialty-manager';
import { PrintSettings } from '@/components/settings/print-settings';
import { NotificationSettings } from '@/components/settings/notification-settings';
import { EmptyState } from '@/components/ui/empty-state';
import { Building2, Stethoscope, Printer, BellRing, ShieldAlert } from 'lucide-react';

export function SettingsPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <PageWrapper title={t('settings.title')}>
        <EmptyState
          icon={ShieldAlert}
          title={t('settings.accessDenied')}
          description={t('settings.accessDeniedDesc')}
        />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title={t('settings.title')}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/dashboard' },
        { label: t('nav.settings') },
      ]}
    >
      <Tabs defaultValue="clinic-profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="clinic-profile" className="gap-2">
            <Building2 className="w-4 h-4" />
            {t('settings.tabs.clinic')}
          </TabsTrigger>
          <TabsTrigger value="specialties" className="gap-2">
            <Stethoscope className="w-4 h-4" />
            {t('settings.tabs.specialties')}
          </TabsTrigger>
          <TabsTrigger value="printing" className="gap-2">
            <Printer className="w-4 h-4" />
            {t('settings.tabs.printing')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <BellRing className="w-4 h-4" />
            {t('settings.tabs.notifications')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clinic-profile">
          <ClinicProfileForm />
        </TabsContent>

        <TabsContent value="specialties">
          <SpecialtyManager />
        </TabsContent>

        <TabsContent value="printing">
          <PrintSettings />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}
