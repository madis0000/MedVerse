import { useState, useEffect } from 'react';
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
  { value: 'MON', label: 'Monday' },
  { value: 'TUE', label: 'Tuesday' },
  { value: 'WED', label: 'Wednesday' },
  { value: 'THU', label: 'Thursday' },
  { value: 'FRI', label: 'Friday' },
  { value: 'SAT', label: 'Saturday' },
  { value: 'SUN', label: 'Sunday' },
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
      toast.success('Clinic profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
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
            <CardTitle className="text-lg">Clinic Information</CardTitle>
          </div>
          <CardDescription>
            Basic information about your clinic that appears on documents and invoices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="clinic_name">Clinic Name</Label>
              <Input
                id="clinic_name"
                value={form.clinic_name}
                onChange={(e) => handleChange('clinic_name', e.target.value)}
                placeholder="Enter clinic name"
                className="mt-1.5"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="clinic_address">Address</Label>
              <Input
                id="clinic_address"
                value={form.clinic_address}
                onChange={(e) => handleChange('clinic_address', e.target.value)}
                placeholder="Street address"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="clinic_city">City</Label>
              <Input
                id="clinic_city"
                value={form.clinic_city}
                onChange={(e) => handleChange('clinic_city', e.target.value)}
                placeholder="City"
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clinic_state">State</Label>
                <Input
                  id="clinic_state"
                  value={form.clinic_state}
                  onChange={(e) => handleChange('clinic_state', e.target.value)}
                  placeholder="State"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="clinic_zip">ZIP Code</Label>
                <Input
                  id="clinic_zip"
                  value={form.clinic_zip}
                  onChange={(e) => handleChange('clinic_zip', e.target.value)}
                  placeholder="ZIP"
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="clinic_phone">Phone</Label>
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
              <Label htmlFor="clinic_email">Email</Label>
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
          <CardTitle className="text-lg">Working Hours</CardTitle>
          <CardDescription>
            Set your clinic operating hours and working days.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="working_hours_start">Start Time</Label>
              <Input
                id="working_hours_start"
                type="time"
                value={form.working_hours_start}
                onChange={(e) => handleChange('working_hours_start', e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="working_hours_end">End Time</Label>
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
            <Label>Working Days</Label>
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
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Appointment Settings</CardTitle>
          <CardDescription>
            Configure default appointment duration and buffer time between appointments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="appointment_duration">Default Duration (minutes)</Label>
              <Select
                value={String(form.appointment_duration)}
                onValueChange={(val) => handleChange('appointment_duration', Number(val))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="20">20 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="appointment_buffer">Buffer Time (minutes)</Label>
              <Select
                value={String(form.appointment_buffer)}
                onValueChange={(val) => handleChange('appointment_buffer', Number(val))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select buffer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No buffer</SelectItem>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={updateSettings.isPending}>
          <Save className="w-4 h-4 mr-2" />
          {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
