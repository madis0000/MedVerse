import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  Eye,
  ClipboardList,
  ClipboardCheck,
  Settings2,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { TemplateSelector } from '@/components/consultations/template-selector';
import { QuickTextMenu } from '@/components/consultations/quick-text-menu';
import { SpecialtyFields } from '@/components/consultations/specialty-fields';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Consultation, SpecialtyField } from '@/types';

interface SOAPFormProps {
  consultation: Consultation;
  specialtyFields: SpecialtyField[];
  onUpdate: (updates: Partial<Consultation>) => void;
  readOnly?: boolean;
}

type SOAPField = 'subjective' | 'objective' | 'assessment' | 'plan';

export function SOAPForm({
  consultation,
  specialtyFields,
  onUpdate,
  readOnly,
}: SOAPFormProps) {
  const { t } = useTranslation();

  const SOAP_TABS: { value: SOAPField; label: string; icon: React.ReactNode; placeholder: string }[] = [
    {
      value: 'subjective',
      label: t('consultations.subjective'),
      icon: <User className="h-4 w-4" />,
      placeholder: t('consultations.subjectivePlaceholder'),
    },
    {
      value: 'objective',
      label: t('consultations.objective'),
      icon: <Eye className="h-4 w-4" />,
      placeholder: t('consultations.objectivePlaceholder'),
    },
    {
      value: 'assessment',
      label: t('consultations.assessment'),
      icon: <ClipboardList className="h-4 w-4" />,
      placeholder: t('consultations.assessmentPlaceholder'),
    },
    {
      value: 'plan',
      label: t('consultations.plan'),
      icon: <ClipboardCheck className="h-4 w-4" />,
      placeholder: t('consultations.planPlaceholder'),
    },
  ];

  const [activeTab, setActiveTab] = useState<string>('subjective');
  const [saving, setSaving] = useState<string | null>(null);
  const [values, setValues] = useState<Record<SOAPField, string>>({
    subjective: consultation.subjective ?? '',
    objective: consultation.objective ?? '',
    assessment: consultation.assessment ?? '',
    plan: consultation.plan ?? '',
  });
  const [customFields, setCustomFields] = useState<Record<string, unknown>>(
    consultation.customFields ?? {},
  );
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const hasExistingContent =
    !!values.subjective ||
    !!values.objective ||
    !!values.assessment ||
    !!values.plan;

  const handleFieldBlur = useCallback(
    async (field: SOAPField) => {
      const currentValue = values[field];
      const originalValue = consultation[field] ?? '';
      if (currentValue === originalValue) return;

      setSaving(field);
      try {
        await apiClient.patch(`/consultations/${consultation.id}`, {
          [field]: currentValue,
        });
        onUpdate({ [field]: currentValue });
      } catch {
        toast.error(t('consultations.saveFieldError', { field }));
      } finally {
        setSaving(null);
      }
    },
    [consultation, values, onUpdate, t],
  );

  const handleFieldChange = useCallback(
    (field: SOAPField, value: string) => {
      setValues((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleCustomFieldsChange = useCallback(
    async (newCustomFields: Record<string, unknown>) => {
      setCustomFields(newCustomFields);
      try {
        await apiClient.patch(`/consultations/${consultation.id}`, {
          customFields: newCustomFields,
        });
        onUpdate({ customFields: newCustomFields });
      } catch {
        toast.error(t('consultations.saveCustomFieldsError'));
      }
    },
    [consultation.id, onUpdate, t],
  );

  const handleTemplateApply = useCallback(
    (template: {
      subjective?: string;
      objective?: string;
      assessment?: string;
      plan?: string;
    }) => {
      const newValues = {
        subjective: template.subjective ?? values.subjective,
        objective: template.objective ?? values.objective,
        assessment: template.assessment ?? values.assessment,
        plan: template.plan ?? values.plan,
      };
      setValues(newValues);

      // Persist all template fields
      apiClient
        .patch(`/consultations/${consultation.id}`, {
          subjective: newValues.subjective,
          objective: newValues.objective,
          assessment: newValues.assessment,
          plan: newValues.plan,
        })
        .then(() => {
          onUpdate(newValues);
        })
        .catch(() => {
          toast.error(t('consultations.saveTemplateError'));
        });
    },
    [consultation.id, values, onUpdate, t],
  );

  const handleQuickTextInsert = useCallback(
    (text: string) => {
      const currentField = activeTab as SOAPField;
      if (!SOAP_TABS.some((tab) => tab.value === currentField)) return;

      const textarea = textareaRefs.current[currentField];
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentValue = values[currentField];
        const newValue =
          currentValue.substring(0, start) +
          text +
          currentValue.substring(end);
        handleFieldChange(currentField, newValue);

        // Restore cursor position after the inserted text
        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(start + text.length, start + text.length);
        });
      } else {
        // Fallback: append to end
        handleFieldChange(
          currentField,
          values[currentField] + (values[currentField] ? '\n' : '') + text,
        );
      }
    },
    [activeTab, values, handleFieldChange],
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-2 flex-wrap">
          <TemplateSelector
            specialtyId={consultation.specialtyId}
            hasExistingContent={hasExistingContent}
            onApply={handleTemplateApply}
            disabled={readOnly}
          />
          <QuickTextMenu
            onInsert={handleQuickTextInsert}
            disabled={readOnly}
          />
        </div>
      )}

      {/* SOAP Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 p-1">
          {SOAP_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="gap-1.5 data-[state=active]:shadow-sm"
            >
              {tab.icon}
              {tab.label}
              {saving === tab.value && (
                <span className="ml-1 h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
              )}
              {values[tab.value] && saving !== tab.value && (
                <span className="ml-1 h-1.5 w-1.5 rounded-full bg-green-500" />
              )}
            </TabsTrigger>
          ))}
          {specialtyFields.length > 0 && (
            <TabsTrigger
              value="custom"
              className="gap-1.5 data-[state=active]:shadow-sm"
            >
              <Settings2 className="h-4 w-4" />
              {t('consultations.specialtyFields.customFields')}
              {Object.keys(customFields).length > 0 && (
                <span className="ml-1 h-1.5 w-1.5 rounded-full bg-green-500" />
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {SOAP_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{tab.label}</Label>
                {saving === tab.value && (
                  <span className="text-xs text-muted-foreground">{t('consultations.saving')}</span>
                )}
              </div>
              <Textarea
                ref={(el) => {
                  textareaRefs.current[tab.value] = el;
                }}
                value={values[tab.value]}
                onChange={(e) => handleFieldChange(tab.value, e.target.value)}
                onBlur={() => handleFieldBlur(tab.value)}
                placeholder={tab.placeholder}
                disabled={readOnly}
                rows={12}
                className={cn(
                  'resize-y font-mono text-sm leading-relaxed',
                  readOnly && 'bg-muted/50',
                )}
              />
            </div>
          </TabsContent>
        ))}

        {specialtyFields.length > 0 && (
          <TabsContent value="custom" className="mt-4">
            <SpecialtyFields
              fields={specialtyFields}
              values={customFields}
              onChange={handleCustomFieldsChange}
              readOnly={readOnly}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
