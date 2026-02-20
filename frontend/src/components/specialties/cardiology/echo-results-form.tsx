import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import apiClient from '@/lib/api-client';

interface ValveData {
  stenosis: string;
  regurgitation: string;
  notes: string;
}

export interface EchoResults {
  // LV Function
  ef: number | null;
  lvedd: number | null;
  lvesd: number | null;
  wallMotion: string;
  lvMass: number | null;
  // RV Function
  tapse: number | null;
  rvSize: string;
  // Valves
  aortic: ValveData;
  mitral: ValveData;
  tricuspid: ValveData;
  pulmonic: ValveData;
  // Other
  laSize: number | null;
  aorticRoot: number | null;
  pericardialEffusion: string;
  diastolicFunction: string;
}

interface EchoResultsFormProps {
  consultationId: string;
  readOnly?: boolean;
  existingData?: EchoResults;
}

const DEFAULT_VALVE: ValveData = { stenosis: 'none', regurgitation: 'none', notes: '' };

const DEFAULT_ECHO: EchoResults = {
  ef: null,
  lvedd: null,
  lvesd: null,
  wallMotion: 'normal',
  lvMass: null,
  tapse: null,
  rvSize: 'normal',
  aortic: { ...DEFAULT_VALVE },
  mitral: { ...DEFAULT_VALVE },
  tricuspid: { ...DEFAULT_VALVE },
  pulmonic: { ...DEFAULT_VALVE },
  laSize: null,
  aorticRoot: null,
  pericardialEffusion: 'none',
  diastolicFunction: 'normal',
};

const STENOSIS_GRADES = ['none', 'mild', 'moderate', 'severe'] as const;
const REGURGITATION_GRADES = ['none', 'trivial', 'mild', 'moderate', 'severe'] as const;
const WALL_MOTION_OPTIONS = ['normal', 'hypokinesis', 'akinesis', 'dyskinesis'] as const;
const RV_SIZE_OPTIONS = ['normal', 'mildlyDilated', 'severelyDilated'] as const;
const PERICARDIAL_OPTIONS = ['none', 'small', 'moderate', 'large'] as const;
const DIASTOLIC_OPTIONS = ['normal', 'grade1', 'grade2', 'grade3'] as const;
const VALVE_NAMES = ['aortic', 'mitral', 'tricuspid', 'pulmonic'] as const;

export function EchoResultsForm({
  consultationId,
  readOnly = false,
  existingData,
}: EchoResultsFormProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<EchoResults>(existingData || DEFAULT_ECHO);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const getEFInterpretation = useCallback(
    (ef: number | null): { label: string; color: string } => {
      if (ef === null) return { label: '', color: '' };
      if (ef >= 55)
        return { label: t('specialties.cardiology.echo.efNormal'), color: 'bg-green-100 text-green-800' };
      if (ef >= 40)
        return { label: t('specialties.cardiology.echo.efMildlyReduced'), color: 'bg-yellow-100 text-yellow-800' };
      if (ef >= 30)
        return { label: t('specialties.cardiology.echo.efModeratelyReduced'), color: 'bg-orange-100 text-orange-800' };
      return { label: t('specialties.cardiology.echo.efSeverelyReduced'), color: 'bg-red-100 text-red-800' };
    },
    [t]
  );

  const efInterp = useMemo(() => getEFInterpretation(data.ef), [data.ef, getEFInterpretation]);

  const autoSave = useCallback(
    (updatedData: EchoResults) => {
      if (readOnly) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        try {
          await apiClient.patch(`/consultations/${consultationId}`, {
            customFields: {
              cardiology: { echo: updatedData },
            },
          });
        } catch {
          toast.error(t('specialties.cardiology.echo.saveFailed'));
        }
      }, 1500);
    },
    [consultationId, readOnly, t]
  );

  const updateField = useCallback(
    <K extends keyof EchoResults>(field: K, value: EchoResults[K]) => {
      setData((prev) => {
        const updated = { ...prev, [field]: value };
        autoSave(updated);
        return updated;
      });
    },
    [autoSave]
  );

  const updateValve = useCallback(
    (valve: typeof VALVE_NAMES[number], field: keyof ValveData, value: string) => {
      setData((prev) => {
        const updated = {
          ...prev,
          [valve]: { ...prev[valve], [field]: value },
        };
        autoSave(updated);
        return updated;
      });
    },
    [autoSave]
  );

  const saveManually = useCallback(async () => {
    setSaving(true);
    try {
      await apiClient.patch(`/consultations/${consultationId}`, {
        customFields: {
          cardiology: { echo: data },
        },
      });
      toast.success(t('specialties.cardiology.echo.saved'));
    } catch {
      toast.error(t('specialties.cardiology.echo.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [consultationId, data, t]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Heart className="h-5 w-5 text-pink-500" />
          {t('specialties.cardiology.echo.title')}
        </h3>
        {!readOnly && (
          <Button onClick={saveManually} disabled={saving} size="sm">
            <Save className="mr-2 h-4 w-4" />
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        )}
      </div>

      {/* LV Function */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {t('specialties.cardiology.echo.lvFunction')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t('specialties.cardiology.echo.ef')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={data.ef ?? ''}
                  onChange={(e) => updateField('ef', e.target.value ? Number(e.target.value) : null)}
                  disabled={readOnly}
                  placeholder="%"
                />
                <span className="text-sm text-muted-foreground">%</span>
                {efInterp.label && (
                  <Badge className={efInterp.color}>{efInterp.label}</Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('specialties.cardiology.echo.lvedd')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={data.lvedd ?? ''}
                  onChange={(e) => updateField('lvedd', e.target.value ? Number(e.target.value) : null)}
                  disabled={readOnly}
                  placeholder="mm"
                />
                <span className="text-sm text-muted-foreground">mm</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('specialties.cardiology.echo.lvesd')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={data.lvesd ?? ''}
                  onChange={(e) => updateField('lvesd', e.target.value ? Number(e.target.value) : null)}
                  disabled={readOnly}
                  placeholder="mm"
                />
                <span className="text-sm text-muted-foreground">mm</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('specialties.cardiology.echo.wallMotion')}</Label>
              <Select
                value={data.wallMotion}
                onValueChange={(v) => updateField('wallMotion', v)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WALL_MOTION_OPTIONS.map((w) => (
                    <SelectItem key={w} value={w}>
                      {t(`specialties.cardiology.echo.wallMotions.${w}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('specialties.cardiology.echo.lvMass')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={500}
                  value={data.lvMass ?? ''}
                  onChange={(e) => updateField('lvMass', e.target.value ? Number(e.target.value) : null)}
                  disabled={readOnly}
                  placeholder="g"
                />
                <span className="text-sm text-muted-foreground">g</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RV Function */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {t('specialties.cardiology.echo.rvFunction')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('specialties.cardiology.echo.tapse')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={data.tapse ?? ''}
                  onChange={(e) => updateField('tapse', e.target.value ? Number(e.target.value) : null)}
                  disabled={readOnly}
                  placeholder="mm"
                />
                <span className="text-sm text-muted-foreground">mm</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('specialties.cardiology.echo.rvSize')}</Label>
              <Select
                value={data.rvSize}
                onValueChange={(v) => updateField('rvSize', v)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RV_SIZE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`specialties.cardiology.echo.rvSizes.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Valves */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {t('specialties.cardiology.echo.valves')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {VALVE_NAMES.map((valve) => (
            <div key={valve}>
              <h5 className="text-sm font-medium mb-2">
                {t(`specialties.cardiology.echo.valveNames.${valve}`)}
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">
                    {t('specialties.cardiology.echo.stenosis')}
                  </Label>
                  <Select
                    value={data[valve].stenosis}
                    onValueChange={(v) => updateValve(valve, 'stenosis', v)}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STENOSIS_GRADES.map((g) => (
                        <SelectItem key={g} value={g}>
                          {t(`specialties.cardiology.echo.grades.${g}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">
                    {t('specialties.cardiology.echo.regurgitation')}
                  </Label>
                  <Select
                    value={data[valve].regurgitation}
                    onValueChange={(v) => updateValve(valve, 'regurgitation', v)}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REGURGITATION_GRADES.map((g) => (
                        <SelectItem key={g} value={g}>
                          {t(`specialties.cardiology.echo.grades.${g}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">
                    {t('common.notes')}
                  </Label>
                  <Input
                    value={data[valve].notes}
                    onChange={(e) => updateValve(valve, 'notes', e.target.value)}
                    disabled={readOnly}
                    placeholder={t('specialties.cardiology.echo.valveNotesPlaceholder')}
                    className="h-9"
                  />
                </div>
              </div>
              {valve !== 'pulmonic' && <Separator className="mt-3" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Other measurements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {t('specialties.cardiology.echo.otherFindings')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('specialties.cardiology.echo.laSize')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={data.laSize ?? ''}
                  onChange={(e) => updateField('laSize', e.target.value ? Number(e.target.value) : null)}
                  disabled={readOnly}
                  placeholder="mm"
                />
                <span className="text-sm text-muted-foreground">mm</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('specialties.cardiology.echo.aorticRoot')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={80}
                  value={data.aorticRoot ?? ''}
                  onChange={(e) => updateField('aorticRoot', e.target.value ? Number(e.target.value) : null)}
                  disabled={readOnly}
                  placeholder="mm"
                />
                <span className="text-sm text-muted-foreground">mm</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('specialties.cardiology.echo.pericardialEffusion')}</Label>
              <Select
                value={data.pericardialEffusion}
                onValueChange={(v) => updateField('pericardialEffusion', v)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERICARDIAL_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {t(`specialties.cardiology.echo.pericardialOptions.${p}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('specialties.cardiology.echo.diastolicFunction')}</Label>
              <Select
                value={data.diastolicFunction}
                onValueChange={(v) => updateField('diastolicFunction', v)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIASTOLIC_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {t(`specialties.cardiology.echo.diastolicOptions.${d}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
