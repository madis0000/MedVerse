import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Loader2, FlaskConical } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useCreateLabOrder, useLabTests } from '@/api/laboratory';
import apiClient from '@/lib/api-client';
import type { Patient, LabPriority } from '@/types';

interface LabTest {
  id: string;
  name: string;
  category: string;
  unit?: string;
  normalRangeMin?: number;
  normalRangeMax?: number;
}

interface LabOrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LabOrderForm({ open, onOpenChange }: LabOrderFormProps) {
  const { t } = useTranslation();
  const createLabOrder = useCreateLabOrder();
  const { data: testsData } = useLabTests();
  const labTests: LabTest[] = testsData?.data ?? testsData ?? [];

  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);

  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [priority, setPriority] = useState<LabPriority>('ROUTINE');
  const [orderNotes, setOrderNotes] = useState('');

  // Group tests by category
  const testsByCategory = labTests.reduce<Record<string, LabTest[]>>((acc, test) => {
    const cat = test.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(test);
    return acc;
  }, {});

  const searchPatients = useCallback(async (q: string) => {
    setPatientQuery(q);
    if (q.length < 2) {
      setPatientResults([]);
      return;
    }
    setPatientSearchLoading(true);
    try {
      const { data } = await apiClient.get('/patients', { params: { search: q, limit: 10 } });
      setPatientResults(data.data ?? data ?? []);
    } catch {
      setPatientResults([]);
    } finally {
      setPatientSearchLoading(false);
    }
  }, []);

  function selectPatient(patient: Patient) {
    setSelectedPatient(patient);
    setPatientQuery(`${patient.firstName} ${patient.lastName}`);
    setPatientResults([]);
  }

  function toggleTest(testId: string) {
    setSelectedTests((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId],
    );
  }

  function resetForm() {
    setPatientQuery('');
    setPatientResults([]);
    setSelectedPatient(null);
    setSelectedTests([]);
    setPriority('ROUTINE');
    setOrderNotes('');
  }

  async function handleSubmit() {
    if (!selectedPatient) {
      toast.error(t('laboratory.orderForm.selectPatientError', 'Select a patient'));
      return;
    }
    if (selectedTests.length === 0) {
      toast.error(t('laboratory.orderForm.selectTestError', 'Select at least one lab test'));
      return;
    }

    try {
      await createLabOrder.mutateAsync({
        patientId: selectedPatient.id,
        priority,
        notes: orderNotes || undefined,
        testIds: selectedTests,
      });
      toast.success(t('laboratory.orderForm.orderCreated', 'Lab order created successfully'));
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error(t('laboratory.orderForm.orderFailed', 'Failed to create lab order'));
    }
  }

  const priorityColors: Record<LabPriority, string> = {
    ROUTINE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    URGENT: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    STAT: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  const priorityLabels: Record<LabPriority, string> = {
    ROUTINE: t('laboratory.priority.routine', 'ROUTINE'),
    URGENT: t('laboratory.priority.urgent', 'URGENT'),
    STAT: t('laboratory.priority.stat', 'STAT'),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            {t('laboratory.orderForm.createLabOrder', 'Create Lab Order')}
          </DialogTitle>
          <DialogDescription>
            {t('laboratory.orderForm.description', 'Search for a patient, select lab tests, and set the priority.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Patient Search */}
          <div className="space-y-2">
            <Label>{t('common.patient', 'Patient')}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={patientQuery}
                onChange={(e) => searchPatients(e.target.value)}
                placeholder={t('laboratory.orderForm.searchPatientPlaceholder', 'Search patient by name or MRN...')}
                className="pl-9"
              />
              {patientSearchLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {patientResults.length > 0 && (
                <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-lg max-h-48 overflow-y-auto">
                  {patientResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="flex w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                      onClick={() => selectPatient(p)}
                    >
                      <div>
                        <p className="font-medium">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-muted-foreground">{t('common.mrn', 'MRN')}: {p.mrn}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedPatient && (
              <div className="p-2 rounded-md bg-muted/50 text-sm">
                <span className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</span>
                <span className="text-muted-foreground ml-2">{t('common.mrn', 'MRN')}: {selectedPatient.mrn}</span>
              </div>
            )}
          </div>

          {/* Lab Tests Selection */}
          <div className="space-y-2">
            <Label>{t('laboratory.orderForm.labTests', 'Lab Tests')} ({selectedTests.length} {t('laboratory.orderForm.selected', 'selected')})</Label>
            <div className="rounded-lg border max-h-56 overflow-y-auto">
              {Object.entries(testsByCategory).map(([category, tests]) => (
                <div key={category}>
                  <div className="px-3 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0">
                    {category}
                  </div>
                  {tests.map((test) => {
                    const isSelected = selectedTests.includes(test.id);
                    return (
                      <button
                        key={test.id}
                        type="button"
                        className={cn(
                          'flex items-center justify-between w-full px-3 py-2 text-sm text-left hover:bg-accent transition-colors',
                          isSelected && 'bg-primary/5',
                        )}
                        onClick={() => toggleTest(test.id)}
                      >
                        <span className={cn(isSelected && 'font-medium')}>{test.name}</span>
                        {isSelected && (
                          <Badge className="bg-primary/10 text-primary text-xs">{t('laboratory.orderForm.selectedBadge', 'Selected')}</Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
              {labTests.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {t('laboratory.orderForm.noLabTests', 'No lab tests available')}
                </p>
              )}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>{t('laboratory.priority.label', 'Priority')}</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as LabPriority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['ROUTINE', 'URGENT', 'STAT'] as LabPriority[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    <span className="flex items-center gap-2">
                      <Badge className={cn('text-xs', priorityColors[p])}>{priorityLabels[p]}</Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{t('common.notes', 'Notes')}</Label>
            <Textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder={t('laboratory.orderForm.notesPlaceholder', 'Clinical notes or special instructions...')}
              rows={3}
            />
          </div>
        </div>

        <Separator className="my-2" />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createLabOrder.isPending || !selectedPatient || selectedTests.length === 0}
          >
            {createLabOrder.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('laboratory.orderForm.createOrder', 'Create Order')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
