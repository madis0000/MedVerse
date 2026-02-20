import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Syringe, Printer, CheckCircle2, Clock, AlertTriangle, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import {
  ALGERIA_VACCINATION_SCHEDULE,
  getVaccineStatus,
  type Vaccine,
  type VaccineDose,
  type VaccinationRecord,
} from './vaccination-schedule';

interface VaccinationTrackerProps {
  patientId: string;
  patientDob: string;
  consultationId: string;
  readOnly?: boolean;
}

interface AdminDialogState {
  open: boolean;
  vaccine: Vaccine | null;
  dose: VaccineDose | null;
}

const INJECTION_SITES = [
  'left_deltoid',
  'right_deltoid',
  'left_thigh',
  'right_thigh',
] as const;

export function VaccinationTracker({
  patientId,
  patientDob,
  consultationId,
  readOnly,
}: VaccinationTrackerProps) {
  const { t } = useTranslation();
  const [records, setRecords] = useState<VaccinationRecord[]>([]);
  const [adminDialog, setAdminDialog] = useState<AdminDialogState>({
    open: false,
    vaccine: null,
    dose: null,
  });
  const [adminDate, setAdminDate] = useState(new Date().toISOString().split('T')[0]);
  const [adminLot, setAdminLot] = useState('');
  const [adminSite, setAdminSite] = useState('');
  const [adminBy, setAdminBy] = useState('');
  const [saving, setSaving] = useState(false);

  const dobDate = useMemo(() => new Date(patientDob), [patientDob]);

  // Load existing vaccination records
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await apiClient.get(`/consultations/${consultationId}`);
        const vaccinations = data.customFields?.pediatrics?.vaccinations;
        if (Array.isArray(vaccinations)) {
          setRecords(vaccinations);
        }
      } catch {
        // silent
      }
    };
    if (consultationId) load();
  }, [consultationId]);

  // Summary counts
  const summary = useMemo(() => {
    let completed = 0;
    let due = 0;
    let overdue = 0;
    let upcoming = 0;
    let total = 0;

    for (const vaccine of ALGERIA_VACCINATION_SCHEDULE) {
      for (const dose of vaccine.doses) {
        total++;
        const status = getVaccineStatus(dobDate, vaccine, dose, records);
        switch (status) {
          case 'completed':
            completed++;
            break;
          case 'due':
            due++;
            break;
          case 'overdue':
            overdue++;
            break;
          case 'upcoming':
            upcoming++;
            break;
        }
      }
    }

    return { completed, due, overdue, upcoming, total };
  }, [dobDate, records]);

  const openAdminDialog = useCallback((vaccine: Vaccine, dose: VaccineDose) => {
    setAdminDialog({ open: true, vaccine, dose });
    setAdminDate(new Date().toISOString().split('T')[0]);
    setAdminLot('');
    setAdminSite('');
    setAdminBy('');
  }, []);

  const handleAdminister = useCallback(async () => {
    if (!adminDialog.vaccine || !adminDialog.dose) return;
    setSaving(true);

    const newRecord: VaccinationRecord = {
      vaccineId: adminDialog.vaccine.id,
      doseNumber: adminDialog.dose.doseNumber,
      dateAdministered: adminDate,
      lotNumber: adminLot || undefined,
      site: adminSite || undefined,
      administeredBy: adminBy || undefined,
    };

    try {
      const { data: consultation } = await apiClient.get(`/consultations/${consultationId}`);
      const existing = consultation.customFields?.pediatrics?.vaccinations ?? [];
      const updatedRecords = [...existing, newRecord];

      await apiClient.patch(`/consultations/${consultationId}`, {
        customFields: {
          ...consultation.customFields,
          pediatrics: {
            ...consultation.customFields?.pediatrics,
            vaccinations: updatedRecords,
          },
        },
      });

      setRecords(updatedRecords);
      setAdminDialog({ open: false, vaccine: null, dose: null });
      toast.success(t('specialties.pediatrics.vaccination.administered'));
    } catch {
      toast.error(t('specialties.pediatrics.vaccination.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [adminDialog, adminDate, adminLot, adminSite, adminBy, consultationId, t]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t('specialties.pediatrics.vaccination.status.completed')}
          </Badge>
        );
      case 'due':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            {t('specialties.pediatrics.vaccination.status.due')}
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {t('specialties.pediatrics.vaccination.status.overdue')}
          </Badge>
        );
      case 'upcoming':
        return (
          <Badge variant="secondary">
            <CalendarClock className="h-3 w-3 mr-1" />
            {t('specialties.pediatrics.vaccination.status.upcoming')}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5" />
            {t('specialties.pediatrics.vaccination.title')}
          </CardTitle>
          <Button size="sm" variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" />
            {t('specialties.pediatrics.vaccination.printCard')}
          </Button>
        </CardHeader>
        <CardContent>
          {/* Summary bar */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="text-center p-2 rounded-md bg-green-50">
              <div className="text-lg font-bold text-green-700">{summary.completed}</div>
              <div className="text-xs text-green-600">
                {t('specialties.pediatrics.vaccination.status.completed')}
              </div>
            </div>
            <div className="text-center p-2 rounded-md bg-yellow-50">
              <div className="text-lg font-bold text-yellow-700">{summary.due}</div>
              <div className="text-xs text-yellow-600">
                {t('specialties.pediatrics.vaccination.status.due')}
              </div>
            </div>
            <div className="text-center p-2 rounded-md bg-red-50">
              <div className="text-lg font-bold text-red-700">{summary.overdue}</div>
              <div className="text-xs text-red-600">
                {t('specialties.pediatrics.vaccination.status.overdue')}
              </div>
            </div>
            <div className="text-center p-2 rounded-md bg-muted">
              <div className="text-lg font-bold">{summary.upcoming}</div>
              <div className="text-xs text-muted-foreground">
                {t('specialties.pediatrics.vaccination.status.upcoming')}
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground mb-3">
            {t('specialties.pediatrics.vaccination.summary', {
              completed: summary.completed,
              total: summary.total,
            })}
          </div>

          <Separator className="mb-4" />

          {/* Vaccine schedule table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium">
                    {t('specialties.pediatrics.vaccination.vaccine')}
                  </th>
                  <th className="text-left py-2 pr-4 font-medium">
                    {t('specialties.pediatrics.vaccination.dose')}
                  </th>
                  <th className="text-left py-2 pr-4 font-medium">
                    {t('specialties.pediatrics.vaccination.recommendedAge')}
                  </th>
                  <th className="text-left py-2 pr-4 font-medium">
                    {t('common.status')}
                  </th>
                  <th className="text-left py-2 font-medium">
                    {t('specialties.pediatrics.vaccination.dateGiven')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {ALGERIA_VACCINATION_SCHEDULE.map((vaccine) =>
                  vaccine.doses.map((dose, doseIdx) => {
                    const status = getVaccineStatus(dobDate, vaccine, dose, records);
                    const record = records.find(
                      (r) => r.vaccineId === vaccine.id && r.doseNumber === dose.doseNumber,
                    );
                    const isClickable =
                      !readOnly && (status === 'due' || status === 'overdue');

                    return (
                      <tr
                        key={`${vaccine.id}-${dose.doseNumber}`}
                        className={`border-b last:border-0 ${
                          isClickable ? 'cursor-pointer hover:bg-muted/50' : ''
                        }`}
                        onClick={() => {
                          if (isClickable) openAdminDialog(vaccine, dose);
                        }}
                      >
                        <td className="py-2 pr-4">
                          {doseIdx === 0 ? (
                            <span className="font-medium">{vaccine.abbreviation}</span>
                          ) : (
                            <span className="text-muted-foreground">&nbsp;</span>
                          )}
                        </td>
                        <td className="py-2 pr-4">
                          {t('specialties.pediatrics.vaccination.doseNum', {
                            num: dose.doseNumber,
                          })}
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {dose.ageLabel}
                        </td>
                        <td className="py-2 pr-4">{getStatusBadge(status)}</td>
                        <td className="py-2">
                          {record ? (
                            <span className="text-sm">{record.dateAdministered}</span>
                          ) : isClickable ? (
                            <span className="text-xs text-muted-foreground italic">
                              {t('specialties.pediatrics.vaccination.clickToAdminister')}
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  }),
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Administration Dialog */}
      <Dialog
        open={adminDialog.open}
        onOpenChange={(open) => {
          if (!open) setAdminDialog({ open: false, vaccine: null, dose: null });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('specialties.pediatrics.vaccination.administerVaccine')}
            </DialogTitle>
            <DialogDescription>
              {adminDialog.vaccine?.name} -{' '}
              {t('specialties.pediatrics.vaccination.doseNum', {
                num: adminDialog.dose?.doseNumber ?? 1,
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('specialties.pediatrics.vaccination.dateAdministered')}</Label>
              <Input
                type="date"
                value={adminDate}
                onChange={(e) => setAdminDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t('specialties.pediatrics.vaccination.lotNumber')}</Label>
              <Input
                value={adminLot}
                onChange={(e) => setAdminLot(e.target.value)}
                placeholder={t('specialties.pediatrics.vaccination.lotNumberPlaceholder')}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t('specialties.pediatrics.vaccination.injectionSite')}</Label>
              <Select value={adminSite} onValueChange={setAdminSite}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t('specialties.pediatrics.vaccination.selectSite')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {INJECTION_SITES.map((site) => (
                    <SelectItem key={site} value={site}>
                      {t(`specialties.pediatrics.vaccination.sites.${site}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t('specialties.pediatrics.vaccination.administeredBy')}</Label>
              <Input
                value={adminBy}
                onChange={(e) => setAdminBy(e.target.value)}
                placeholder={t('specialties.pediatrics.vaccination.administeredByPlaceholder')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdminDialog({ open: false, vaccine: null, dose: null })}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAdminister} disabled={saving}>
              {saving
                ? t('common.saving')
                : t('specialties.pediatrics.vaccination.administer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
