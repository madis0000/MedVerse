import { useState } from 'react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { Plus, Trash2, Save } from 'lucide-react';

interface TemplateBuilderProps {
  specialtyId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function TemplateBuilder({ specialtyId, onClose, onSaved }: TemplateBuilderProps) {
  const [name, setName] = useState('');
  const [fields, setFields] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Template name is required'); return; }
    setSaving(true);
    try {
      await apiClient.post('/consultations/templates', {
        name,
        specialtyId,
        fields,
        isDefault: false,
      });
      toast.success('Template saved');
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 bg-card border rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Create Consultation Template</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Template Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-background border rounded-lg text-sm"
                placeholder="e.g., Routine Checkup"
              />
            </div>

            {(['subjective', 'objective', 'assessment', 'plan'] as const).map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium mb-1 capitalize">{field}</label>
                <textarea
                  value={fields[field]}
                  onChange={(e) => setFields({ ...fields, [field]: e.target.value })}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-sm min-h-[100px]"
                  placeholder={`Default ${field} template text...`}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-muted">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
