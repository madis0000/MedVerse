import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings, useUpdateSettings } from '@/api/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { FormSkeleton } from '@/components/ui/loading-skeleton';
import { Save, BellRing, Mail, MessageSquare, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationSettingsData {
  enable_email_reminders: boolean;
  enable_sms_reminders: boolean;
  reminder_hours_before: number;
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsData = {
  enable_email_reminders: false,
  enable_sms_reminders: false,
  reminder_hours_before: 24,
};

export function NotificationSettings() {
  const { t } = useTranslation();
  const { data, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [form, setForm] = useState<NotificationSettingsData>(DEFAULT_NOTIFICATION_SETTINGS);

  useEffect(() => {
    if (data?.data) {
      setForm({
        enable_email_reminders: data.data.enable_email_reminders ?? false,
        enable_sms_reminders: data.data.enable_sms_reminders ?? false,
        reminder_hours_before: data.data.reminder_hours_before ?? 24,
      });
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings.mutateAsync(form);
      toast.success(t('settings.notifications.saved'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('settings.notifications.saveFailed'));
    }
  };

  if (isLoading) {
    return <FormSkeleton />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">{t('settings.notifications.appointmentReminders')}</CardTitle>
          </div>
          <CardDescription>
            {t('settings.notifications.appointmentRemindersDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{t('settings.notifications.emailReminders')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('settings.notifications.emailRemindersDescription')}
                </p>
              </div>
            </div>
            <Switch
              checked={form.enable_email_reminders}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, enable_email_reminders: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{t('settings.notifications.smsReminders')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('settings.notifications.smsRemindersDescription')}
                </p>
              </div>
            </div>
            <Switch
              checked={form.enable_sms_reminders}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, enable_sms_reminders: checked }))
              }
            />
          </div>

          <div className="p-4 rounded-lg border">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{t('settings.notifications.reminderTiming')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('settings.notifications.reminderTimingDescription')}
                </p>
              </div>
            </div>
            <div className="ml-13">
              <Label htmlFor="reminder_hours_before">{t('settings.notifications.hoursBeforeAppointment')}</Label>
              <Input
                id="reminder_hours_before"
                type="number"
                min="1"
                max="168"
                value={form.reminder_hours_before}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    reminder_hours_before: parseInt(e.target.value) || 24,
                  }))
                }
                className="mt-1.5 max-w-xs"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('settings.notifications.commonValues')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={updateSettings.isPending}>
          <Save className="w-4 h-4 mr-2" />
          {updateSettings.isPending ? t('common.saving') : t('common.saveChanges')}
        </Button>
      </div>
    </form>
  );
}
