import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CardiacRiskCalculators } from './cardiac-risk-calculators';
import { ECGFindingsForm } from './ecg-findings-form';
import { EchoResultsForm } from './echo-results-form';
import { StressTestForm } from './stress-test-form';
import { CardiacTrends } from './cardiac-trends';

interface CardiologyPanelProps {
  consultationId: string;
  patientId: string;
  specialty: string;
}

export function CardiologyPanel({ consultationId, patientId, specialty }: CardiologyPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Heart className="h-5 w-5 text-red-500" />
        <h2 className="text-lg font-semibold">
          {t('specialties.cardiology.title')}
        </h2>
      </div>

      <Tabs defaultValue="calculators" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="calculators">
            {t('specialties.cardiology.tabs.calculators')}
          </TabsTrigger>
          <TabsTrigger value="ecg">
            {t('specialties.cardiology.tabs.ecg')}
          </TabsTrigger>
          <TabsTrigger value="echo">
            {t('specialties.cardiology.tabs.echo')}
          </TabsTrigger>
          <TabsTrigger value="stressTest">
            {t('specialties.cardiology.tabs.stressTest')}
          </TabsTrigger>
          <TabsTrigger value="trends">
            {t('specialties.cardiology.tabs.trends')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculators" className="mt-4">
          <CardiacRiskCalculators
            consultationId={consultationId}
            patientId={patientId}
          />
        </TabsContent>

        <TabsContent value="ecg" className="mt-4">
          <ECGFindingsForm consultationId={consultationId} />
        </TabsContent>

        <TabsContent value="echo" className="mt-4">
          <EchoResultsForm consultationId={consultationId} />
        </TabsContent>

        <TabsContent value="stressTest" className="mt-4">
          <StressTestForm consultationId={consultationId} />
        </TabsContent>

        <TabsContent value="trends" className="mt-4">
          <CardiacTrends patientId={patientId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CardiologyPanel;
