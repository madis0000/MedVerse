import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Trash2, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { LesionRecord } from './lesion-body-map';
import { ABCDEScoring, type ABCDEScore } from './abcde-scoring';

interface LesionDetailFormProps {
  lesion: LesionRecord | null;
  onSave: (lesion: LesionRecord) => void;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
}

const MORPHOLOGY_TYPES = [
  'macule', 'papule', 'nodule', 'vesicle', 'plaque', 'patch',
  'pustule', 'bulla', 'wheal', 'ulcer', 'erosion', 'cyst',
] as const;

const COLOR_OPTIONS = [
  'skinColored', 'red', 'brown', 'black', 'white', 'blue', 'yellow', 'purple',
] as const;

const SHAPE_OPTIONS = [
  'round', 'oval', 'irregular', 'annular', 'linear', 'serpiginous', 'polygonal',
] as const;

const BORDER_OPTIONS = [
  'wellDefined', 'illDefined', 'raised', 'flat', 'rolled', 'undermined',
] as const;

const DISTRIBUTION_OPTIONS = [
  'isolated', 'grouped', 'scattered', 'dermatomal', 'bilateral',
  'generalized', 'acral', 'photodistributed',
] as const;

const SURFACE_OPTIONS = [
  'smooth', 'rough', 'scaly', 'crusted', 'eroded', 'ulcerated',
  'verrucous', 'atrophic',
] as const;

export function LesionDetailForm({
  lesion,
  onSave,
  onDelete,
  readOnly = false,
}: LesionDetailFormProps) {
  const { t } = useTranslation();
  const [showABCDE, setShowABCDE] = useState(false);

  // Form state
  const [region, setRegion] = useState('');
  const [type, setType] = useState('');
  const [color, setColor] = useState('');
  const [shape, setShape] = useState('');
  const [size, setSize] = useState('');
  const [border, setBorder] = useState('');
  const [distribution, setDistribution] = useState('');
  const [surface, setSurface] = useState('');
  const [dermoscopyFindings, setDermoscopyFindings] = useState('');
  const [notes, setNotes] = useState('');
  const [biopsyOrdered, setBiopsyOrdered] = useState(false);
  const [biopsyResult, setBiopsyResult] = useState('');
  const [abcdeScore, setAbcdeScore] = useState<ABCDEScore | undefined>(undefined);

  // Populate form when lesion changes
  useEffect(() => {
    if (lesion) {
      setRegion(lesion.region || '');
      setType(lesion.type || '');
      setColor(lesion.color || '');
      setShape(lesion.shape || '');
      setSize(lesion.size || '');
      setBorder(lesion.border || '');
      setDistribution(lesion.distribution || '');
      setSurface(lesion.surface || '');
      setDermoscopyFindings(lesion.dermoscopyFindings || '');
      setNotes(lesion.notes || '');
      setBiopsyOrdered(lesion.biopsyOrdered || false);
      setBiopsyResult(lesion.biopsyResult || '');
      setAbcdeScore(lesion.abcdeScore);
    }
  }, [lesion]);

  const handleSave = useCallback(() => {
    if (!lesion) return;

    const updated: LesionRecord = {
      ...lesion,
      region,
      type,
      color,
      shape,
      size,
      border,
      distribution,
      surface,
      dermoscopyFindings,
      notes,
      biopsyOrdered,
      biopsyResult: biopsyOrdered ? biopsyResult : '',
      abcdeScore,
      updatedAt: new Date().toISOString(),
    };

    onSave(updated);
  }, [
    lesion, region, type, color, shape, size, border,
    distribution, surface, dermoscopyFindings, notes,
    biopsyOrdered, biopsyResult, abcdeScore, onSave,
  ]);

  const handleABCDEScore = useCallback(
    (score: ABCDEScore) => {
      setAbcdeScore(score);
      setShowABCDE(false);
    },
    [],
  );

  if (!lesion) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">
            {t('specialties.dermatology.lesionForm.selectPrompt')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {t('specialties.dermatology.lesionForm.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Region */}
          <div className="space-y-2">
            <Label>{t('specialties.dermatology.lesionForm.region')}</Label>
            <Input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              disabled={readOnly}
              placeholder={t('specialties.dermatology.lesionForm.regionPlaceholder')}
            />
          </div>

          {/* Morphology Type */}
          <div className="space-y-2">
            <Label>{t('specialties.dermatology.lesionForm.morphologyType')}</Label>
            <Select value={type} onValueChange={setType} disabled={readOnly}>
              <SelectTrigger>
                <SelectValue placeholder={t('specialties.dermatology.lesionForm.selectType')} />
              </SelectTrigger>
              <SelectContent>
                {MORPHOLOGY_TYPES.map((mt) => (
                  <SelectItem key={mt} value={mt}>
                    {t(`specialties.dermatology.morphologyTypes.${mt}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>{t('specialties.dermatology.lesionForm.color')}</Label>
            <Select value={color} onValueChange={setColor} disabled={readOnly}>
              <SelectTrigger>
                <SelectValue placeholder={t('specialties.dermatology.lesionForm.selectColor')} />
              </SelectTrigger>
              <SelectContent>
                {COLOR_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`specialties.dermatology.colors.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Shape */}
          <div className="space-y-2">
            <Label>{t('specialties.dermatology.lesionForm.shape')}</Label>
            <Select value={shape} onValueChange={setShape} disabled={readOnly}>
              <SelectTrigger>
                <SelectValue placeholder={t('specialties.dermatology.lesionForm.selectShape')} />
              </SelectTrigger>
              <SelectContent>
                {SHAPE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`specialties.dermatology.shapes.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Size */}
          <div className="space-y-2">
            <Label>{t('specialties.dermatology.lesionForm.size')}</Label>
            <div className="flex items-center gap-2">
              <Input
                value={size}
                onChange={(e) => setSize(e.target.value)}
                disabled={readOnly}
                placeholder={t('specialties.dermatology.lesionForm.sizePlaceholder')}
                className="max-w-[180px]"
              />
              <span className="text-sm text-muted-foreground">mm</span>
            </div>
          </div>

          {/* Border */}
          <div className="space-y-2">
            <Label>{t('specialties.dermatology.lesionForm.border')}</Label>
            <Select value={border} onValueChange={setBorder} disabled={readOnly}>
              <SelectTrigger>
                <SelectValue placeholder={t('specialties.dermatology.lesionForm.selectBorder')} />
              </SelectTrigger>
              <SelectContent>
                {BORDER_OPTIONS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {t(`specialties.dermatology.borders.${b}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Distribution */}
          <div className="space-y-2">
            <Label>{t('specialties.dermatology.lesionForm.distribution')}</Label>
            <Select value={distribution} onValueChange={setDistribution} disabled={readOnly}>
              <SelectTrigger>
                <SelectValue placeholder={t('specialties.dermatology.lesionForm.selectDistribution')} />
              </SelectTrigger>
              <SelectContent>
                {DISTRIBUTION_OPTIONS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {t(`specialties.dermatology.distributions.${d}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Surface */}
          <div className="space-y-2">
            <Label>{t('specialties.dermatology.lesionForm.surface')}</Label>
            <Select value={surface} onValueChange={setSurface} disabled={readOnly}>
              <SelectTrigger>
                <SelectValue placeholder={t('specialties.dermatology.lesionForm.selectSurface')} />
              </SelectTrigger>
              <SelectContent>
                {SURFACE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`specialties.dermatology.surfaces.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Dermoscopy Findings */}
          <div className="space-y-2">
            <Label>{t('specialties.dermatology.lesionForm.dermoscopyFindings')}</Label>
            <Textarea
              value={dermoscopyFindings}
              onChange={(e) => setDermoscopyFindings(e.target.value)}
              disabled={readOnly}
              placeholder={t('specialties.dermatology.lesionForm.dermoscopyPlaceholder')}
              rows={3}
            />
          </div>

          {/* Clinical Notes */}
          <div className="space-y-2">
            <Label>{t('specialties.dermatology.lesionForm.clinicalNotes')}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={readOnly}
              placeholder={t('specialties.dermatology.lesionForm.notesPlaceholder')}
              rows={3}
            />
          </div>

          <Separator />

          {/* Biopsy */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="biopsy-ordered"
                checked={biopsyOrdered}
                onCheckedChange={(v) => setBiopsyOrdered(!!v)}
                disabled={readOnly}
              />
              <Label htmlFor="biopsy-ordered">
                {t('specialties.dermatology.lesionForm.biopsyOrdered')}
              </Label>
            </div>

            {biopsyOrdered && (
              <div className="space-y-2 ml-6">
                <Label>{t('specialties.dermatology.lesionForm.biopsyResult')}</Label>
                <Textarea
                  value={biopsyResult}
                  onChange={(e) => setBiopsyResult(e.target.value)}
                  disabled={readOnly}
                  placeholder={t('specialties.dermatology.lesionForm.biopsyResultPlaceholder')}
                  rows={2}
                />
              </div>
            )}
          </div>

          <Separator />

          {/* ABCDE Assessment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('specialties.dermatology.abcde.title')}</Label>
              {!readOnly && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowABCDE(true)}
                >
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  {abcdeScore
                    ? t('specialties.dermatology.abcde.editScore')
                    : t('specialties.dermatology.abcde.assess')}
                </Button>
              )}
            </div>

            {abcdeScore && (
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {t('specialties.dermatology.abcde.totalScore')}: {abcdeScore.totalScore}/10
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      abcdeScore.riskLevel === 'low'
                        ? 'bg-green-100 text-green-800'
                        : abcdeScore.riskLevel === 'moderate'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {t(`specialties.dermatology.abcde.riskLevels.${abcdeScore.riskLevel}`)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  A:{abcdeScore.asymmetry} B:{abcdeScore.border} C:{abcdeScore.color} D:{abcdeScore.diameter} E:{abcdeScore.evolution}
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {!readOnly && (
            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                {t('common.save')}
              </Button>
              {onDelete && lesion.id && (
                <Button
                  variant="destructive"
                  onClick={() => onDelete(lesion.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('common.delete')}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ABCDE Scoring Dialog */}
      <Dialog open={showABCDE} onOpenChange={setShowABCDE}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('specialties.dermatology.abcde.title')}</DialogTitle>
          </DialogHeader>
          <ABCDEScoring
            onScore={handleABCDEScore}
            existingScore={abcdeScore}
            readOnly={readOnly}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
