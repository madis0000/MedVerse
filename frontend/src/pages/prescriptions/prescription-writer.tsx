import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Plus,
  Trash2,
  Eye,
  Send,
  Loader2,
  Pill,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MedicationSearch } from '@/components/prescriptions/medication-search';
import { DrugInteractionAlert } from '@/components/prescriptions/drug-interaction-alert';
import { PrescriptionPreview } from '@/components/prescriptions/prescription-preview';
import { PrescriptionHistory } from '@/components/prescriptions/prescription-history';
import { useCreatePrescription, useCheckInteractions } from '@/api/prescriptions';
import { useAuthStore } from '@/stores/auth-store';
import apiClient from '@/lib/api-client';
import type { Patient, PrescriptionItem } from '@/types';

interface MedicationRow {
  tempId: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
  quantity: string;
}

function createEmptyRow(): MedicationRow {
  return {
    tempId: crypto.randomUUID(),
    medicationId: '',
    medicationName: '',
    dosage: '',
    frequency: '',
    duration: '',
    route: 'ORAL',
    instructions: '',
    quantity: '',
  };
}

const FREQUENCY_KEYS = [
  'onceDaily',
  'twiceDaily',
  'threeTimesDaily',
  'fourTimesDaily',
  'every4Hours',
  'every6Hours',
  'every8Hours',
  'every12Hours',
  'asNeeded',
  'atBedtime',
  'beforeMeals',
  'afterMeals',
] as const;

const FREQUENCY_VALUES = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every 4 hours',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'As needed',
  'At bedtime',
  'Before meals',
  'After meals',
];

const ROUTE_OPTIONS = [
  'ORAL',
  'SUBLINGUAL',
  'TOPICAL',
  'INHALATION',
  'INTRAVENOUS',
  'INTRAMUSCULAR',
  'SUBCUTANEOUS',
  'RECTAL',
  'OPHTHALMIC',
  'OTIC',
  'NASAL',
];

export function PrescriptionWriterPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const createPrescription = useCreatePrescription();
  const checkInteractions = useCheckInteractions();

  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);

  const [medications, setMedications] = useState<MedicationRow[]>([createEmptyRow()]);
  const [notes, setNotes] = useState('');
  const [interactions, setInteractions] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [savedPrescriptionId, setSavedPrescriptionId] = useState<string | null>(null);

  // Patient search
  const searchPatients = useCallback(async (q: string) => {
    setPatientQuery(q);
    if (q.length < 2) {
      setPatientResults([]);
      return;
    }

    setPatientSearchLoading(true);
    try {
      const { data } = await apiClient.get('/patients', {
        params: { search: q, limit: 10 },
      });
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
    setSavedPrescriptionId(null);
    setShowPreview(false);
  }

  // Medication row management
  function updateMedicationRow(tempId: string, field: keyof MedicationRow, value: string) {
    setMedications((prev) =>
      prev.map((row) => (row.tempId === tempId ? { ...row, [field]: value } : row)),
    );
  }

  function handleMedicationSelect(tempId: string, med: { medicationId: string; medicationName: string }) {
    setMedications((prev) =>
      prev.map((row) =>
        row.tempId === tempId
          ? { ...row, medicationId: med.medicationId, medicationName: med.medicationName }
          : row,
      ),
    );
  }

  function addMedicationRow() {
    setMedications((prev) => [...prev, createEmptyRow()]);
  }

  function removeMedicationRow(tempId: string) {
    setMedications((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((row) => row.tempId !== tempId);
    });
  }

  // Drug interaction check
  async function handleCheckInteractions() {
    const medicationIds = medications
      .filter((m) => m.medicationId)
      .map((m) => m.medicationId);

    if (medicationIds.length < 2) {
      toast.info(t('prescriptions.drugInteractions.addAtLeastTwo', 'Add at least two medications to check interactions'));
      return;
    }

    try {
      const result = await checkInteractions.mutateAsync({ medicationIds });
      const interactionList = result.data ?? result ?? [];
      setInteractions(interactionList);

      if (interactionList.length === 0) {
        toast.success(t('prescriptions.drugInteractions.noneFound', 'No drug interactions found'));
      } else {
        toast.warning(t('prescriptions.drugInteractions.found', 'Found {{count}} interaction(s)', { count: interactionList.length }));
      }
    } catch {
      toast.error(t('prescriptions.drugInteractions.checkFailed', 'Failed to check drug interactions'));
    }
  }

  // Build items for submission
  function buildItems(): PrescriptionItem[] {
    return medications
      .filter((m) => m.medicationName.trim())
      .map((m) => ({
        id: '',
        medicationId: m.medicationId || undefined,
        medicationName: m.medicationName,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        route: m.route,
        instructions: m.instructions || undefined,
        quantity: m.quantity ? Number(m.quantity) : undefined,
      }));
  }

  // Preview
  function handlePreview() {
    const items = buildItems();
    if (items.length === 0) {
      toast.error(t('prescriptions.noMedications', 'Add at least one medication'));
      return;
    }
    if (!selectedPatient) {
      toast.error(t('prescriptions.selectPatient', 'Select a patient first'));
      return;
    }
    setShowPreview(true);
  }

  // Submit
  async function handleSubmit() {
    if (!selectedPatient) {
      toast.error(t('prescriptions.selectPatient', 'Select a patient first'));
      return;
    }

    const items = buildItems();
    if (items.length === 0) {
      toast.error(t('prescriptions.noMedications', 'Add at least one medication'));
      return;
    }

    try {
      const result = await createPrescription.mutateAsync({
        patientId: selectedPatient.id,
        notes: notes || undefined,
        items: items.map(({ id, ...rest }) => rest),
      });
      const rx = result.data ?? result;
      setSavedPrescriptionId(rx.id);
      toast.success(t('prescriptions.prescriptionCreated', 'Prescription created successfully'));
      setShowPreview(true);
    } catch {
      toast.error(t('common.error', 'Failed to create prescription'));
    }
  }

  const doctorName = user ? `Dr. ${user.firstName} ${user.lastName}` : t('common.doctor', 'Doctor');

  return (
    <PageWrapper
      title={t('prescriptions.writer', 'Prescription Writer')}
      breadcrumbs={[
        { label: t('nav.prescriptions', 'Prescriptions'), path: '/prescriptions' },
        { label: t('prescriptions.newPrescription', 'Write Prescription') },
      ]}
    >
      {showPreview ? (
        <div className="space-y-4">
          <Button variant="outline" onClick={() => setShowPreview(false)}>
            {t('common.backToEditor', 'Back to Editor')}
          </Button>
          <PrescriptionPreview
            prescriptionId={savedPrescriptionId ?? undefined}
            patient={selectedPatient}
            doctorName={doctorName}
            items={buildItems()}
            notes={notes}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Search */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('common.patient', 'Patient')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={patientQuery}
                    onChange={(e) => searchPatients(e.target.value)}
                    placeholder={t('prescriptions.medicationSearch', 'Search patient by name or MRN...')}
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
                          className="flex items-center gap-3 w-full px-3 py-2.5 text-left text-sm hover:bg-accent transition-colors"
                          onClick={() => selectPatient(p)}
                        >
                          <div>
                            <p className="font-medium">
                              {p.firstName} {p.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t('common.mrn', 'MRN')}: {p.mrn} &middot; {p.gender} &middot; {t('common.dob', 'DOB')}: {p.dob}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedPatient && (
                  <div className="mt-3 p-3 rounded-lg bg-muted/50 text-sm">
                    <p className="font-medium">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('common.mrn', 'MRN')}: {selectedPatient.mrn} &middot; {t('common.bloodType', 'Blood Type')}: {selectedPatient.bloodType}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Medications */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Pill className="h-4 w-4" />
                    {t('prescriptions.medication', 'Medications')}
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={addMedicationRow}>
                    <Plus className="h-4 w-4 mr-1" />
                    {t('prescriptions.addMedication', 'Add Medication')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {medications.map((row, index) => (
                  <div key={row.tempId} className="space-y-3 p-4 rounded-lg border bg-muted/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        {t('prescriptions.medication', 'Medication')} #{index + 1}
                      </span>
                      {medications.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMedicationRow(row.tempId)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <Label className="text-xs">{t('prescriptions.medication', 'Medication')}</Label>
                        <MedicationSearch
                          value={row.medicationName}
                          onSelect={(med) => handleMedicationSelect(row.tempId, med)}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">{t('prescriptions.dosage', 'Dosage')}</Label>
                        <Input
                          value={row.dosage}
                          onChange={(e) => updateMedicationRow(row.tempId, 'dosage', e.target.value)}
                          placeholder={t('prescriptions.dosagePlaceholder', 'e.g., 500mg')}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">{t('prescriptions.frequency', 'Frequency')}</Label>
                        <Select
                          value={row.frequency}
                          onValueChange={(v) => updateMedicationRow(row.tempId, 'frequency', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('prescriptions.selectFrequency', 'Select frequency')} />
                          </SelectTrigger>
                          <SelectContent>
                            {FREQUENCY_KEYS.map((key, i) => (
                              <SelectItem key={FREQUENCY_VALUES[i]} value={FREQUENCY_VALUES[i]}>
                                {t(`prescriptions.frequencies.${key}`, FREQUENCY_VALUES[i])}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">{t('prescriptions.duration', 'Duration')}</Label>
                        <Input
                          value={row.duration}
                          onChange={(e) => updateMedicationRow(row.tempId, 'duration', e.target.value)}
                          placeholder={t('prescriptions.durationPlaceholder', 'e.g., 7 days')}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">{t('prescriptions.route', 'Route')}</Label>
                        <Select
                          value={row.route}
                          onValueChange={(v) => updateMedicationRow(row.tempId, 'route', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('prescriptions.selectRoute', 'Select route')} />
                          </SelectTrigger>
                          <SelectContent>
                            {ROUTE_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {t(`prescriptions.routes.${opt}`, opt)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">{t('prescriptions.quantity', 'Quantity')}</Label>
                        <Input
                          type="number"
                          value={row.quantity}
                          onChange={(e) => updateMedicationRow(row.tempId, 'quantity', e.target.value)}
                          placeholder={t('prescriptions.quantityPlaceholder', 'e.g., 30')}
                          min={1}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">{t('prescriptions.instructions', 'Instructions')}</Label>
                        <Input
                          value={row.instructions}
                          onChange={(e) =>
                            updateMedicationRow(row.tempId, 'instructions', e.target.value)
                          }
                          placeholder={t('prescriptions.instructionsPlaceholder', 'e.g., Take with food')}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('common.notes', 'Notes')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('prescriptions.notesPlaceholder', 'Additional notes or instructions...')}
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" />
                {t('prescriptions.preview', 'Preview')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createPrescription.isPending || !selectedPatient}
              >
                {createPrescription.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {t('prescriptions.send', 'Submit Prescription')}
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Drug Interaction Panel */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    {t('prescriptions.drugInteractions', 'Interactions')}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCheckInteractions}
                    disabled={checkInteractions.isPending}
                  >
                    {checkInteractions.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t('common.check', 'Check')
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {interactions.length > 0 ? (
                  <DrugInteractionAlert interactions={interactions} />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('prescriptions.drugInteractions.hint', 'Add medications and click Check to verify drug interactions')}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Prescription History */}
            {selectedPatient && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t('prescriptions.history', 'History')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <PrescriptionHistory patientId={selectedPatient.id} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
