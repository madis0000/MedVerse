import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { Plus, Trash2, Save } from 'lucide-react';

interface TemplateBuilderProps {
  specialtyId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function TemplateBuilder({ specialtyId, onClose, onSaved }: TemplateBuilderProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [fields, setFields] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error(t('consultations.templateBuilder.nameRequired')); return; }
    setSaving(true);
    try {
      await apiClient.post('/consultations/templates', {
        name,
        specialtyId,
        fields,
        isDefault: false,
      });
      toast.success(t('consultations.templateBuilder.saveSuccess'));
      onSaved();
      onClose();
    } catch {
      toast.error(t('consultations.templateBuilder.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 bg-card border rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">{t('consultations.templateBuilder.title')}</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('consultations.templateBuilder.templateName')}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-background border rounded-lg text-sm"
                placeholder={t('consultations.templateBuilder.templateNamePlaceholder')}
              />
            </div>

            {(['subjective', 'objective', 'assessment', 'plan'] as const).map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium mb-1 capitalize">{t(`consultations.${field}`)}</label>
                <textarea
                  value={fields[field]}
                  onChange={(e) => setFields({ ...fields, [field]: e.target.value })}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-sm min-h-[100px]"
                  placeholder={t('consultations.templateBuilder.defaultTemplatePlaceholder', { field: t(`consultations.${field}`) })}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-muted">{t('common.cancel')}</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? t('consultations.templateBuilder.saving') : t('consultations.templateBuilder.saveTemplate')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
