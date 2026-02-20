import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Save,
  Printer,
  Plus,
  X,
  ShieldCheck,
  AlertTriangle,
  Phone,
  Users,
  Brain,
  Home,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

interface SafetyPlanProps {
  consultationId: string;
  patientId: string;
  readOnly?: boolean;
}

interface ContactEntry {
  name: string;
  phone: string;
  address?: string;
}

interface SafetyPlanData {
  warningSigns: string[];
  copingStrategies: string[];
  distractionContacts: ContactEntry[];
  helpContacts: ContactEntry[];
  professionalContacts: ContactEntry[];
  environmentSafety: string;
  isActive: boolean;
  lastUpdated?: string;
}

const EMPTY_PLAN: SafetyPlanData = {
  warningSigns: [''],
  copingStrategies: [''],
  distractionContacts: [{ name: '', phone: '' }],
  helpContacts: [{ name: '', phone: '' }],
  professionalContacts: [{ name: '', phone: '', address: '' }],
  environmentSafety: '',
  isActive: false,
};

export function SafetyPlan({
  consultationId,
  patientId,
  readOnly = false,
}: SafetyPlanProps) {
  const { t } = useTranslation();
  const [plan, setPlan] = useState<SafetyPlanData>(EMPTY_PLAN);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPlan = useCallback(async () => {
    try {
      const { data } = await apiClient.get(`/consultations/${consultationId}`);
      const existing = data?.customFields?.psychiatry?.safetyPlan;
      if (existing) {
        setPlan({
          ...EMPTY_PLAN,
          ...existing,
          warningSigns: existing.warningSigns?.length
            ? existing.warningSigns
            : [''],
          copingStrategies: existing.copingStrategies?.length
            ? existing.copingStrategies
            : [''],
          distractionContacts: existing.distractionContacts?.length
            ? existing.distractionContacts
            : [{ name: '', phone: '' }],
          helpContacts: existing.helpContacts?.length
            ? existing.helpContacts
            : [{ name: '', phone: '' }],
          professionalContacts: existing.professionalContacts?.length
            ? existing.professionalContacts
            : [{ name: '', phone: '', address: '' }],
        });
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, [consultationId]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      // Filter out empty entries before saving
      const cleanPlan: SafetyPlanData = {
        ...plan,
        warningSigns: plan.warningSigns.filter((s) => s.trim()),
        copingStrategies: plan.copingStrategies.filter((s) => s.trim()),
        distractionContacts: plan.distractionContacts.filter(
          (c) => c.name.trim() || c.phone.trim(),
        ),
        helpContacts: plan.helpContacts.filter(
          (c) => c.name.trim() || c.phone.trim(),
        ),
        professionalContacts: plan.professionalContacts.filter(
          (c) => c.name.trim() || c.phone.trim(),
        ),
        isActive: true,
        lastUpdated: new Date().toISOString(),
      };

      await apiClient.patch(`/consultations/${consultationId}`, {
        customFields: {
          psychiatry: {
            safetyPlan: cleanPlan,
          },
        },
      });
      setPlan(cleanPlan);
      toast.success(t('specialties.psychiatry.safetyPlanSaved'));
    } catch {
      toast.error(t('specialties.psychiatry.safetyPlanSaveError'));
    } finally {
      setSaving(false);
    }
  }, [consultationId, plan, t]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // List helpers
  const addListItem = useCallback(
    (field: 'warningSigns' | 'copingStrategies') => {
      setPlan((prev) => ({ ...prev, [field]: [...prev[field], ''] }));
    },
    [],
  );

  const updateListItem = useCallback(
    (field: 'warningSigns' | 'copingStrategies', index: number, value: string) => {
      setPlan((prev) => {
        const items = [...prev[field]];
        items[index] = value;
        return { ...prev, [field]: items };
      });
    },
    [],
  );

  const removeListItem = useCallback(
    (field: 'warningSigns' | 'copingStrategies', index: number) => {
      setPlan((prev) => {
        const items = prev[field].filter((_, i) => i !== index);
        return { ...prev, [field]: items.length ? items : [''] };
      });
    },
    [],
  );

  // Contact helpers
  const addContact = useCallback(
    (field: 'distractionContacts' | 'helpContacts' | 'professionalContacts') => {
      const template: ContactEntry =
        field === 'professionalContacts'
          ? { name: '', phone: '', address: '' }
          : { name: '', phone: '' };
      setPlan((prev) => ({
        ...prev,
        [field]: [...prev[field], template],
      }));
    },
    [],
  );

  const updateContact = useCallback(
    (
      field: 'distractionContacts' | 'helpContacts' | 'professionalContacts',
      index: number,
      key: keyof ContactEntry,
      value: string,
    ) => {
      setPlan((prev) => {
        const contacts = [...prev[field]];
        contacts[index] = { ...contacts[index], [key]: value };
        return { ...prev, [field]: contacts };
      });
    },
    [],
  );

  const removeContact = useCallback(
    (
      field: 'distractionContacts' | 'helpContacts' | 'professionalContacts',
      index: number,
    ) => {
      setPlan((prev) => {
        const contacts = prev[field].filter((_, i) => i !== index);
        const template: ContactEntry =
          field === 'professionalContacts'
            ? { name: '', phone: '', address: '' }
            : { name: '', phone: '' };
        return {
          ...prev,
          [field]: contacts.length ? contacts : [template],
        };
      });
    },
    [],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header with status and actions */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">
            {t('specialties.psychiatry.safetyPlanTitle')}
          </h3>
          {plan.isActive && (
            <Badge className="bg-green-100 text-green-700">
              {t('specialties.psychiatry.activePlan')}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            {t('specialties.psychiatry.print')}
          </Button>
          {!readOnly && (
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {t('specialties.psychiatry.savePlan')}
            </Button>
          )}
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block">
        <h2 className="text-center text-xl font-bold">
          {t('specialties.psychiatry.safetyPlanTitle')}
        </h2>
        <p className="text-center text-sm text-muted-foreground">
          Stanley &amp; Brown Safety Planning Intervention
        </p>
      </div>

      {/* Step 1: Warning Signs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            {t('specialties.psychiatry.step1WarningSigns')}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {t('specialties.psychiatry.step1Description')}
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {plan.warningSigns.map((sign, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{idx + 1}.</span>
              <Input
                value={sign}
                onChange={(e) =>
                  updateListItem('warningSigns', idx, e.target.value)
                }
                placeholder={t('specialties.psychiatry.warningSignPlaceholder')}
                disabled={readOnly}
                className="flex-1"
              />
              {!readOnly && plan.warningSigns.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeListItem('warningSigns', idx)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {!readOnly && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => addListItem('warningSigns')}
            >
              <Plus className="mr-1 h-3 w-3" />
              {t('specialties.psychiatry.addItem')}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Internal Coping Strategies */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 text-blue-500" />
            {t('specialties.psychiatry.step2CopingStrategies')}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {t('specialties.psychiatry.step2Description')}
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {plan.copingStrategies.map((strategy, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{idx + 1}.</span>
              <Input
                value={strategy}
                onChange={(e) =>
                  updateListItem('copingStrategies', idx, e.target.value)
                }
                placeholder={t(
                  'specialties.psychiatry.copingStrategyPlaceholder',
                )}
                disabled={readOnly}
                className="flex-1"
              />
              {!readOnly && plan.copingStrategies.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeListItem('copingStrategies', idx)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {!readOnly && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => addListItem('copingStrategies')}
            >
              <Plus className="mr-1 h-3 w-3" />
              {t('specialties.psychiatry.addItem')}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Step 3: People and Social Settings for Distraction */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-green-500" />
            {t('specialties.psychiatry.step3Distractions')}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {t('specialties.psychiatry.step3Description')}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {plan.distractionContacts.map((contact, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="mt-2.5 text-xs text-muted-foreground">
                {idx + 1}.
              </span>
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                <Input
                  value={contact.name}
                  onChange={(e) =>
                    updateContact(
                      'distractionContacts',
                      idx,
                      'name',
                      e.target.value,
                    )
                  }
                  placeholder={t('specialties.psychiatry.namePlaceholder')}
                  disabled={readOnly}
                />
                <Input
                  value={contact.phone}
                  onChange={(e) =>
                    updateContact(
                      'distractionContacts',
                      idx,
                      'phone',
                      e.target.value,
                    )
                  }
                  placeholder={t('specialties.psychiatry.phonePlaceholder')}
                  disabled={readOnly}
                />
              </div>
              {!readOnly && plan.distractionContacts.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-1 h-8 w-8 shrink-0"
                  onClick={() => removeContact('distractionContacts', idx)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {!readOnly && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => addContact('distractionContacts')}
            >
              <Plus className="mr-1 h-3 w-3" />
              {t('specialties.psychiatry.addContact')}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Step 4: People to Ask for Help */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4 text-purple-500" />
            {t('specialties.psychiatry.step4HelpContacts')}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {t('specialties.psychiatry.step4Description')}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {plan.helpContacts.map((contact, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="mt-2.5 text-xs text-muted-foreground">
                {idx + 1}.
              </span>
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                <Input
                  value={contact.name}
                  onChange={(e) =>
                    updateContact('helpContacts', idx, 'name', e.target.value)
                  }
                  placeholder={t('specialties.psychiatry.namePlaceholder')}
                  disabled={readOnly}
                />
                <Input
                  value={contact.phone}
                  onChange={(e) =>
                    updateContact('helpContacts', idx, 'phone', e.target.value)
                  }
                  placeholder={t('specialties.psychiatry.phonePlaceholder')}
                  disabled={readOnly}
                />
              </div>
              {!readOnly && plan.helpContacts.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-1 h-8 w-8 shrink-0"
                  onClick={() => removeContact('helpContacts', idx)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {!readOnly && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => addContact('helpContacts')}
            >
              <Plus className="mr-1 h-3 w-3" />
              {t('specialties.psychiatry.addContact')}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Step 5: Professionals and Agencies */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-red-500" />
            {t('specialties.psychiatry.step5Professionals')}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {t('specialties.psychiatry.step5Description')}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {plan.professionalContacts.map((contact, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="mt-2.5 text-xs text-muted-foreground">
                {idx + 1}.
              </span>
              <div className="grid flex-1 gap-2 sm:grid-cols-3">
                <Input
                  value={contact.name}
                  onChange={(e) =>
                    updateContact(
                      'professionalContacts',
                      idx,
                      'name',
                      e.target.value,
                    )
                  }
                  placeholder={t('specialties.psychiatry.namePlaceholder')}
                  disabled={readOnly}
                />
                <Input
                  value={contact.phone}
                  onChange={(e) =>
                    updateContact(
                      'professionalContacts',
                      idx,
                      'phone',
                      e.target.value,
                    )
                  }
                  placeholder={t('specialties.psychiatry.phonePlaceholder')}
                  disabled={readOnly}
                />
                <Input
                  value={contact.address || ''}
                  onChange={(e) =>
                    updateContact(
                      'professionalContacts',
                      idx,
                      'address',
                      e.target.value,
                    )
                  }
                  placeholder={t('specialties.psychiatry.addressPlaceholder')}
                  disabled={readOnly}
                />
              </div>
              {!readOnly && plan.professionalContacts.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-1 h-8 w-8 shrink-0"
                  onClick={() => removeContact('professionalContacts', idx)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {!readOnly && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => addContact('professionalContacts')}
            >
              <Plus className="mr-1 h-3 w-3" />
              {t('specialties.psychiatry.addContact')}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Step 6: Making the Environment Safe */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Home className="h-4 w-4 text-teal-500" />
            {t('specialties.psychiatry.step6EnvironmentSafety')}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {t('specialties.psychiatry.step6Description')}
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={plan.environmentSafety}
            onChange={(e) =>
              setPlan((prev) => ({
                ...prev,
                environmentSafety: e.target.value,
              }))
            }
            placeholder={t(
              'specialties.psychiatry.environmentSafetyPlaceholder',
            )}
            disabled={readOnly}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Bottom save button (mobile convenience) */}
      {!readOnly && (
        <div className="flex justify-end print:hidden">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {t('specialties.psychiatry.savePlan')}
          </Button>
        </div>
      )}
    </div>
  );
}
