import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, ClipboardList } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

interface MentalStatusExamProps {
  consultationId: string;
  patientId: string;
  readOnly?: boolean;
  onDataChange?: (data: MSEData) => void;
}

export interface MSEData {
  appearance: {
    grooming: string;
    attire: string;
    eyeContact: string;
  };
  behavior: {
    psychomotor: string;
    cooperation: string;
  };
  speech: {
    rate: string;
    volume: string;
    fluency: string;
  };
  mood: string;
  affect: {
    range: string;
    congruence: string;
  };
  thoughtProcess: string;
  thoughtContent: {
    suicidalIdeation: string;
    homicidalIdeation: string;
    delusions: string;
    obsessions: string;
  };
  perception: {
    hallucinations: string[];
  };
  cognition: {
    orientation: {
      person: boolean;
      place: boolean;
      time: boolean;
      situation: boolean;
    };
    attention: string;
    memory: string;
  };
  insight: string;
  judgment: string;
  additionalNotes: string;
}

const DEFAULT_MSE: MSEData = {
  appearance: { grooming: '', attire: '', eyeContact: '' },
  behavior: { psychomotor: '', cooperation: '' },
  speech: { rate: '', volume: '', fluency: '' },
  mood: '',
  affect: { range: '', congruence: '' },
  thoughtProcess: '',
  thoughtContent: {
    suicidalIdeation: 'none',
    homicidalIdeation: 'none',
    delusions: 'none',
    obsessions: '',
  },
  perception: { hallucinations: [] },
  cognition: {
    orientation: { person: true, place: true, time: true, situation: true },
    attention: '',
    memory: '',
  },
  insight: '',
  judgment: '',
  additionalNotes: '',
};

// Option definitions for dropdowns
const OPTIONS = {
  grooming: ['well-groomed', 'disheveled', 'bizarre', 'unkempt'],
  attire: ['appropriate', 'inappropriate', 'disheveled', 'bizarre'],
  eyeContact: ['good', 'fair', 'poor', 'avoidant', 'intense'],
  psychomotor: ['normal', 'agitated', 'retarded', 'restless', 'catatonic'],
  cooperation: ['cooperative', 'guarded', 'hostile', 'uncooperative', 'withdrawn'],
  speechRate: ['normal', 'rapid', 'slow', 'pressured'],
  speechVolume: ['normal', 'loud', 'soft', 'whispered'],
  speechFluency: ['fluent', 'halting', 'impoverished', 'stuttering'],
  mood: ['euthymic', 'depressed', 'anxious', 'irritable', 'euphoric', 'angry', 'dysphoric', 'apathetic'],
  affectRange: ['full', 'restricted', 'blunted', 'flat', 'labile'],
  affectCongruence: ['congruent', 'incongruent'],
  thoughtProcess: ['linear', 'circumstantial', 'tangential', 'loose-associations', 'flight-of-ideas', 'perseverative', 'thought-blocking'],
  suicidalIdeation: ['none', 'passive', 'active'],
  homicidalIdeation: ['none', 'present'],
  delusions: ['none', 'paranoid', 'grandiose', 'somatic', 'referential', 'other'],
  hallucinations: ['auditory', 'visual', 'tactile', 'olfactory', 'gustatory'],
  attention: ['intact', 'mildly-impaired', 'moderately-impaired', 'severely-impaired'],
  memory: ['intact', 'mildly-impaired', 'moderately-impaired', 'severely-impaired'],
  insight: ['good', 'fair', 'poor'],
  judgment: ['good', 'fair', 'poor'],
} as const;

export function MentalStatusExam({
  consultationId,
  patientId,
  readOnly = false,
  onDataChange,
}: MentalStatusExamProps) {
  const { t } = useTranslation();
  const [mse, setMse] = useState<MSEData>(DEFAULT_MSE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchMSE = useCallback(async () => {
    try {
      const { data } = await apiClient.get(`/consultations/${consultationId}`);
      const existing = data?.customFields?.psychiatry?.mse;
      if (existing) {
        setMse({ ...DEFAULT_MSE, ...existing });
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, [consultationId]);

  useEffect(() => {
    fetchMSE();
  }, [fetchMSE]);

  const updateField = useCallback(
    <T extends keyof MSEData>(
      section: T,
      field: string | null,
      value: unknown,
    ) => {
      setMse((prev) => {
        let updated: MSEData;
        if (field === null) {
          updated = { ...prev, [section]: value };
        } else {
          const sectionData = prev[section];
          if (typeof sectionData === 'object' && sectionData !== null) {
            updated = {
              ...prev,
              [section]: { ...sectionData, [field]: value },
            };
          } else {
            updated = prev;
          }
        }
        onDataChange?.(updated);
        return updated;
      });
    },
    [onDataChange],
  );

  const toggleHallucination = useCallback(
    (type: string) => {
      if (readOnly) return;
      setMse((prev) => {
        const current = prev.perception.hallucinations;
        const updated = current.includes(type)
          ? current.filter((h) => h !== type)
          : [...current, type];
        const newMse = {
          ...prev,
          perception: { ...prev.perception, hallucinations: updated },
        };
        onDataChange?.(newMse);
        return newMse;
      });
    },
    [readOnly, onDataChange],
  );

  const toggleOrientation = useCallback(
    (field: keyof MSEData['cognition']['orientation']) => {
      if (readOnly) return;
      setMse((prev) => {
        const newMse = {
          ...prev,
          cognition: {
            ...prev.cognition,
            orientation: {
              ...prev.cognition.orientation,
              [field]: !prev.cognition.orientation[field],
            },
          },
        };
        onDataChange?.(newMse);
        return newMse;
      });
    },
    [readOnly, onDataChange],
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await apiClient.patch(`/consultations/${consultationId}`, {
        customFields: {
          psychiatry: { mse },
        },
      });
      toast.success(t('specialties.psychiatry.mseSaved'));
    } catch {
      toast.error(t('specialties.psychiatry.mseSaveError'));
    } finally {
      setSaving(false);
    }
  }, [consultationId, mse, t]);

  // Helper to render a select field
  const renderSelect = (
    label: string,
    value: string,
    options: readonly string[],
    onChange: (val: string) => void,
  ) => (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={readOnly}>
        <SelectTrigger>
          <SelectValue
            placeholder={t('specialties.psychiatry.selectPlaceholder')}
          />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {t(`specialties.psychiatry.mseOptions.${opt}`, opt)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">
            {t('specialties.psychiatry.mentalStatusExam')}
          </h3>
        </div>
        {!readOnly && (
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {t('specialties.psychiatry.saveMSE')}
          </Button>
        )}
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {t('specialties.psychiatry.mseAppearance')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {renderSelect(
              t('specialties.psychiatry.grooming'),
              mse.appearance.grooming,
              OPTIONS.grooming,
              (val) => updateField('appearance', 'grooming', val),
            )}
            {renderSelect(
              t('specialties.psychiatry.attire'),
              mse.appearance.attire,
              OPTIONS.attire,
              (val) => updateField('appearance', 'attire', val),
            )}
            {renderSelect(
              t('specialties.psychiatry.eyeContact'),
              mse.appearance.eyeContact,
              OPTIONS.eyeContact,
              (val) => updateField('appearance', 'eyeContact', val),
            )}
          </div>
        </CardContent>
      </Card>

      {/* Behavior */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {t('specialties.psychiatry.mseBehavior')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {renderSelect(
              t('specialties.psychiatry.psychomotor'),
              mse.behavior.psychomotor,
              OPTIONS.psychomotor,
              (val) => updateField('behavior', 'psychomotor', val),
            )}
            {renderSelect(
              t('specialties.psychiatry.cooperation'),
              mse.behavior.cooperation,
              OPTIONS.cooperation,
              (val) => updateField('behavior', 'cooperation', val),
            )}
          </div>
        </CardContent>
      </Card>

      {/* Speech */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {t('specialties.psychiatry.mseSpeech')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {renderSelect(
              t('specialties.psychiatry.speechRate'),
              mse.speech.rate,
              OPTIONS.speechRate,
              (val) => updateField('speech', 'rate', val),
            )}
            {renderSelect(
              t('specialties.psychiatry.speechVolume'),
              mse.speech.volume,
              OPTIONS.speechVolume,
              (val) => updateField('speech', 'volume', val),
            )}
            {renderSelect(
              t('specialties.psychiatry.speechFluency'),
              mse.speech.fluency,
              OPTIONS.speechFluency,
              (val) => updateField('speech', 'fluency', val),
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mood & Affect */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {t('specialties.psychiatry.mseMoodAffect')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {renderSelect(
              t('specialties.psychiatry.mood'),
              mse.mood,
              OPTIONS.mood,
              (val) => updateField('mood', null, val),
            )}
            {renderSelect(
              t('specialties.psychiatry.affectRange'),
              mse.affect.range,
              OPTIONS.affectRange,
              (val) => updateField('affect', 'range', val),
            )}
            {renderSelect(
              t('specialties.psychiatry.affectCongruence'),
              mse.affect.congruence,
              OPTIONS.affectCongruence,
              (val) => updateField('affect', 'congruence', val),
            )}
          </div>
        </CardContent>
      </Card>

      {/* Thought Process & Content */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {t('specialties.psychiatry.mseThought')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {renderSelect(
              t('specialties.psychiatry.thoughtProcess'),
              mse.thoughtProcess,
              OPTIONS.thoughtProcess,
              (val) => updateField('thoughtProcess', null, val),
            )}
            {renderSelect(
              t('specialties.psychiatry.delusions'),
              mse.thoughtContent.delusions,
              OPTIONS.delusions,
              (val) => updateField('thoughtContent', 'delusions', val),
            )}
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            {renderSelect(
              t('specialties.psychiatry.suicidalIdeation'),
              mse.thoughtContent.suicidalIdeation,
              OPTIONS.suicidalIdeation,
              (val) => updateField('thoughtContent', 'suicidalIdeation', val),
            )}
            {renderSelect(
              t('specialties.psychiatry.homicidalIdeation'),
              mse.thoughtContent.homicidalIdeation,
              OPTIONS.homicidalIdeation,
              (val) => updateField('thoughtContent', 'homicidalIdeation', val),
            )}
          </div>

          {/* SI/HI warnings */}
          {mse.thoughtContent.suicidalIdeation !== 'none' && (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
              {t('specialties.psychiatry.siWarning')}
            </div>
          )}
          {mse.thoughtContent.homicidalIdeation !== 'none' && (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
              {t('specialties.psychiatry.hiWarning')}
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-sm">
              {t('specialties.psychiatry.obsessions')}
            </Label>
            <Textarea
              value={mse.thoughtContent.obsessions}
              onChange={(e) =>
                updateField('thoughtContent', 'obsessions', e.target.value)
              }
              placeholder={t('specialties.psychiatry.obsessionsPlaceholder')}
              disabled={readOnly}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Perception */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {t('specialties.psychiatry.msePerception')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="mb-3 block text-sm">
            {t('specialties.psychiatry.hallucinations')}
          </Label>
          <div className="flex flex-wrap gap-4">
            {OPTIONS.hallucinations.map((type) => (
              <div key={type} className="flex items-center gap-2">
                <Checkbox
                  id={`hallucination-${type}`}
                  checked={mse.perception.hallucinations.includes(type)}
                  onCheckedChange={() => toggleHallucination(type)}
                  disabled={readOnly}
                />
                <Label
                  htmlFor={`hallucination-${type}`}
                  className="text-sm font-normal"
                >
                  {t(`specialties.psychiatry.mseOptions.${type}`, type)}
                </Label>
              </div>
            ))}
          </div>
          {mse.perception.hallucinations.length === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              {t('specialties.psychiatry.noHallucinations')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Cognition */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {t('specialties.psychiatry.mseCognition')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Orientation checkboxes */}
          <div className="space-y-2">
            <Label className="text-sm">
              {t('specialties.psychiatry.orientation')}
            </Label>
            <div className="flex flex-wrap gap-4">
              {(
                ['person', 'place', 'time', 'situation'] as const
              ).map((field) => (
                <div key={field} className="flex items-center gap-2">
                  <Checkbox
                    id={`orientation-${field}`}
                    checked={mse.cognition.orientation[field]}
                    onCheckedChange={() => toggleOrientation(field)}
                    disabled={readOnly}
                  />
                  <Label
                    htmlFor={`orientation-${field}`}
                    className="text-sm font-normal"
                  >
                    {t(`specialties.psychiatry.orientation${field.charAt(0).toUpperCase() + field.slice(1)}`)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {renderSelect(
              t('specialties.psychiatry.attention'),
              mse.cognition.attention,
              OPTIONS.attention,
              (val) =>
                setMse((prev) => {
                  const updated = {
                    ...prev,
                    cognition: { ...prev.cognition, attention: val },
                  };
                  onDataChange?.(updated);
                  return updated;
                }),
            )}
            {renderSelect(
              t('specialties.psychiatry.memory'),
              mse.cognition.memory,
              OPTIONS.memory,
              (val) =>
                setMse((prev) => {
                  const updated = {
                    ...prev,
                    cognition: { ...prev.cognition, memory: val },
                  };
                  onDataChange?.(updated);
                  return updated;
                }),
            )}
          </div>
        </CardContent>
      </Card>

      {/* Insight & Judgment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {t('specialties.psychiatry.mseInsightJudgment')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {renderSelect(
              t('specialties.psychiatry.insight'),
              mse.insight,
              OPTIONS.insight,
              (val) => updateField('insight', null, val),
            )}
            {renderSelect(
              t('specialties.psychiatry.judgment'),
              mse.judgment,
              OPTIONS.judgment,
              (val) => updateField('judgment', null, val),
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {t('specialties.psychiatry.additionalNotes')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={mse.additionalNotes}
            onChange={(e) =>
              updateField('additionalNotes', null, e.target.value)
            }
            placeholder={t('specialties.psychiatry.additionalNotesPlaceholder')}
            disabled={readOnly}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Bottom save */}
      {!readOnly && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {t('specialties.psychiatry.saveMSE')}
          </Button>
        </div>
      )}
    </div>
  );
}
