import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Stethoscope } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { GrowthChart } from './growth-chart';
import { VaccinationTracker } from './vaccination-tracker';
import { DevelopmentalMilestones } from './developmental-milestones';
import { PediatricVitals } from './pediatric-vitals';

interface PediatricsPanelProps {
  consultationId: string;
  patientId: string;
  specialty: string;
  readOnly?: boolean;
}

interface PatientInfo {
  dob: string;
  sex: string;
}

type VitalsData = {
  heartRate?: number;
  respiratoryRate?: number;
  systolicBP?: number;
  diastolicBP?: number;
  temperature?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
};

export function PediatricsPanel({
  consultationId,
  patientId,
  specialty,
  readOnly,
}: PediatricsPanelProps) {
  const { t } = useTranslation();
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [vitals, setVitals] = useState<VitalsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await apiClient.get(`/consultations/${consultationId}`);
        const patient = data.patient ?? data.patientData;
        if (patient) {
          setPatientInfo({
            dob: patient.dateOfBirth ?? patient.dob ?? '',
            sex: patient.gender ?? patient.sex ?? 'male',
          });
        }
        if (data.vitals) {
          setVitals(data.vitals as VitalsData);
        }
      } catch {
        // If consultation fetch fails, try patient directly
        try {
          const { data: patient } = await apiClient.get(`/patients/${patientId}`);
          setPatientInfo({
            dob: patient.dateOfBirth ?? patient.dob ?? '',
            sex: patient.gender ?? patient.sex ?? 'male',
          });
        } catch {
          // silent
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [consultationId, patientId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
        </CardContent>
      </Card>
    );
  }

  if (!patientInfo?.dob) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-sm text-muted-foreground">
            {t('specialties.pediatrics.noDobAvailable')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Stethoscope className="h-5 w-5" />
        <h2 className="text-lg font-semibold">
          {t('specialties.pediatrics.title')}
        </h2>
      </div>

      <Tabs defaultValue="growth" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="growth">
            {t('specialties.pediatrics.tabs.growth')}
          </TabsTrigger>
          <TabsTrigger value="vaccinations">
            {t('specialties.pediatrics.tabs.vaccinations')}
          </TabsTrigger>
          <TabsTrigger value="development">
            {t('specialties.pediatrics.tabs.development')}
          </TabsTrigger>
          <TabsTrigger value="vitals">
            {t('specialties.pediatrics.tabs.vitals')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="growth" className="mt-4">
          <GrowthChart
            patientId={patientId}
            patientDob={patientInfo.dob}
            patientSex={patientInfo.sex}
            consultationId={consultationId}
            readOnly={readOnly}
          />
        </TabsContent>

        <TabsContent value="vaccinations" className="mt-4">
          <VaccinationTracker
            patientId={patientId}
            patientDob={patientInfo.dob}
            consultationId={consultationId}
            readOnly={readOnly}
          />
        </TabsContent>

        <TabsContent value="development" className="mt-4">
          <DevelopmentalMilestones
            patientId={patientId}
            patientDob={patientInfo.dob}
            consultationId={consultationId}
            readOnly={readOnly}
          />
        </TabsContent>

        <TabsContent value="vitals" className="mt-4">
          <PediatricVitals
            patientId={patientId}
            patientDob={patientInfo.dob}
            consultationId={consultationId}
            patientSex={patientInfo.sex}
            vitals={vitals ?? undefined}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PediatricsPanel;
