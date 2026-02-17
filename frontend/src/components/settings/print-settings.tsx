import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings, useUpdateSettings } from '@/api/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormSkeleton } from '@/components/ui/loading-skeleton';
import { Save, Printer } from 'lucide-react';
import { toast } from 'sonner';

const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'AED', label: 'AED - UAE Dirham' },
  { value: 'SAR', label: 'SAR - Saudi Riyal' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
];

interface PrintSettingsData {
  prescription_header: string;
  prescription_footer: string;
  invoice_footer: string;
  tax_rate: number;
  currency: string;
  invoice_prefix: string;
}

const DEFAULT_PRINT_SETTINGS: PrintSettingsData = {
  prescription_header: '',
  prescription_footer: '',
  invoice_footer: '',
  tax_rate: 0,
  currency: 'USD',
  invoice_prefix: 'INV-',
};

export function PrintSettings() {
  const { t } = useTranslation();
  const { data, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [form, setForm] = useState<PrintSettingsData>(DEFAULT_PRINT_SETTINGS);

  useEffect(() => {
    if (data?.data) {
      setForm({
        prescription_header: data.data.prescription_header || '',
        prescription_footer: data.data.prescription_footer || '',
        invoice_footer: data.data.invoice_footer || '',
        tax_rate: data.data.tax_rate ?? 0,
        currency: data.data.currency || 'USD',
        invoice_prefix: data.data.invoice_prefix || 'INV-',
      });
    }
  }, [data]);

  const handleChange = (field: keyof PrintSettingsData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings.mutateAsync(form);
      toast.success(t('settings.printing.saved'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('settings.printing.saveFailed'));
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
            <Printer className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">{t('settings.printing.prescriptionLayout')}</CardTitle>
          </div>
          <CardDescription>
            {t('settings.printing.prescriptionLayoutDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="prescription_header">{t('settings.printing.prescriptionHeader')}</Label>
            <Textarea
              id="prescription_header"
              value={form.prescription_header}
              onChange={(e) => handleChange('prescription_header', e.target.value)}
              placeholder={t('settings.printing.prescriptionHeaderPlaceholder')}
              rows={3}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="prescription_footer">{t('settings.printing.prescriptionFooter')}</Label>
            <Textarea
              id="prescription_footer"
              value={form.prescription_footer}
              onChange={(e) => handleChange('prescription_footer', e.target.value)}
              placeholder={t('settings.printing.prescriptionFooterPlaceholder')}
              rows={3}
              className="mt-1.5"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('settings.printing.invoiceSettings')}</CardTitle>
          <CardDescription>
            {t('settings.printing.invoiceSettingsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="invoice_footer">{t('settings.printing.invoiceFooter')}</Label>
            <Textarea
              id="invoice_footer"
              value={form.invoice_footer}
              onChange={(e) => handleChange('invoice_footer', e.target.value)}
              placeholder={t('settings.printing.invoiceFooterPlaceholder')}
              rows={3}
              className="mt-1.5"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="tax_rate">{t('settings.printing.taxRate')}</Label>
              <Input
                id="tax_rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.tax_rate}
                onChange={(e) => handleChange('tax_rate', parseFloat(e.target.value) || 0)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="currency">{t('settings.printing.currency')}</Label>
              <Select
                value={form.currency}
                onValueChange={(val) => handleChange('currency', val)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder={t('settings.printing.selectCurrency')} />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="invoice_prefix">{t('settings.printing.invoicePrefix')}</Label>
              <Input
                id="invoice_prefix"
                value={form.invoice_prefix}
                onChange={(e) => handleChange('invoice_prefix', e.target.value)}
                placeholder="INV-"
                className="mt-1.5"
              />
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
