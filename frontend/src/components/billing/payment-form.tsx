import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { useRecordPayment } from '@/api/billing';
import type { PaymentMethod } from '@/types';

interface PaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  remainingBalance: number;
}

export function PaymentForm({ open, onOpenChange, invoiceId, remainingBalance }: PaymentFormProps) {
  const { t } = useTranslation();
  const recordPayment = useRecordPayment();

  const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
    { value: 'CASH', label: t('billing.paymentMethods.cash', 'Cash') },
    { value: 'CARD', label: t('billing.paymentMethods.card', 'Card') },
    { value: 'INSURANCE', label: t('billing.paymentMethods.insurance', 'Insurance') },
    { value: 'BANK_TRANSFER', label: t('billing.paymentMethods.bankTransfer', 'Bank Transfer') },
  ];

  const [amount, setAmount] = useState(remainingBalance);
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  function resetForm() {
    setAmount(remainingBalance);
    setMethod('CASH');
    setReference('');
    setNotes('');
  }

  async function handleSubmit() {
    if (amount <= 0) {
      toast.error(t('billing.paymentAmountError', 'Payment amount must be greater than zero'));
      return;
    }

    if (amount > remainingBalance) {
      toast.error(t('billing.paymentExceedsBalance', 'Amount exceeds remaining balance of {{balance}}', { balance: formatCurrency(remainingBalance) }));
      return;
    }

    try {
      await recordPayment.mutateAsync({
        invoiceId,
        amount,
        method,
        reference: reference || undefined,
        notes: notes || undefined,
      });
      toast.success(t('billing.paymentRecorded', 'Payment recorded successfully'));
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error(t('billing.paymentFailed', 'Failed to record payment'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('billing.recordPayment', 'Record Payment')}
          </DialogTitle>
          <DialogDescription>
            {t('billing.remainingBalance', 'Remaining balance')}: {formatCurrency(remainingBalance)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label>{t('billing.amount', 'Amount')}</Label>
            <Input
              type="number"
              min={0}
              max={remainingBalance}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            />
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => setAmount(remainingBalance)}
            >
              {t('billing.payFullBalance', 'Pay full balance')} ({formatCurrency(remainingBalance)})
            </button>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>{t('billing.paymentMethod', 'Payment Method')}</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((pm) => (
                  <SelectItem key={pm.value} value={pm.value}>
                    {pm.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reference Number */}
          <div className="space-y-2">
            <Label>{t('billing.referenceNumber', 'Reference Number')}</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={t('billing.referencePlaceholder', 'Transaction or check number')}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{t('common.notes', 'Notes')}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('billing.notesPlaceholder', 'Additional notes...')}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={recordPayment.isPending || amount <= 0}
          >
            {recordPayment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('billing.recordPayment', 'Record Payment')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
