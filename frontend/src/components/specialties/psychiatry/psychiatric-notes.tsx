import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, FileText, AlertTriangle } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { MentalStatusExam, type MSEData } from './mental-status-exam';

interface PsychiatricNotesProps {
  consultationId: string;
  patientId: string;
  readOnly?: boolean;
}

interface RiskAssessment {
  suicidalIdeation: 'none' | 'passive' | 'active-no-plan' | 'active-with-plan';
  suicidalIdeationDetails: string;
  homicidalIdeation: 'none' | 'passive' | 'active';
  homicidalIdeationDetails: string;
  selfHarm: 'none' | 'historical' | 'current';
  selfHarmDetails: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'imminent';
  protectiveFactors: string;
  riskFactors: string;
}

interface TreatmentPlan {
  psychotherapyModality: string;
  psychotherapyNotes: string;
  medicationChanges: string;
  followUpInterval: string;
  referrals: string;
  additionalRecommendations: string;
}

interface PresentationData {
  chiefComplaint: string;
  historyOfPresentIllness: string;
  appearanceNotes: string;
  behaviorNotes: string;
}

interface PsychNotesData {
  presentation: PresentationData;
  riskAssessment: RiskAssessment;
  treatmentPlan: TreatmentPlan;
}

const DEFAULT_NOTES: PsychNotesData = {
  presentation: {
    chiefComplaint: '',
    historyOfPresentIllness: '',
    appearanceNotes: '',
    behaviorNotes: '',
  },
  riskAssessment: {
    suicidalIdeation: 'none',
    suicidalIdeationDetails: '',
    homicidalIdeation: 'none',
    homicidalIdeationDetails: '',
    selfHarm: 'none',
    selfHarmDetails: '',
    riskLevel: 'low',
    protectiveFactors: '',
    riskFactors: '',
  },
  treatmentPlan: {
    psychotherapyModality: '',
    psychotherapyNotes: '',
    medicationChanges: '',
    followUpInterval: '',
    referrals: '',
    additionalRecommendations: '',
  },
};

const SI_OPTIONS = [
  { value: 'none', labelKey: 'siNone' },
  { value: 'passive', labelKey: 'siPassive' },
  { value: 'active-no-plan', labelKey: 'siActiveNoPlan' },
  { value: 'active-with-plan', labelKey: 'siActiveWithPlan' },
] as const;

const HI_OPTIONS = [
  { value: 'none', labelKey: 'hiNone' },
  { value: 'passive', labelKey: 'hiPassive' },
  { value: 'active', labelKey: 'hiActive' },
] as const;

const SH_OPTIONS = [
  { value: 'none', labelKey: 'shNone' },
  { value: 'historical', labelKey: 'shHistorical' },
  { value: 'current', labelKey: 'shCurrent' },
] as const;

const RISK_LEVELS = [
  { value: 'low', labelKey: 'riskLow', color: 'bg-green-500' },
  { value: 'moderate', labelKey: 'riskModerate', color: 'bg-yellow-500' },
  { value: 'high', labelKey: 'riskHigh', color: 'bg-orange-500' },
  { value: 'imminent', labelKey: 'riskImminent', color: 'bg-red-500' },
] as const;

const THERAPY_MODALITIES = [
  'cbt',
  'dbt',
  'psychodynamic',
  'interpersonal',
  'motivational-interviewing',
  'emdr',
  'supportive',
  'family',
  'group',
  'other',
] as const;

const FOLLOWUP_INTERVALS = [
  '1-week',
  '2-weeks',
  '3-weeks',
  '1-month',
  '6-weeks',
  '2-months',
  '3-months',
  'as-needed',
] as const;

export function PsychiatricNotes({
  consultationId,
  patientId,
  readOnly = false,
}: PsychiatricNotesProps) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState<PsychNotesData>(DEFAULT_NOTES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      const { data } = await apiClient.get(`/consultations/${consultationId}`);
      const existing = data?.customFields?.psychiatry?.notes;
      if (existing) {
        setNotes({
          presentation: { ...DEFAULT_NOTES.presentation, ...existing.presentation },
          riskAssessment: { ...DEFAULT_NOTES.riskAssessment, ...existing.riskAssessment },
          treatmentPlan: { ...DEFAULT_NOTES.treatmentPlan, ...existing.treatmentPlan },
        });
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, [consultationId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Debounced auto-save
  const debouncedSave = useCallback(
    (data: PsychNotesData) => {
      if (readOnly) return;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(async () => {
        try {
          await apiClient.patch(`/consultations/${consultationId}`, {
            customFields: {
              psychiatry: { notes: data },
            },
          });
        } catch {
          // Silent auto-save failure
        }
      }, 2000);
    },
    [consultationId, readOnly],
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const updatePresentation = useCallback(
    (field: keyof PresentationData, value: string) => {
      setNotes((prev) => {
        const updated = {
          ...prev,
          presentation: { ...prev.presentation, [field]: value },
        };
        debouncedSave(updated);
        return updated;
      });
    },
    [debouncedSave],
  );

  const updateRisk = useCallback(
    (field: keyof RiskAssessment, value: string) => {
      setNotes((prev) => {
        const updated = {
          ...prev,
          riskAssessment: { ...prev.riskAssessment, [field]: value },
        };
        debouncedSave(updated);
        return updated;
      });
    },
    [debouncedSave],
  );

  const updateTreatment = useCallback(
    (field: keyof TreatmentPlan, value: string) => {
      setNotes((prev) => {
        const updated = {
          ...prev,
          treatmentPlan: { ...prev.treatmentPlan, [field]: value },
        };
        debouncedSave(updated);
        return updated;
      });
    },
    [debouncedSave],
  );

  const handleManualSave = useCallback(async () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    setSaving(true);
    try {
      await apiClient.patch(`/consultations/${consultationId}`, {
        customFields: {
          psychiatry: { notes },
        },
      });
      toast.success(t('specialties.psychiatry.notesSaved'));
    } catch {
      toast.error(t('specialties.psychiatry.notesSaveError'));
    } finally {
      setSaving(false);
    }
  }, [consultationId, notes, t]);

  const currentRiskLevel = RISK_LEVELS.find(
    (r) => r.value === notes.riskAssessment.riskLevel,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">
            {t('specialties.psychiatry.psychiatricNotes')}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {currentRiskLevel && currentRiskLevel.value !== 'low' && (
            <Badge
              variant="outline"
              className={`border-2 ${currentRiskLevel.color.replace('bg-', 'border-')} ${currentRiskLevel.color.replace('bg-', 'text-')}`}
            >
              <AlertTriangle className="mr-1 h-3 w-3" />
              {t(`specialties.psychiatry.${currentRiskLevel.labelKey}`)}
            </Badge>
          )}
          {!readOnly && (
            <Button size="sm" onClick={handleManualSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {t('specialties.psychiatry.saveNotes')}
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="presentation" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="presentation">
            {t('specialties.psychiatry.presentation')}
          </TabsTrigger>
          <TabsTrigger value="mse">
            {t('specialties.psychiatry.mseTab')}
          </TabsTrigger>
          <TabsTrigger value="risk">
            {t('specialties.psychiatry.riskAssessment')}
            {notes.riskAssessment.riskLevel !== 'low' && (
              <span className={`ml-1.5 inline-block h-2 w-2 rounded-full ${currentRiskLevel?.color}`} />
            )}
          </TabsTrigger>
          <TabsTrigger value="treatment">
            {t('specialties.psychiatry.treatmentPlanTab')}
          </TabsTrigger>
        </TabsList>

        {/* Presentation Tab */}
        <TabsContent value="presentation" className="space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {t('specialties.psychiatry.chiefComplaint')}
                </Label>
                <Textarea
                  value={notes.presentation.chiefComplaint}
                  onChange={(e) =>
                    updatePresentation('chiefComplaint', e.target.value)
                  }
                  placeholder={t('specialties.psychiatry.chiefComplaintPlaceholder')}
                  disabled={readOnly}
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {t('specialties.psychiatry.hpi')}
                </Label>
                <Textarea
                  value={notes.presentation.historyOfPresentIllness}
                  onChange={(e) =>
                    updatePresentation('historyOfPresentIllness', e.target.value)
                  }
                  placeholder={t('specialties.psychiatry.hpiPlaceholder')}
                  disabled={readOnly}
                  rows={5}
                />
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    {t('specialties.psychiatry.appearanceNotes')}
                  </Label>
                  <Textarea
                    value={notes.presentation.appearanceNotes}
                    onChange={(e) =>
                      updatePresentation('appearanceNotes', e.target.value)
                    }
                    placeholder={t('specialties.psychiatry.appearanceNotesPlaceholder')}
                    disabled={readOnly}
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    {t('specialties.psychiatry.behaviorNotes')}
                  </Label>
                  <Textarea
                    value={notes.presentation.behaviorNotes}
                    onChange={(e) =>
                      updatePresentation('behaviorNotes', e.target.value)
                    }
                    placeholder={t('specialties.psychiatry.behaviorNotesPlaceholder')}
                    disabled={readOnly}
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MSE Tab */}
        <TabsContent value="mse">
          <MentalStatusExam
            consultationId={consultationId}
            patientId={patientId}
            readOnly={readOnly}
          />
        </TabsContent>

        {/* Risk Assessment Tab */}
        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                {t('specialties.psychiatry.riskAssessment')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overall Risk Level */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t('specialties.psychiatry.overallRiskLevel')}
                </Label>
                <div className="flex gap-2">
                  {RISK_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => updateRisk('riskLevel', level.value)}
                      disabled={readOnly}
                      className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                        notes.riskAssessment.riskLevel === level.value
                          ? `${level.color} border-transparent text-white`
                          : 'border-border bg-background hover:bg-accent'
                      } disabled:cursor-default disabled:opacity-50`}
                    >
                      {t(`specialties.psychiatry.${level.labelKey}`)}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Suicidal Ideation */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  {t('specialties.psychiatry.suicidalIdeation')}
                </Label>
                <Select
                  value={notes.riskAssessment.suicidalIdeation}
                  onValueChange={(val) => updateRisk('suicidalIdeation', val)}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SI_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {t(`specialties.psychiatry.${opt.labelKey}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {notes.riskAssessment.suicidalIdeation !== 'none' && (
                  <Textarea
                    value={notes.riskAssessment.suicidalIdeationDetails}
                    onChange={(e) =>
                      updateRisk('suicidalIdeationDetails', e.target.value)
                    }
                    placeholder={t('specialties.psychiatry.siDetailsPlaceholder')}
                    disabled={readOnly}
                    rows={2}
                    className="border-red-200"
                  />
                )}
              </div>

              {/* Homicidal Ideation */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  {t('specialties.psychiatry.homicidalIdeation')}
                </Label>
                <Select
                  value={notes.riskAssessment.homicidalIdeation}
                  onValueChange={(val) => updateRisk('homicidalIdeation', val)}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HI_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {t(`specialties.psychiatry.${opt.labelKey}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {notes.riskAssessment.homicidalIdeation !== 'none' && (
                  <Textarea
                    value={notes.riskAssessment.homicidalIdeationDetails}
                    onChange={(e) =>
                      updateRisk('homicidalIdeationDetails', e.target.value)
                    }
                    placeholder={t('specialties.psychiatry.hiDetailsPlaceholder')}
                    disabled={readOnly}
                    rows={2}
                    className="border-red-200"
                  />
                )}
              </div>

              {/* Self-Harm */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  {t('specialties.psychiatry.selfHarm')}
                </Label>
                <Select
                  value={notes.riskAssessment.selfHarm}
                  onValueChange={(val) => updateRisk('selfHarm', val)}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SH_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {t(`specialties.psychiatry.${opt.labelKey}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {notes.riskAssessment.selfHarm !== 'none' && (
                  <Textarea
                    value={notes.riskAssessment.selfHarmDetails}
                    onChange={(e) =>
                      updateRisk('selfHarmDetails', e.target.value)
                    }
                    placeholder={t('specialties.psychiatry.shDetailsPlaceholder')}
                    disabled={readOnly}
                    rows={2}
                  />
                )}
              </div>

              <Separator />

              {/* Risk/Protective Factors */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    {t('specialties.psychiatry.riskFactors')}
                  </Label>
                  <Textarea
                    value={notes.riskAssessment.riskFactors}
                    onChange={(e) =>
                      updateRisk('riskFactors', e.target.value)
                    }
                    placeholder={t('specialties.psychiatry.riskFactorsPlaceholder')}
                    disabled={readOnly}
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    {t('specialties.psychiatry.protectiveFactors')}
                  </Label>
                  <Textarea
                    value={notes.riskAssessment.protectiveFactors}
                    onChange={(e) =>
                      updateRisk('protectiveFactors', e.target.value)
                    }
                    placeholder={t('specialties.psychiatry.protectiveFactorsPlaceholder')}
                    disabled={readOnly}
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Treatment Plan Tab */}
        <TabsContent value="treatment" className="space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    {t('specialties.psychiatry.psychotherapyModality')}
                  </Label>
                  <Select
                    value={notes.treatmentPlan.psychotherapyModality}
                    onValueChange={(val) =>
                      updateTreatment('psychotherapyModality', val)
                    }
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('specialties.psychiatry.selectModality')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {THERAPY_MODALITIES.map((mod) => (
                        <SelectItem key={mod} value={mod}>
                          {t(`specialties.psychiatry.modality.${mod}`, mod)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    {t('specialties.psychiatry.followUpInterval')}
                  </Label>
                  <Select
                    value={notes.treatmentPlan.followUpInterval}
                    onValueChange={(val) =>
                      updateTreatment('followUpInterval', val)
                    }
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('specialties.psychiatry.selectInterval')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {FOLLOWUP_INTERVALS.map((interval) => (
                        <SelectItem key={interval} value={interval}>
                          {t(`specialties.psychiatry.interval.${interval}`, interval)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {t('specialties.psychiatry.psychotherapyNotes')}
                </Label>
                <Textarea
                  value={notes.treatmentPlan.psychotherapyNotes}
                  onChange={(e) =>
                    updateTreatment('psychotherapyNotes', e.target.value)
                  }
                  placeholder={t('specialties.psychiatry.psychotherapyNotesPlaceholder')}
                  disabled={readOnly}
                  rows={3}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {t('specialties.psychiatry.medicationChanges')}
                </Label>
                <Textarea
                  value={notes.treatmentPlan.medicationChanges}
                  onChange={(e) =>
                    updateTreatment('medicationChanges', e.target.value)
                  }
                  placeholder={t('specialties.psychiatry.medicationChangesPlaceholder')}
                  disabled={readOnly}
                  rows={3}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {t('specialties.psychiatry.referrals')}
                </Label>
                <Textarea
                  value={notes.treatmentPlan.referrals}
                  onChange={(e) =>
                    updateTreatment('referrals', e.target.value)
                  }
                  placeholder={t('specialties.psychiatry.referralsPlaceholder')}
                  disabled={readOnly}
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {t('specialties.psychiatry.additionalRecommendations')}
                </Label>
                <Textarea
                  value={notes.treatmentPlan.additionalRecommendations}
                  onChange={(e) =>
                    updateTreatment('additionalRecommendations', e.target.value)
                  }
                  placeholder={t('specialties.psychiatry.additionalRecommendationsPlaceholder')}
                  disabled={readOnly}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
