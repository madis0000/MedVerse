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
import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

interface SessionExpiredDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SessionExpiredDialog({ open, onClose }: SessionExpiredDialogProps) {
  const { t } = useTranslation();
  const logout = useAuthStore((s) => s.logout);

  const handleLogin = () => {
    logout();
    onClose();
    window.location.href = '/login';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>{t('security.sessionExpired')}</DialogTitle>
              <DialogDescription>{t('security.sessionExpiredMessage')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleLogin} className="w-full">
            {t('security.loginAgain')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
