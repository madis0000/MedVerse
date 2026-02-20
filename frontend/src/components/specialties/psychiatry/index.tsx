import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ClipboardCheck,
  SmilePlus,
  ClipboardList,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { PHQ9 } from './phq9';
import { GAD7 } from './gad7';
import { MoodTracker } from './mood-tracker';
import { MentalStatusExam } from './mental-status-exam';
import { SafetyPlan } from './safety-plan';
import { TreatmentResponse } from './treatment-response';
import { INSTRUMENTS } from '@/lib/screening-instruments';
import { ScreeningInstrumentForm } from './screening-instrument';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

interface PsychiatryPanelProps {
  consultationId: string;
  patientId: string;
  specialty: string;
}

export function PsychiatryPanel({
  consultationId,
  patientId,
  specialty,
}: PsychiatryPanelProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('screening');

  // For the generic screening selector
  const [selectedInstrument, setSelectedInstrument] = useState<string>('PHQ9');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {specialty}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {t('specialties.psychiatry.panelTitle')}
        </span>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="screening" className="flex items-center gap-1.5">
            <ClipboardCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {t('specialties.psychiatry.tabs.screening')}
            </span>
            <span className="sm:hidden">
              {t('specialties.psychiatry.tabs.screeningShort')}
            </span>
          </TabsTrigger>
          <TabsTrigger value="mood" className="flex items-center gap-1.5">
            <SmilePlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {t('specialties.psychiatry.tabs.moodSymptoms')}
            </span>
            <span className="sm:hidden">
              {t('specialties.psychiatry.tabs.moodShort')}
            </span>
          </TabsTrigger>
          <TabsTrigger value="mse" className="flex items-center gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {t('specialties.psychiatry.tabs.mse')}
            </span>
            <span className="sm:hidden">MSE</span>
          </TabsTrigger>
          <TabsTrigger value="safety" className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {t('specialties.psychiatry.tabs.safetyPlan')}
            </span>
            <span className="sm:hidden">
              {t('specialties.psychiatry.tabs.safetyShort')}
            </span>
          </TabsTrigger>
          <TabsTrigger value="treatment" className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {t('specialties.psychiatry.tabs.treatmentResponse')}
            </span>
            <span className="sm:hidden">
              {t('specialties.psychiatry.tabs.treatmentShort')}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Screening Tab */}
        <TabsContent value="screening" className="space-y-6">
          {/* Instrument selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t('specialties.psychiatry.selectInstrument')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedInstrument}
                onValueChange={setSelectedInstrument}
              >
                <SelectTrigger className="w-full sm:w-80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INSTRUMENTS).map(([key, inst]) => (
                    <SelectItem key={key} value={key}>
                      {inst.abbreviation} - {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Render appropriate wrapper component */}
          {selectedInstrument === 'PHQ9' && (
            <PHQ9
              consultationId={consultationId}
              patientId={patientId}
            />
          )}
          {selectedInstrument === 'GAD7' && (
            <GAD7
              consultationId={consultationId}
              patientId={patientId}
            />
          )}
          {selectedInstrument !== 'PHQ9' && selectedInstrument !== 'GAD7' && (
            <GenericScreening
              instrumentId={selectedInstrument}
              consultationId={consultationId}
              patientId={patientId}
            />
          )}
        </TabsContent>

        {/* Mood & Symptoms Tab */}
        <TabsContent value="mood">
          <MoodTracker
            consultationId={consultationId}
            patientId={patientId}
          />
        </TabsContent>

        {/* MSE Tab */}
        <TabsContent value="mse">
          <MentalStatusExam
            consultationId={consultationId}
            patientId={patientId}
          />
        </TabsContent>

        {/* Safety Plan Tab */}
        <TabsContent value="safety">
          <SafetyPlan
            consultationId={consultationId}
            patientId={patientId}
          />
        </TabsContent>

        {/* Treatment Response Tab */}
        <TabsContent value="treatment">
          <TreatmentResponse
            consultationId={consultationId}
            patientId={patientId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Generic screening wrapper for AUDIT, CAGE, etc.
function GenericScreening({
  instrumentId,
  consultationId,
  patientId,
}: {
  instrumentId: string;
  consultationId: string;
  patientId: string;
}) {
  const { t } = useTranslation();
  const instrument = INSTRUMENTS[instrumentId];

  if (!instrument) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t('specialties.psychiatry.instrumentNotFound')}
        </CardContent>
      </Card>
    );
  }

  const handleComplete = async (score: number, responses: number[]) => {
    try {
      const result = instrument.scoringFunction(responses);
      await apiClient.post(`/consultations/${consultationId}/screenings`, {
        instrumentType: instrumentId,
        score,
        severity: result.severity,
        responses,
      });
      toast.success(t('specialties.psychiatry.screeningSaved'));
    } catch {
      toast.error(t('specialties.psychiatry.screeningSaveError'));
    }
  };

  return (
    <ScreeningInstrumentForm
      instrument={instrument}
      consultationId={consultationId}
      patientId={patientId}
      onComplete={handleComplete}
    />
  );
}

export default PsychiatryPanel;
