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
  const user = useAuthStore((s) => s.user);

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <PageWrapper title="Settings">
        <EmptyState
          icon={ShieldAlert}
          title="Access Denied"
          description="Only administrators can access the settings page. Contact your administrator for assistance."
        />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Settings"
      breadcrumbs={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Settings' },
      ]}
    >
      <Tabs defaultValue="clinic-profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="clinic-profile" className="gap-2">
            <Building2 className="w-4 h-4" />
            Clinic Profile
          </TabsTrigger>
          <TabsTrigger value="specialties" className="gap-2">
            <Stethoscope className="w-4 h-4" />
            Specialties
          </TabsTrigger>
          <TabsTrigger value="printing" className="gap-2">
            <Printer className="w-4 h-4" />
            Printing
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <BellRing className="w-4 h-4" />
            Notifications
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
