import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VisualAcuity, VisualAcuityData } from './visual-acuity';
import { IOPTracker, IOPData } from './iop-tracker';
import { AnteriorSegment, AnteriorSegmentData } from './anterior-segment';
import { FundusExam, FundusData } from './fundus-exam';
import { RefractionEntry, RefractionData } from './refraction-entry';
import apiClient from '@/lib/api-client';

interface OphthalmologyPanelProps {
  consultationId: string;
  patientId: string;
  specialty: string;
}

interface OphthalmologyCustomFields {
  visualAcuity?: VisualAcuityData;
  iop?: IOPData;
  anteriorSegment?: AnteriorSegmentData;
  fundus?: FundusData;
  refraction?: RefractionData;
}

export function OphthalmologyPanel({ consultationId, patientId, specialty }: OphthalmologyPanelProps) {
  const { t } = useTranslation();
  const [existingData, setExistingData] = useState<OphthalmologyCustomFields>({});
  const [loading, setLoading] = useState(true);

  const fetchExistingData = useCallback(async () => {
    try {
      const res = await apiClient.get(`/consultations/${consultationId}`);
      const ophthalmologyData = res.data?.customFields?.ophthalmology || {};
      setExistingData(ophthalmologyData);
    } catch {
      // No existing data - that's fine
    } finally {
      setLoading(false);
    }
  }, [consultationId]);

  useEffect(() => {
    fetchExistingData();
  }, [fetchExistingData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Eye className="h-5 w-5 text-blue-500" />
        <h2 className="text-lg font-semibold">
          {t('specialties.ophthalmology.title')}
        </h2>
      </div>

      <Tabs defaultValue="visualAcuity" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="visualAcuity">
            {t('specialties.ophthalmology.tabs.visualAcuity')}
          </TabsTrigger>
          <TabsTrigger value="iop">
            {t('specialties.ophthalmology.tabs.iop')}
          </TabsTrigger>
          <TabsTrigger value="anteriorSegment">
            {t('specialties.ophthalmology.tabs.anteriorSegment')}
          </TabsTrigger>
          <TabsTrigger value="fundus">
            {t('specialties.ophthalmology.tabs.fundus')}
          </TabsTrigger>
          <TabsTrigger value="refraction">
            {t('specialties.ophthalmology.tabs.refraction')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visualAcuity" className="mt-4">
          <VisualAcuity
            consultationId={consultationId}
            existingData={existingData.visualAcuity}
          />
        </TabsContent>

        <TabsContent value="iop" className="mt-4">
          <IOPTracker
            patientId={patientId}
            consultationId={consultationId}
            existingData={existingData.iop}
          />
        </TabsContent>

        <TabsContent value="anteriorSegment" className="mt-4">
          <AnteriorSegment
            consultationId={consultationId}
            existingData={existingData.anteriorSegment}
          />
        </TabsContent>

        <TabsContent value="fundus" className="mt-4">
          <FundusExam
            consultationId={consultationId}
            existingData={existingData.fundus}
          />
        </TabsContent>

        <TabsContent value="refraction" className="mt-4">
          <RefractionEntry
            consultationId={consultationId}
            existingData={existingData.refraction}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default OphthalmologyPanel;
