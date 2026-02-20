import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Edit,
  Activity,
  Stethoscope,
  FlaskConical,
  Pill,
  FileText,
  Receipt,
  Calendar,
  TrendingUp,
  Minus,
  Clock,
} from 'lucide-react';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CardSkeleton, FormSkeleton } from '@/components/ui/loading-skeleton';
import { PatientSummaryCard } from '@/components/patients/patient-summary-card';
import { VisitHistoryTimeline } from '@/components/patients/visit-history-timeline';
import { ClinicalTimeline } from '@/components/patients/clinical-timeline';
import { usePatient } from '@/api/patients';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Patient, VitalSign, Diagnosis, Prescription, LabOrder, Invoice } from '@/types';

function usePatientOverview(id: string) {
  return useQuery({
    queryKey: ['patients', id, 'overview'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/patients/${id}/overview`);
      return data;
    },
    enabled: !!id,
  });
}

function usePatientConsultations(id: string) {
  return useQuery({
    queryKey: ['patients', id, 'consultations'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/patients/${id}/consultations`);
      return data;
    },
    enabled: !!id,
  });
}

function usePatientLabOrders(id: string) {
  return useQuery({
    queryKey: ['patients', id, 'lab-orders'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/patients/${id}/lab-orders`);
      return data;
    },
    enabled: !!id,
  });
}

function usePatientPrescriptions(id: string) {
  return useQuery({
    queryKey: ['patients', id, 'prescriptions'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/patients/${id}/prescriptions`);
      return data;
    },
    enabled: !!id,
  });
}

function usePatientInvoices(id: string) {
  return useQuery({
    queryKey: ['patients', id, 'invoices'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/patients/${id}/invoices`);
      return data;
    },
    enabled: !!id,
  });
}

// ----- Overview Tab -----

function OverviewTab({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = usePatientOverview(patientId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const overview = data?.data || {};
  const recentVitals: VitalSign | null = overview.recentVitals || null;
  const activeDiagnoses: Diagnosis[] = overview.activeDiagnoses || [];
  const activePrescriptions: Prescription[] = overview.activePrescriptions || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Vitals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            {t('patients.recentVitals')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentVitals ? (
            <div className="grid grid-cols-2 gap-4">
              <VitalItem
                label={t('patients.vitals.bloodPressure')}
                value={
                  recentVitals.bloodPressureSystolic && recentVitals.bloodPressureDiastolic
                    ? `${recentVitals.bloodPressureSystolic}/${recentVitals.bloodPressureDiastolic}`
                    : '--'
                }
                unit="mmHg"
              />
              <VitalItem
                label={t('patients.vitals.heartRate')}
                value={recentVitals.heartRate?.toString() || '--'}
                unit="bpm"
              />
              <VitalItem
                label={t('patients.vitals.temperature')}
                value={recentVitals.temperature?.toString() || '--'}
                unit="°F"
              />
              <VitalItem
                label={t('patients.vitals.spO2')}
                value={recentVitals.spO2?.toString() || '--'}
                unit="%"
              />
              <VitalItem
                label={t('patients.vitals.weight')}
                value={recentVitals.weight?.toString() || '--'}
                unit="kg"
              />
              <VitalItem
                label={t('patients.vitals.bmi')}
                value={recentVitals.bmi?.toFixed(1) || '--'}
                unit=""
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t('patients.noVitalsRecorded')}
            </p>
          )}
          {recentVitals && (
            <p className="text-xs text-muted-foreground mt-4 pt-3 border-t">
              {t('patients.recordedOn', { date: formatDate(recentVitals.createdAt) })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Active Diagnoses */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            {t('patients.activeDiagnoses')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeDiagnoses.length > 0 ? (
            <div className="space-y-3">
              {activeDiagnoses.map((diagnosis) => (
                <div
                  key={diagnosis.id}
                  className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {diagnosis.icd10Description}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {diagnosis.icd10Code}
                    </p>
                  </div>
                  {diagnosis.isPrimary && (
                    <Badge variant="secondary" className="text-[10px]">
                      {t('patients.primary')}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t('patients.noActiveDiagnoses')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Active Prescriptions */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Pill className="h-4 w-4 text-primary" />
            {t('patients.activePrescriptions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activePrescriptions.length > 0 ? (
            <div className="space-y-3">
              {activePrescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="rounded-lg border p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">
                      {t('patients.prescribedByDoctor', { name: prescription.doctor?.lastName || t('common.unknown') })}
                    </p>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    >
                      {prescription.status}
                    </Badge>
                  </div>
                  {prescription.items && prescription.items.length > 0 && (
                    <div className="space-y-1.5 mt-2">
                      {prescription.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-sm text-muted-foreground"
                        >
                          <span>
                            {item.medicationName} - {item.dosage}
                          </span>
                          <span>
                            {item.frequency}, {item.duration}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('patients.issued', { date: formatDate(prescription.createdAt) })}
                    {prescription.validUntil && ` | ${t('patients.validUntil', { date: formatDate(prescription.validUntil) })}`}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t('patients.noActivePrescriptions')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function VitalItem({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-semibold text-foreground">
        {value}
        {unit && <span className="text-xs text-muted-foreground font-normal ml-1">{unit}</span>}
      </p>
    </div>
  );
}

// ----- Visits Tab -----

function VisitsTab({ patientId }: { patientId: string }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          {t('patients.visitHistory')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <VisitHistoryTimeline patientId={patientId} />
      </CardContent>
    </Card>
  );
}

// ----- Lab Results Tab -----

function LabResultsTab({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = usePatientLabOrders(patientId);
  const labOrders: LabOrder[] = data?.data || [];

  if (isLoading) {
    return <CardSkeleton />;
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    SAMPLE_COLLECTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    PROCESSING: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    RESULTS_AVAILABLE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" />
          {t('patients.tabs.labResults')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {labOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {t('patients.noLabOrders')}
          </p>
        ) : (
          <div className="space-y-4">
            {labOrders.map((order) => (
              <div key={order.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[order.status] || ''} variant="secondary">
                      {order.status.replace(/_/g, ' ')}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {order.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                </div>
                {order.items && order.items.length > 0 && (
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-sm p-2 rounded bg-muted/50"
                      >
                        <span className="font-medium text-foreground">{item.testName}</span>
                        {item.result ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                item.result.isAbnormal
                                  ? 'text-red-600 dark:text-red-400 font-medium'
                                  : 'text-foreground'
                              }
                            >
                              {item.result.value}
                              {item.result.unit && ` ${item.result.unit}`}
                            </span>
                            {item.result.isAbnormal ? (
                              <TrendingUp className="h-3.5 w-3.5 text-red-500" />
                            ) : (
                              <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">{t('patients.status.PENDING')}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {order.notes && (
                  <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                    {order.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ----- Prescriptions Tab -----

function PrescriptionsTab({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = usePatientPrescriptions(patientId);
  const prescriptions: Prescription[] = data?.data || [];

  if (isLoading) {
    return <CardSkeleton />;
  }

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    COMPLETED: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Pill className="h-4 w-4 text-primary" />
          {t('patients.tabs.prescriptions')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {prescriptions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {t('patients.noPrescriptions')}
          </p>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((rx) => (
              <div key={rx.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t('common.dr')} {rx.doctor?.firstName} {rx.doctor?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(rx.createdAt)}</p>
                  </div>
                  <Badge className={statusColors[rx.status] || ''} variant="secondary">
                    {rx.status}
                  </Badge>
                </div>
                {rx.items && rx.items.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {rx.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between text-sm p-2 rounded bg-muted/50"
                      >
                        <div>
                          <p className="font-medium text-foreground">{item.medicationName}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.dosage} | {item.frequency} | {item.duration} | {item.route}
                          </p>
                          {item.instructions && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              {item.instructions}
                            </p>
                          )}
                        </div>
                        {item.quantity && (
                          <span className="text-xs text-muted-foreground">{t('patients.qty')}: {item.quantity}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {rx.notes && (
                  <p className="text-xs text-muted-foreground mt-3 pt-2 border-t">{rx.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ----- Documents Tab -----

function DocumentsTab({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['patients', patientId, 'documents'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/patients/${patientId}/documents`);
      return data;
    },
    enabled: !!patientId,
  });

  const documents: any[] = data?.data || [];

  if (isLoading) {
    return <CardSkeleton />;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          {t('patients.tabs.documents')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {t('patients.noDocuments')}
          </p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc: any) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{doc.name || doc.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.type || t('patients.document')} | {formatDate(doc.createdAt || doc.uploadedAt)}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  {t('common.view')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ----- Billing Tab -----

function BillingTab({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = usePatientInvoices(patientId);
  const invoices: Invoice[] = data?.data || [];

  if (isLoading) {
    return <CardSkeleton />;
  }

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    PARTIAL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" />
          {t('patients.billingHistory')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {t('patients.noInvoices')}
          </p>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{invoice.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(invoice.createdAt)}
                    {invoice.dueDate && ` | ${t('patients.due')}: ${formatDate(invoice.dueDate)}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={statusColors[invoice.status] || ''} variant="secondary">
                    {invoice.status}
                  </Badge>
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(invoice.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ----- Main Profile Page -----

export function PatientProfilePage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = usePatient(id!);

  const patient: Patient | null = data?.data || data || null;

  if (isLoading) {
    return (
      <PageWrapper
        title={t('patients.patientProfile')}
        breadcrumbs={[
          { label: t('nav.dashboard'), path: '/dashboard' },
          { label: t('nav.patients'), path: '/patients' },
          { label: t('common.loading') },
        ]}
      >
        <div className="space-y-6">
          <CardSkeleton />
          <FormSkeleton />
        </div>
      </PageWrapper>
    );
  }

  if (!patient) {
    return (
      <PageWrapper
        title={t('patients.patientNotFound')}
        breadcrumbs={[
          { label: t('nav.dashboard'), path: '/dashboard' },
          { label: t('nav.patients'), path: '/patients' },
          { label: t('common.notFound') },
        ]}
      >
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground mb-4">
            {t('patients.patientNotFoundMessage')}
          </p>
          <Button onClick={() => navigate('/patients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('patients.backToPatients')}
          </Button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title={t('patients.patientProfile')}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/dashboard' },
        { label: t('nav.patients'), path: '/patients' },
        { label: `${patient.firstName} ${patient.lastName}` },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/patients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <Button onClick={() => navigate(`/patients/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            {t('patients.editPatient')}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <PatientSummaryCard patient={patient} />

        <Tabs defaultValue="overview">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview" className="gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              {t('patients.tabs.overview')}
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {t('patients.tabs.timeline')}
            </TabsTrigger>
            <TabsTrigger value="visits" className="gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {t('patients.tabs.visits')}
            </TabsTrigger>
            <TabsTrigger value="lab-results" className="gap-1.5">
              <FlaskConical className="h-3.5 w-3.5" />
              {t('patients.tabs.labResults')}
            </TabsTrigger>
            <TabsTrigger value="prescriptions" className="gap-1.5">
              <Pill className="h-3.5 w-3.5" />
              {t('patients.tabs.prescriptions')}
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              {t('patients.tabs.documents')}
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-1.5">
              <Receipt className="h-3.5 w-3.5" />
              {t('patients.tabs.billing')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab patientId={id!} />
          </TabsContent>

          <TabsContent value="timeline">
            <ClinicalTimeline patientId={id!} />
          </TabsContent>

          <TabsContent value="visits">
            <VisitsTab patientId={id!} />
          </TabsContent>

          <TabsContent value="lab-results">
            <LabResultsTab patientId={id!} />
          </TabsContent>

          <TabsContent value="prescriptions">
            <PrescriptionsTab patientId={id!} />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentsTab patientId={id!} />
          </TabsContent>

          <TabsContent value="billing">
            <BillingTab patientId={id!} />
          </TabsContent>
        </Tabs>
      </div>
    </PageWrapper>
  );
}
