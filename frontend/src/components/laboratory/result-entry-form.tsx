import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AbnormalBadge } from '@/components/laboratory/abnormal-badge';
import { cn } from '@/lib/utils';
import { useEnterLabResult } from '@/api/laboratory';
import type { LabOrder, LabOrderItem } from '@/types';

interface ResultEntryFormProps {
  order: LabOrder;
  onComplete?: () => void;
}

interface ResultEntry {
  labOrderItemId: string;
  value: string;
  notes: string;
}

export function ResultEntryForm({ order, onComplete }: ResultEntryFormProps) {
  const { t } = useTranslation();
  const enterResult = useEnterLabResult();
  const items: LabOrderItem[] = order.items ?? [];

  const [entries, setEntries] = useState<Record<string, ResultEntry>>(() => {
    const initial: Record<string, ResultEntry> = {};
    items.forEach((item) => {
      initial[item.id] = {
        labOrderItemId: item.id,
        value: item.result?.value ?? '',
        notes: item.result?.notes ?? '',
      };
    });
    return initial;
  });

  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    const done = new Set<string>();
    items.forEach((item) => {
      if (item.result) done.add(item.id);
    });
    return done;
  });

  function updateEntry(itemId: string, field: 'value' | 'notes', fieldValue: string) {
    setEntries((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: fieldValue },
    }));
  }

  async function handleSubmitResult(item: LabOrderItem) {
    const entry = entries[item.id];
    if (!entry?.value.trim()) {
      toast.error(t('laboratory.results.enterValueError', 'Enter a value before submitting'));
      return;
    }

    setSubmittingId(item.id);
    try {
      await enterResult.mutateAsync({
        labOrderItemId: item.id,
        value: entry.value,
        notes: entry.notes || undefined,
      });
      setCompletedIds((prev) => new Set(prev).add(item.id));
      toast.success(t('laboratory.results.resultSavedFor', 'Result saved for {{testName}}', { testName: item.testName }));
    } catch {
      toast.error(t('laboratory.results.resultFailedFor', 'Failed to save result for {{testName}}', { testName: item.testName }));
    } finally {
      setSubmittingId(null);
    }
  }

  async function handleSubmitAll() {
    const pending = items.filter((item) => !completedIds.has(item.id) && entries[item.id]?.value.trim());
    if (pending.length === 0) {
      toast.info(t('laboratory.results.noNewResults', 'No new results to submit'));
      return;
    }

    for (const item of pending) {
      await handleSubmitResult(item);
    }
    onComplete?.();
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">{t('laboratory.results.noTestItems', 'No test items in this order')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">
            {t('laboratory.results.orderFor', 'Order for')} {order.patient?.firstName} {order.patient?.lastName}
          </h3>
          <p className="text-xs text-muted-foreground">
            {items.length} {t('laboratory.results.tests', 'test(s)')} &middot; {completedIds.size} {t('laboratory.results.completed', 'completed')}
          </p>
        </div>
        <Button size="sm" onClick={handleSubmitAll}>
          <Save className="h-4 w-4 mr-1" />
          {t('laboratory.results.saveAll', 'Save All')}
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const entry = entries[item.id];
          const isCompleted = completedIds.has(item.id);
          const numericValue = parseFloat(entry?.value ?? '');
          const hasValue = !isNaN(numericValue);

          return (
            <Card
              key={item.id}
              className={cn(isCompleted && 'border-green-300 dark:border-green-700 bg-green-50/30 dark:bg-green-950/10')}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium">{item.testName}</h4>
                      {isCompleted && (
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.result?.unit && `${t('laboratory.results.unit')}: ${item.result.unit}`}
                      {item.result?.normalRangeMin !== undefined &&
                        item.result?.normalRangeMax !== undefined &&
                        ` | ${t('laboratory.results.normal')}: ${item.result.normalRangeMin} - ${item.result.normalRangeMax}`}
                      {item.result?.normalRangeText && ` | ${item.result.normalRangeText}`}
                    </p>
                  </div>
                  {hasValue && item.result && (
                    <AbnormalBadge
                      value={numericValue}
                      normalRangeMin={item.result.normalRangeMin}
                      normalRangeMax={item.result.normalRangeMax}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <Label className="text-xs">{t('laboratory.results.value')}</Label>
                    <Input
                      value={entry?.value ?? ''}
                      onChange={(e) => updateEntry(item.id, 'value', e.target.value)}
                      placeholder={t('laboratory.results.enterResult', 'Enter result')}
                      className={cn(
                        hasValue &&
                          item.result?.normalRangeMin !== undefined &&
                          item.result?.normalRangeMax !== undefined &&
                          (numericValue < item.result.normalRangeMin || numericValue > item.result.normalRangeMax) &&
                          'border-red-400 focus-visible:ring-red-400',
                      )}
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <Label className="text-xs">{t('common.notes', 'Notes')}</Label>
                    <Input
                      value={entry?.notes ?? ''}
                      onChange={(e) => updateEntry(item.id, 'notes', e.target.value)}
                      placeholder={t('laboratory.results.optionalNotes', 'Optional notes')}
                    />
                  </div>

                  <div className="sm:col-span-1 flex items-end">
                    <Button
                      size="sm"
                      variant={isCompleted ? 'secondary' : 'default'}
                      className="w-full"
                      onClick={() => handleSubmitResult(item)}
                      disabled={submittingId === item.id || !entry?.value.trim()}
                    >
                      {submittingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isCompleted ? (
                        t('common.update', 'Update')
                      ) : (
                        t('common.save')
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
