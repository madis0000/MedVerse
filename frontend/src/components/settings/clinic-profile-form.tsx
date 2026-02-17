import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings, useUpdateSettings } from '@/api/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormSkeleton } from '@/components/ui/loading-skeleton';
import { Save, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const DAYS_OF_WEEK = [
  { value: 'MON', labelKey: 'common.days.monday' },
  { value: 'TUE', labelKey: 'common.days.tuesday' },
  { value: 'WED', labelKey: 'common.days.wednesday' },
  { value: 'THU', labelKey: 'common.days.thursday' },
  { value: 'FRI', labelKey: 'common.days.friday' },
  { value: 'SAT', labelKey: 'common.days.saturday' },
  { value: 'SUN', labelKey: 'common.days.sunday' },
];

interface ClinicSettings {
  clinic_name: string;
  clinic_address: string;
  clinic_city: string;
  clinic_state: string;
  clinic_zip: string;
  clinic_phone: string;
  clinic_email: string;
  working_hours_start: string;
  working_hours_end: string;
  working_days: string[];
  appointment_duration: number;
  appointment_buffer: number;
}

const DEFAULT_SETTINGS: ClinicSettings = {
  clinic_name: '',
  clinic_address: '',
  clinic_city: '',
  clinic_state: '',
  clinic_zip: '',
  clinic_phone: '',
  clinic_email: '',
  working_hours_start: '09:00',
  working_hours_end: '17:00',
  working_days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
  appointment_duration: 30,
  appointment_buffer: 5,
};

export function ClinicProfileForm() {
  const { t } = useTranslation();
  const { data, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [form, setForm] = useState<ClinicSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (data?.data) {
      setForm({
        clinic_name: data.data.clinic_name || '',
        clinic_address: data.data.clinic_address || '',
        clinic_city: data.data.clinic_city || '',
        clinic_state: data.data.clinic_state || '',
        clinic_zip: data.data.clinic_zip || '',
        clinic_phone: data.data.clinic_phone || '',
        clinic_email: data.data.clinic_email || '',
        working_hours_start: data.data.working_hours_start || '09:00',
        working_hours_end: data.data.working_hours_end || '17:00',
        working_days: data.data.working_days || ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        appointment_duration: data.data.appointment_duration || 30,
        appointment_buffer: data.data.appointment_buffer || 5,
      });
    }
  }, [data]);

  const handleChange = (field: keyof ClinicSettings, value: string | number | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDay = (day: string) => {
    setForm((prev) => {
      const days = prev.working_days.includes(day)
        ? prev.working_days.filter((d) => d !== day)
        : [...prev.working_days, day];
      return { ...prev, working_days: days };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings.mutateAsync(form);
      toast.success(t('settings.clinic.saved'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('common.errorSaving'));
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
            <Building2 className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">{t('settings.clinic.clinicInformation')}</CardTitle>
          </div>
          <CardDescription>
            {t('settings.clinic.clinicInformationDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="clinic_name">{t('settings.clinic.clinicName')}</Label>
              <Input
                id="clinic_name"
                value={form.clinic_name}
                onChange={(e) => handleChange('clinic_name', e.target.value)}
                placeholder={t('settings.clinic.enterClinicName')}
                className="mt-1.5"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="clinic_address">{t('settings.clinic.address')}</Label>
              <Input
                id="clinic_address"
                value={form.clinic_address}
                onChange={(e) => handleChange('clinic_address', e.target.value)}
                placeholder={t('settings.clinic.streetAddress')}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="clinic_city">{t('settings.clinic.city')}</Label>
              <Input
                id="clinic_city"
                value={form.clinic_city}
                onChange={(e) => handleChange('clinic_city', e.target.value)}
                placeholder={t('settings.clinic.city')}
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clinic_state">{t('settings.clinic.state')}</Label>
                <Input
                  id="clinic_state"
                  value={form.clinic_state}
                  onChange={(e) => handleChange('clinic_state', e.target.value)}
                  placeholder={t('settings.clinic.state')}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="clinic_zip">{t('settings.clinic.zipCode')}</Label>
                <Input
                  id="clinic_zip"
                  value={form.clinic_zip}
                  onChange={(e) => handleChange('clinic_zip', e.target.value)}
                  placeholder={t('settings.clinic.zip')}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="clinic_phone">{t('settings.clinic.phone')}</Label>
              <Input
                id="clinic_phone"
                type="tel"
                value={form.clinic_phone}
                onChange={(e) => handleChange('clinic_phone', e.target.value)}
                placeholder="(555) 123-4567"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="clinic_email">{t('settings.clinic.email')}</Label>
              <Input
                id="clinic_email"
                type="email"
                value={form.clinic_email}
                onChange={(e) => handleChange('clinic_email', e.target.value)}
                placeholder="clinic@example.com"
                className="mt-1.5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('settings.clinic.workingHours')}</CardTitle>
          <CardDescription>
            {t('settings.clinic.workingHoursDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="working_hours_start">{t('settings.clinic.openTime')}</Label>
              <Input
                id="working_hours_start"
                type="time"
                value={form.working_hours_start}
                onChange={(e) => handleChange('working_hours_start', e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="working_hours_end">{t('settings.clinic.closeTime')}</Label>
              <Input
                id="working_hours_end"
                type="time"
                value={form.working_hours_end}
                onChange={(e) => handleChange('working_hours_end', e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label>{t('settings.clinic.workingDays')}</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    form.working_days.includes(day.value)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {t(day.labelKey)}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('settings.clinic.appointmentSettings')}</CardTitle>
          <CardDescription>
            {t('settings.clinic.appointmentSettingsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="appointment_duration">{t('settings.clinic.appointmentDuration')}</Label>
              <Select
                value={String(form.appointment_duration)}
                onValueChange={(val) => handleChange('appointment_duration', Number(val))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder={t('settings.clinic.selectDuration')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">{t('common.minutes', { count: 15 })}</SelectItem>
                  <SelectItem value="20">{t('common.minutes', { count: 20 })}</SelectItem>
                  <SelectItem value="30">{t('common.minutes', { count: 30 })}</SelectItem>
                  <SelectItem value="45">{t('common.minutes', { count: 45 })}</SelectItem>
                  <SelectItem value="60">{t('common.minutes', { count: 60 })}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="appointment_buffer">{t('settings.clinic.bufferTime')}</Label>
              <Select
                value={String(form.appointment_buffer)}
                onValueChange={(val) => handleChange('appointment_buffer', Number(val))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder={t('settings.clinic.selectBuffer')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t('settings.clinic.noBuffer')}</SelectItem>
                  <SelectItem value="5">{t('common.minutes', { count: 5 })}</SelectItem>
                  <SelectItem value="10">{t('common.minutes', { count: 10 })}</SelectItem>
                  <SelectItem value="15">{t('common.minutes', { count: 15 })}</SelectItem>
                </SelectContent>
              </Select>
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
