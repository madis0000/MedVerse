import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ShieldQuestion } from 'lucide-react';

interface AccessJustificationDialogProps {
  open: boolean;
  onSubmit: (justification: string) => void;
  onCancel: () => void;
  patientName?: string;
}

export function AccessJustificationDialog({
  open,
  onSubmit,
  onCancel,
  patientName,
}: AccessJustificationDialogProps) {
  const { t } = useTranslation();
  const [justification, setJustification] = useState('');

  const handleSubmit = () => {
    if (justification.trim()) {
      onSubmit(justification.trim());
      setJustification('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <ShieldQuestion className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <DialogTitle>{t('security.accessJustification')}</DialogTitle>
              <DialogDescription>
                {patientName
                  ? t('security.justificationRequiredFor', { name: patientName })
                  : t('security.justificationRequired')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-3">
          <Label htmlFor="justification">{t('security.reason')}</Label>
          <Textarea
            id="justification"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder={t('security.justificationPlaceholder')}
            rows={3}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!justification.trim()}>
            {t('security.confirmAccess')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
