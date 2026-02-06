import { useParams, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CardSkeleton, FormSkeleton } from '@/components/ui/loading-skeleton';
import { PatientSummaryCard } from '@/components/patients/patient-summary-card';
import { VisitHistoryTimeline } from '@/components/patients/visit-history-timeline';
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
            Recent Vitals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentVitals ? (
            <div className="grid grid-cols-2 gap-4">
              <VitalItem
                label="Blood Pressure"
                value={
                  recentVitals.bloodPressureSystolic && recentVitals.bloodPressureDiastolic
                    ? `${recentVitals.bloodPressureSystolic}/${recentVitals.bloodPressureDiastolic}`
                    : '--'
                }
                unit="mmHg"
              />
              <VitalItem
                label="Heart Rate"
                value={recentVitals.heartRate?.toString() || '--'}
                unit="bpm"
              />
              <VitalItem
                label="Temperature"
                value={recentVitals.temperature?.toString() || '--'}
                unit="°F"
              />
              <VitalItem
                label="SpO2"
                value={recentVitals.spO2?.toString() || '--'}
                unit="%"
              />
              <VitalItem
                label="Weight"
                value={recentVitals.weight?.toString() || '--'}
                unit="kg"
              />
              <VitalItem
                label="BMI"
                value={recentVitals.bmi?.toFixed(1) || '--'}
                unit=""
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No vital signs recorded yet.
            </p>
          )}
          {recentVitals && (
            <p className="text-xs text-muted-foreground mt-4 pt-3 border-t">
              Recorded on {formatDate(recentVitals.createdAt)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Active Diagnoses */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            Active Diagnoses
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
                      Primary
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No active diagnoses recorded.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Active Prescriptions */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Pill className="h-4 w-4 text-primary" />
            Active Prescriptions
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
                      Prescribed by Dr. {prescription.doctor?.lastName || 'Unknown'}
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
                    Issued {formatDate(prescription.createdAt)}
                    {prescription.validUntil && ` | Valid until ${formatDate(prescription.validUntil)}`}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No active prescriptions.
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
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Visit History
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
          Lab Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        {labOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No lab orders found for this patient.
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
                          <span className="text-xs text-muted-foreground">Pending</span>
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
          Prescriptions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {prescriptions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No prescriptions found for this patient.
          </p>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((rx) => (
              <div key={rx.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Dr. {rx.doctor?.firstName} {rx.doctor?.lastName}
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
                          <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
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
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No documents uploaded for this patient.
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
                      {doc.type || 'Document'} | {formatDate(doc.createdAt || doc.uploadedAt)}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  View
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
          Billing History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No invoices found for this patient.
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
                    {invoice.dueDate && ` | Due: ${formatDate(invoice.dueDate)}`}
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = usePatient(id!);

  const patient: Patient | null = data?.data || data || null;

  if (isLoading) {
    return (
      <PageWrapper
        title="Patient Profile"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Patients', path: '/patients' },
          { label: 'Loading...' },
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
        title="Patient Not Found"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Patients', path: '/patients' },
          { label: 'Not Found' },
        ]}
      >
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground mb-4">
            The patient you are looking for does not exist or has been removed.
          </p>
          <Button onClick={() => navigate('/patients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patients
          </Button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Patient Profile"
      breadcrumbs={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Patients', path: '/patients' },
        { label: `${patient.firstName} ${patient.lastName}` },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/patients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={() => navigate(`/patients/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Patient
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
              Overview
            </TabsTrigger>
            <TabsTrigger value="visits" className="gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Visits
            </TabsTrigger>
            <TabsTrigger value="lab-results" className="gap-1.5">
              <FlaskConical className="h-3.5 w-3.5" />
              Lab Results
            </TabsTrigger>
            <TabsTrigger value="prescriptions" className="gap-1.5">
              <Pill className="h-3.5 w-3.5" />
              Prescriptions
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-1.5">
              <Receipt className="h-3.5 w-3.5" />
              Billing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab patientId={id!} />
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
