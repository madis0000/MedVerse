import { useState, useEffect, useCallback } from 'react';
import { FileText, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  description?: string;
  specialtyId: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

interface TemplateSelectorProps {
  specialtyId: string;
  hasExistingContent: boolean;
  onApply: (template: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  }) => void;
  disabled?: boolean;
}

export function TemplateSelector({
  specialtyId,
  hasExistingContent,
  onApply,
  disabled,
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<Template | null>(null);

  const fetchTemplates = useCallback(async () => {
    if (!specialtyId) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get('/templates', {
        params: { specialtyId },
      });
      setTemplates(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [specialtyId]);

  useEffect(() => {
    if (open && templates.length === 0) {
      fetchTemplates();
    }
  }, [open, fetchTemplates, templates.length]);

  function handleSelectTemplate(template: Template) {
    setOpen(false);
    if (hasExistingContent) {
      setPendingTemplate(template);
      setConfirmOpen(true);
    } else {
      applyTemplate(template);
    }
  }

  function applyTemplate(template: Template) {
    onApply({
      subjective: template.subjective,
      objective: template.objective,
      assessment: template.assessment,
      plan: template.plan,
    });
    toast.success(`Template "${template.name}" applied`);
  }

  function handleConfirm() {
    if (pendingTemplate) {
      applyTemplate(pendingTemplate);
      setPendingTemplate(null);
    }
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="gap-1.5"
          >
            <FileText className="h-4 w-4" />
            Templates
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72 max-h-80 overflow-y-auto">
          <DropdownMenuLabel>SOAP Templates</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {loading && (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              Loading templates...
            </div>
          )}
          {!loading && templates.length === 0 && (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No templates available for this specialty.
            </div>
          )}
          {!loading &&
            templates.map((template) => (
              <DropdownMenuItem
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className="flex flex-col items-start gap-0.5 cursor-pointer"
              >
                <span className="font-medium text-sm">{template.name}</span>
                {template.description && (
                  <span className="text-xs text-muted-foreground line-clamp-2">
                    {template.description}
                  </span>
                )}
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setPendingTemplate(null);
        }}
        onConfirm={handleConfirm}
        title="Apply Template?"
        description="Applying this template will overwrite the current SOAP note content. This action cannot be undone."
        confirmText="Apply Template"
        cancelText="Cancel"
      />
    </>
  );
}
