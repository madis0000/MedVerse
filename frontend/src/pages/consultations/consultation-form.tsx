import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  User,
  Phone,
  FileText,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SOAPForm } from '@/components/consultations/soap-form';
import { VitalsForm } from '@/components/consultations/vitals-form';
import { DiagnosisSearch } from '@/components/consultations/diagnosis-search';
import { BodyMap } from '@/components/consultations/body-map';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type {
  Consultation,
  Patient,
  VitalSign,
  Diagnosis,
  SpecialtyField,
  Specialty,
} from '@/types';

interface BodyMarker {
  id: string;
  region: string;
  note: string;
  view: 'front' | 'back';
}

export function ConsultationFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [specialty, setSpecialty] = useState<Specialty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [bodyMarkers, setBodyMarkers] = useState<BodyMarker[]>([]);

  const isCompleted = consultation?.status === 'COMPLETED';
  const isAmended = consultation?.status === 'AMENDED';
  const readOnly = isCompleted || isAmended;

  const fetchConsultation = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const { data } = await apiClient.get(`/consultations/${id}`);
      setConsultation(data);

      // Restore body markers from custom fields if present
      if (data.customFields?.bodyMarkers) {
        setBodyMarkers(data.customFields.bodyMarkers);
      }

      // Fetch specialty fields if specialty info is available
      if (data.specialtyId) {
        try {
          const specialtyRes = await apiClient.get(`/specialties/${data.specialtyId}`);
          setSpecialty(specialtyRes.data);
        } catch {
          // Specialty fetch is non-critical
        }
      }
    } catch (err: any) {
      const message =
        err?.response?.status === 404
          ? t('consultations.notFound')
          : t('consultations.loadFailed');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchConsultation();
  }, [fetchConsultation]);

  const handleConsultationUpdate = useCallback(
    (updates: Partial<Consultation>) => {
      setConsultation((prev) => (prev ? { ...prev, ...updates } : prev));
    },
    [],
  );

  const handleDiagnosesChange = useCallback(
    (diagnoses: Diagnosis[]) => {
      setConsultation((prev) => (prev ? { ...prev, diagnoses } : prev));
    },
    [],
  );

  const handleVitalsSaved = useCallback(
    (vitals: VitalSign) => {
      setConsultation((prev) => {
        if (!prev) return prev;
        const existingVitals = prev.vitalSigns ?? [];
        const idx = existingVitals.findIndex((v) => v.id === vitals.id);
        if (idx >= 0) {
          const updated = [...existingVitals];
          updated[idx] = vitals;
          return { ...prev, vitalSigns: updated };
        }
        return { ...prev, vitalSigns: [...existingVitals, vitals] };
      });
    },
    [],
  );

  const handleBodyMarkersChange = useCallback(
    async (markers: BodyMarker[]) => {
      setBodyMarkers(markers);
      if (!consultation) return;

      // Persist body markers in custom fields
      try {
        const updatedCustomFields = {
          ...(consultation.customFields ?? {}),
          bodyMarkers: markers,
        };
        await apiClient.patch(`/consultations/${consultation.id}`, {
          customFields: updatedCustomFields,
        });
        setConsultation((prev) =>
          prev ? { ...prev, customFields: updatedCustomFields } : prev,
        );
      } catch {
        toast.error(t('consultations.bodyMapSaveFailed'));
      }
    },
    [consultation, t],
  );

  async function handleCompleteConsultation() {
    if (!consultation) return;
    setCompleting(true);

    try {
      const { data } = await apiClient.patch(
        `/consultations/${consultation.id}`,
        { status: 'COMPLETED' },
      );
      setConsultation(data);
      toast.success(t('consultations.consultationCompleted'));
    } catch {
      toast.error(t('consultations.completeFailed'));
    } finally {
      setCompleting(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t('common.loading')}...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !consultation) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="font-medium">{error ?? t('common.somethingWentWrong')}</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.goBack')}
          </Button>
        </div>
      </div>
    );
  }

  const patient = consultation.patient;
  const latestVitals =
    consultation.vitalSigns && consultation.vitalSigns.length > 0
      ? consultation.vitalSigns[consultation.vitalSigns.length - 1]
      : null;
  const specialtyFields: SpecialtyField[] = specialty?.fields ?? [];

  // Determine if body map is relevant (useful for dermatology and orthopedics)
  const showBodyMap =
    specialty?.name?.toLowerCase().includes('dermatolog') ||
    specialty?.name?.toLowerCase().includes('orthop') ||
    specialty?.name?.toLowerCase().includes('orthopaed') ||
    specialty?.name?.toLowerCase().includes('surgery') ||
    bodyMarkers.length > 0;

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{t('consultations.title')}</h1>
              <StatusBadge status={consultation.status} />
            </div>
            {consultation.completedAt && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="h-3.5 w-3.5" />
                {t('consultations.completedAt')} {formatDate(consultation.completedAt)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout: Left + Right panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Patient Summary + Vitals + Diagnoses + Body Map */}
        <div className="lg:col-span-4 space-y-6">
          {/* Patient Summary Card */}
          {patient && <PatientSummaryCard patient={patient} />}

          {/* Vitals */}
          <VitalsForm
            consultationId={consultation.id}
            existingVitals={latestVitals}
            readOnly={readOnly}
            onSaved={handleVitalsSaved}
          />

          {/* Diagnoses */}
          <DiagnosisSearch
            consultationId={consultation.id}
            diagnoses={consultation.diagnoses ?? []}
            onDiagnosesChange={handleDiagnosesChange}
            readOnly={readOnly}
          />

          {/* Body Map */}
          {showBodyMap && (
            <BodyMap
              markers={bodyMarkers}
              onChange={handleBodyMarkersChange}
              readOnly={readOnly}
            />
          )}
        </div>

        {/* Right Column: SOAP Form Tabs */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('consultations.soapNotes')}
                {readOnly && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {t('common.readOnly')}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SOAPForm
                consultation={consultation}
                specialtyFields={specialtyFields}
                onUpdate={handleConsultationUpdate}
                readOnly={readOnly}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Action Bar */}
      {!readOnly && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="container flex items-center justify-between py-3 px-6">
            <div className="text-sm text-muted-foreground">
              {consultation.diagnoses && consultation.diagnoses.length > 0 ? (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {t('consultations.diagnosesCount', { count: consultation.diagnoses.length })}
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  {t('consultations.noDiagnoses')}
                </span>
              )}
            </div>
            <Button
              onClick={() => setCompleteDialogOpen(true)}
              disabled={completing}
              className="gap-2"
            >
              {completing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {t('consultations.complete')}
            </Button>
          </div>
        </div>
      )}

      {/* Confirm Complete Dialog */}
      <ConfirmDialog
        open={completeDialogOpen}
        onClose={() => setCompleteDialogOpen(false)}
        onConfirm={handleCompleteConsultation}
        title={t('consultations.completeConfirmTitle')}
        description={t('consultations.completeConfirmMessage')}
        confirmText={t('consultations.complete')}
        cancelText={t('consultations.continueEditing')}
      />
    </div>
  );
}

/* ---------- Sub-components ---------- */

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();

  switch (status) {
    case 'IN_PROGRESS':
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
          {t('consultations.statusInProgress')}
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
          {t('consultations.statusCompleted')}
        </Badge>
      );
    case 'AMENDED':
      return (
        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">
          {t('consultations.statusAmended')}
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function PatientSummaryCard({ patient }: { patient: Patient }) {
  const { t } = useTranslation();
  const age = getAge(patient.dob);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-4 w-4" />
          {t('consultations.patientInfo')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          {patient.photo ? (
            <img
              src={patient.photo}
              alt={`${patient.firstName} ${patient.lastName}`}
              className="h-12 w-12 rounded-full object-cover border"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
              {patient.firstName?.[0]}
              {patient.lastName?.[0]}
            </div>
          )}
          <div>
            <p className="font-semibold text-base">
              {patient.firstName} {patient.lastName}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('consultations.mrn')}: {patient.mrn}
            </p>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">{t('consultations.ageDob')}</p>
            <p className="font-medium">
              {age} {t('consultations.years')} &middot; {formatDate(patient.dob)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{t('consultations.gender')}</p>
            <p className="font-medium capitalize">{patient.gender?.toLowerCase()}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{t('consultations.bloodType')}</p>
            <p className="font-medium">
              {formatBloodType(patient.bloodType)}
            </p>
          </div>
          {patient.phone && (
            <div>
              <p className="text-muted-foreground text-xs">{t('consultations.phone')}</p>
              <p className="font-medium flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {patient.phone}
              </p>
            </div>
          )}
        </div>

        {patient.insuranceProvider && (
          <>
            <Separator />
            <div className="text-sm">
              <p className="text-muted-foreground text-xs">{t('consultations.insurance')}</p>
              <p className="font-medium">{patient.insuranceProvider}</p>
              {patient.insuranceNumber && (
                <p className="text-xs text-muted-foreground">
                  #{patient.insuranceNumber}
                </p>
              )}
            </div>
          </>
        )}

        {patient.notes && (
          <>
            <Separator />
            <div className="text-sm">
              <p className="text-muted-foreground text-xs mb-1">{t('consultations.notes')}</p>
              <p className="text-sm bg-muted/50 rounded-md p-2">{patient.notes}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function getAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function formatBloodType(bt: string): string {
  if (!bt || bt === 'UNKNOWN') return 'Unknown';
  return bt.replace('_POSITIVE', '+').replace('_NEGATIVE', '-');
}
