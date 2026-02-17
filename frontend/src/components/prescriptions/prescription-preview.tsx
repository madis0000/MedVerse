import { useTranslation } from 'react-i18next';
import { Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/utils';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import type { Patient, PrescriptionItem } from '@/types';

interface PrescriptionPreviewProps {
  prescriptionId?: string;
  patient: Patient | null;
  doctorName: string;
  items: PrescriptionItem[];
  notes?: string;
  date?: string;
}

export function PrescriptionPreview({
  prescriptionId,
  patient,
  doctorName,
  items,
  notes,
  date,
}: PrescriptionPreviewProps) {
  const { t } = useTranslation();

  async function handleDownloadPdf() {
    if (!prescriptionId) {
      toast.error(t('prescriptions.saveBefore'));
      return;
    }

    try {
      const response = await apiClient.get(`/prescriptions/${prescriptionId}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prescription-${prescriptionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error(t('prescriptions.downloadFailed'));
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <h3 className="text-lg font-semibold">{t('prescriptions.preview')}</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" />
            {t('prescriptions.print')}
          </Button>
          {prescriptionId && (
            <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
              <Download className="h-4 w-4 mr-1" />
              {t('prescriptions.downloadPdf')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Clinic Header */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-foreground">{t('prescriptions.clinicName')}</h2>
          <p className="text-xs text-muted-foreground">
            {t('prescriptions.clinicAddress')}
          </p>
        </div>

        <Separator className="my-3" />

        {/* Patient Information */}
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p className="text-muted-foreground">{t('common.patient')}</p>
            <p className="font-medium">
              {patient ? `${patient.firstName} ${patient.lastName}` : t('common.na')}
            </p>
            {patient?.mrn && (
              <p className="text-xs text-muted-foreground">{t('common.mrn')}: {patient.mrn}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">{t('common.date')}</p>
            <p className="font-medium">{formatDate(date ?? new Date().toISOString())}</p>
          </div>
        </div>

        <Separator className="my-3" />

        {/* Rx Symbol and Medications */}
        <div className="mb-4">
          <p className="text-3xl font-serif font-bold text-primary mb-3">Rx</p>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id ?? index} className="pl-4 border-l-2 border-primary/30">
                <p className="font-medium">
                  {index + 1}. {item.medicationName}
                </p>
                <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                  <p>{t('prescriptions.dosage')}: {item.dosage} | {t('prescriptions.route')}: {item.route}</p>
                  <p>{t('prescriptions.frequency')}: {item.frequency} | {t('prescriptions.duration')}: {item.duration}</p>
                  {item.quantity && <p>{t('prescriptions.quantity')}: {item.quantity}</p>}
                  {item.instructions && (
                    <p className="italic">{t('prescriptions.instructions')}: {item.instructions}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {notes && (
          <>
            <Separator className="my-3" />
            <div className="mb-4">
              <p className="text-sm font-medium mb-1">{t('common.notes')}</p>
              <p className="text-sm text-muted-foreground">{notes}</p>
            </div>
          </>
        )}

        <Separator className="my-3" />

        {/* Doctor Signature Line */}
        <div className="mt-8 text-right">
          <div className="inline-block text-center">
            <div className="w-48 border-b border-foreground mb-1" />
            <p className="text-sm font-medium">{doctorName}</p>
            <p className="text-xs text-muted-foreground">{t('prescriptions.prescribingPhysician')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
