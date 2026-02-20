import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, ChevronDown, ChevronUp, Calculator, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import apiClient from '@/lib/api-client';
import {
  calculateFramingham,
  calculateHEART,
  calculateCHA2DS2VASc,
  calculateHASBLED,
  classifyNYHA,
} from '@/lib/calculators/cardiac';

interface CardiacRiskCalculatorsProps {
  consultationId: string;
  patientId: string;
  readOnly?: boolean;
}

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, icon, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            {icon}
            {title}
          </CardTitle>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      {isOpen && <CardContent>{children}</CardContent>}
    </Card>
  );
}

export function CardiacRiskCalculators({
  consultationId,
  patientId,
  readOnly = false,
}: CardiacRiskCalculatorsProps) {
  const { t } = useTranslation();

  // ---- Framingham State ----
  const [framAge, setFramAge] = useState<number>(0);
  const [framCholesterol, setFramCholesterol] = useState<number>(0);
  const [framHDL, setFramHDL] = useState<number>(0);
  const [framSBP, setFramSBP] = useState<number>(0);
  const [framTreatedBP, setFramTreatedBP] = useState(false);
  const [framSmoker, setFramSmoker] = useState(false);
  const [framMale, setFramMale] = useState(true);
  const [framResult, setFramResult] = useState<ReturnType<typeof calculateFramingham> | null>(null);

  // ---- HEART Score State ----
  const [heartHistory, setHeartHistory] = useState<string>('0');
  const [heartECG, setHeartECG] = useState<string>('0');
  const [heartAge, setHeartAge] = useState<string>('0');
  const [heartRisk, setHeartRisk] = useState<string>('0');
  const [heartTroponin, setHeartTroponin] = useState<string>('0');
  const [heartResult, setHeartResult] = useState<ReturnType<typeof calculateHEART> | null>(null);

  // ---- CHA2DS2-VASc State ----
  const [chadCHF, setChadCHF] = useState(false);
  const [chadHTN, setChadHTN] = useState(false);
  const [chadAge, setChadAge] = useState<number>(0);
  const [chadDiabetes, setChadDiabetes] = useState(false);
  const [chadStroke, setChadStroke] = useState(false);
  const [chadVascular, setChadVascular] = useState(false);
  const [chadFemale, setChadFemale] = useState(false);
  const [chadResult, setChadResult] = useState<ReturnType<typeof calculateCHA2DS2VASc> | null>(null);

  // ---- HAS-BLED State ----
  const [hasHTN, setHasHTN] = useState(false);
  const [hasRenal, setHasRenal] = useState(false);
  const [hasLiver, setHasLiver] = useState(false);
  const [hasStroke, setHasStroke] = useState(false);
  const [hasBleeding, setHasBleeding] = useState(false);
  const [hasLabileINR, setHasLabileINR] = useState(false);
  const [hasElderly, setHasElderly] = useState(false);
  const [hasDrugs, setHasDrugs] = useState(false);
  const [hasAlcohol, setHasAlcohol] = useState(false);
  const [hasResult, setHasResult] = useState<ReturnType<typeof calculateHASBLED> | null>(null);

  // ---- NYHA State ----
  const [nyhaClass, setNyhaClass] = useState<string>('');
  const [nyhaResult, setNyhaResult] = useState<ReturnType<typeof classifyNYHA> | null>(null);

  const [saving, setSaving] = useState(false);

  // ---- Calculate handlers ----
  const calcFramingham = useCallback(() => {
    const result = calculateFramingham(
      framAge, framCholesterol, framHDL, framSBP,
      framTreatedBP, framSmoker, framMale
    );
    setFramResult(result);
  }, [framAge, framCholesterol, framHDL, framSBP, framTreatedBP, framSmoker, framMale]);

  const calcHEART = useCallback(() => {
    const result = calculateHEART(
      Number(heartHistory) as 0 | 1 | 2,
      Number(heartECG) as 0 | 1 | 2,
      Number(heartAge) as 0 | 1 | 2,
      Number(heartRisk) as 0 | 1 | 2,
      Number(heartTroponin) as 0 | 1 | 2
    );
    setHeartResult(result);
  }, [heartHistory, heartECG, heartAge, heartRisk, heartTroponin]);

  const calcCHAD = useCallback(() => {
    const result = calculateCHA2DS2VASc(
      chadCHF, chadHTN, chadAge, chadDiabetes, chadStroke, chadVascular, chadFemale
    );
    setChadResult(result);
  }, [chadCHF, chadHTN, chadAge, chadDiabetes, chadStroke, chadVascular, chadFemale]);

  const calcHASBLED = useCallback(() => {
    const result = calculateHASBLED(
      hasHTN, hasRenal, hasLiver, hasStroke, hasBleeding, hasLabileINR, hasElderly, hasDrugs, hasAlcohol
    );
    setHasResult(result);
  }, [hasHTN, hasRenal, hasLiver, hasStroke, hasBleeding, hasLabileINR, hasElderly, hasDrugs, hasAlcohol]);

  const calcNYHA = useCallback(() => {
    if (!nyhaClass) return;
    const result = classifyNYHA(nyhaClass);
    setNyhaResult(result);
  }, [nyhaClass]);

  // ---- Save all results ----
  const saveResults = useCallback(async () => {
    setSaving(true);
    try {
      const riskScores: Record<string, unknown> = {};
      if (framResult) riskScores.framingham = framResult;
      if (heartResult) riskScores.heart = heartResult;
      if (chadResult) riskScores.cha2ds2vasc = chadResult;
      if (hasResult) riskScores.hasbled = hasResult;
      if (nyhaResult) riskScores.nyha = nyhaResult;

      await apiClient.patch(`/consultations/${consultationId}`, {
        customFields: {
          cardiology: { riskScores },
        },
      });
      toast.success(t('specialties.cardiology.calculators.saved'));
    } catch {
      toast.error(t('specialties.cardiology.calculators.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [consultationId, framResult, heartResult, chadResult, hasResult, nyhaResult, t]);

  const hasAnyResult = framResult || heartResult || chadResult || hasResult || nyhaResult;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Calculator className="h-5 w-5" />
          {t('specialties.cardiology.calculators.title')}
        </h3>
        {!readOnly && hasAnyResult && (
          <Button onClick={saveResults} disabled={saving} size="sm">
            <Save className="mr-2 h-4 w-4" />
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        )}
      </div>

      {/* Framingham Risk Score */}
      <CollapsibleSection
        title={t('specialties.cardiology.calculators.framingham.title')}
        icon={<Heart className="h-4 w-4 text-red-500" />}
        defaultOpen
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('specialties.cardiology.calculators.framingham.age')}</Label>
              <Input
                type="number"
                min={20}
                max={79}
                value={framAge || ''}
                onChange={(e) => setFramAge(Number(e.target.value))}
                disabled={readOnly}
                placeholder="20-79"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('specialties.cardiology.calculators.framingham.totalCholesterol')}</Label>
              <Input
                type="number"
                value={framCholesterol || ''}
                onChange={(e) => setFramCholesterol(Number(e.target.value))}
                disabled={readOnly}
                placeholder="mg/dL"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('specialties.cardiology.calculators.framingham.hdl')}</Label>
              <Input
                type="number"
                value={framHDL || ''}
                onChange={(e) => setFramHDL(Number(e.target.value))}
                disabled={readOnly}
                placeholder="mg/dL"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('specialties.cardiology.calculators.framingham.systolicBP')}</Label>
              <Input
                type="number"
                value={framSBP || ''}
                onChange={(e) => setFramSBP(Number(e.target.value))}
                disabled={readOnly}
                placeholder="mmHg"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="fram-treated"
                checked={framTreatedBP}
                onCheckedChange={(v) => setFramTreatedBP(!!v)}
                disabled={readOnly}
              />
              <Label htmlFor="fram-treated">{t('specialties.cardiology.calculators.framingham.treatedBP')}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="fram-smoker"
                checked={framSmoker}
                onCheckedChange={(v) => setFramSmoker(!!v)}
                disabled={readOnly}
              />
              <Label htmlFor="fram-smoker">{t('specialties.cardiology.calculators.framingham.smoker')}</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('specialties.cardiology.calculators.framingham.sex')}</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="fram-sex"
                  checked={framMale}
                  onChange={() => setFramMale(true)}
                  disabled={readOnly}
                  className="h-4 w-4"
                />
                {t('common.male')}
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="fram-sex"
                  checked={!framMale}
                  onChange={() => setFramMale(false)}
                  disabled={readOnly}
                  className="h-4 w-4"
                />
                {t('common.female')}
              </label>
            </div>
          </div>

          {!readOnly && (
            <Button onClick={calcFramingham} size="sm" variant="outline">
              <Calculator className="mr-2 h-4 w-4" />
              {t('calculators.calculate')}
            </Button>
          )}

          {framResult && framResult.riskPercent > 0 && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t('specialties.cardiology.calculators.framingham.tenYearRisk')}
                </span>
                <span className={`text-lg font-bold ${framResult.color}`}>
                  {framResult.riskPercent}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    framResult.riskPercent < 10 ? 'bg-green-500' :
                    framResult.riskPercent < 20 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(framResult.riskPercent * 3.33, 100)}%` }}
                />
              </div>
              <Badge variant={framResult.riskPercent < 10 ? 'secondary' : 'destructive'}>
                {framResult.category}
              </Badge>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* HEART Score */}
      <CollapsibleSection
        title={t('specialties.cardiology.calculators.heart.title')}
        icon={<Heart className="h-4 w-4 text-orange-500" />}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {[
              { key: 'history', value: heartHistory, setter: setHeartHistory },
              { key: 'ecg', value: heartECG, setter: setHeartECG },
              { key: 'age', value: heartAge, setter: setHeartAge },
              { key: 'riskFactors', value: heartRisk, setter: setHeartRisk },
              { key: 'troponin', value: heartTroponin, setter: setHeartTroponin },
            ].map(({ key, value, setter }) => (
              <div key={key} className="space-y-2">
                <Label>{t(`specialties.cardiology.calculators.heart.${key}`)}</Label>
                <Select value={value} onValueChange={setter} disabled={readOnly}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">
                      0 - {t(`specialties.cardiology.calculators.heart.${key}Opts.0`)}
                    </SelectItem>
                    <SelectItem value="1">
                      1 - {t(`specialties.cardiology.calculators.heart.${key}Opts.1`)}
                    </SelectItem>
                    <SelectItem value="2">
                      2 - {t(`specialties.cardiology.calculators.heart.${key}Opts.2`)}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {!readOnly && (
            <Button onClick={calcHEART} size="sm" variant="outline">
              <Calculator className="mr-2 h-4 w-4" />
              {t('calculators.calculate')}
            </Button>
          )}

          {heartResult && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t('specialties.cardiology.calculators.heart.score')}
                </span>
                <span className={`text-lg font-bold ${heartResult.color}`}>
                  {heartResult.score}/10
                </span>
              </div>
              <p className={`text-sm font-medium ${heartResult.color}`}>{heartResult.risk}</p>
              <p className="text-sm text-muted-foreground">{heartResult.recommendation}</p>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* CHA2DS2-VASc */}
      <CollapsibleSection
        title={t('specialties.cardiology.calculators.cha2ds2vasc.title')}
        icon={<Heart className="h-4 w-4 text-purple-500" />}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'chf', checked: chadCHF, setter: setChadCHF },
              { key: 'hypertension', checked: chadHTN, setter: setChadHTN },
              { key: 'diabetes', checked: chadDiabetes, setter: setChadDiabetes },
              { key: 'strokeTIA', checked: chadStroke, setter: setChadStroke },
              { key: 'vascularDisease', checked: chadVascular, setter: setChadVascular },
              { key: 'female', checked: chadFemale, setter: setChadFemale },
            ].map(({ key, checked, setter }) => (
              <div key={key} className="flex items-center gap-2">
                <Checkbox
                  id={`chad-${key}`}
                  checked={checked}
                  onCheckedChange={(v) => setter(!!v)}
                  disabled={readOnly}
                />
                <Label htmlFor={`chad-${key}`}>
                  {t(`specialties.cardiology.calculators.cha2ds2vasc.${key}`)}
                </Label>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>{t('specialties.cardiology.calculators.cha2ds2vasc.age')}</Label>
            <Input
              type="number"
              min={0}
              max={120}
              value={chadAge || ''}
              onChange={(e) => setChadAge(Number(e.target.value))}
              disabled={readOnly}
              placeholder={t('specialties.cardiology.calculators.framingham.age')}
              className="max-w-[200px]"
            />
          </div>

          {!readOnly && (
            <Button onClick={calcCHAD} size="sm" variant="outline">
              <Calculator className="mr-2 h-4 w-4" />
              {t('calculators.calculate')}
            </Button>
          )}

          {chadResult && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t('specialties.cardiology.calculators.cha2ds2vasc.score')}
                </span>
                <span className={`text-lg font-bold ${chadResult.color}`}>
                  {chadResult.score}
                </span>
              </div>
              <p className="text-sm">
                <span className="text-muted-foreground">
                  {t('specialties.cardiology.calculators.cha2ds2vasc.strokeRisk')}:{' '}
                </span>
                <span className={`font-medium ${chadResult.color}`}>
                  {chadResult.riskPerYear}{' '}
                  {t('specialties.cardiology.calculators.cha2ds2vasc.perYear')}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">{chadResult.recommendation}</p>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* HAS-BLED */}
      <CollapsibleSection
        title={t('specialties.cardiology.calculators.hasbled.title')}
        icon={<Heart className="h-4 w-4 text-rose-500" />}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'hypertension', checked: hasHTN, setter: setHasHTN },
              { key: 'abnormalRenal', checked: hasRenal, setter: setHasRenal },
              { key: 'abnormalLiver', checked: hasLiver, setter: setHasLiver },
              { key: 'stroke', checked: hasStroke, setter: setHasStroke },
              { key: 'bleedingHistory', checked: hasBleeding, setter: setHasBleeding },
              { key: 'labileINR', checked: hasLabileINR, setter: setHasLabileINR },
              { key: 'elderly', checked: hasElderly, setter: setHasElderly },
              { key: 'drugs', checked: hasDrugs, setter: setHasDrugs },
              { key: 'alcohol', checked: hasAlcohol, setter: setHasAlcohol },
            ].map(({ key, checked, setter }) => (
              <div key={key} className="flex items-center gap-2">
                <Checkbox
                  id={`has-${key}`}
                  checked={checked}
                  onCheckedChange={(v) => setter(!!v)}
                  disabled={readOnly}
                />
                <Label htmlFor={`has-${key}`}>
                  {t(`specialties.cardiology.calculators.hasbled.${key}`)}
                </Label>
              </div>
            ))}
          </div>

          {!readOnly && (
            <Button onClick={calcHASBLED} size="sm" variant="outline">
              <Calculator className="mr-2 h-4 w-4" />
              {t('calculators.calculate')}
            </Button>
          )}

          {hasResult && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t('specialties.cardiology.calculators.hasbled.score')}
                </span>
                <span className={`text-lg font-bold ${hasResult.color}`}>
                  {hasResult.score}/9
                </span>
              </div>
              <Badge variant={hasResult.score <= 1 ? 'secondary' : hasResult.score === 2 ? 'outline' : 'destructive'}>
                {hasResult.risk} {t('specialties.cardiology.calculators.hasbled.bleedingRisk')}
              </Badge>
              <p className="text-sm text-muted-foreground">{hasResult.recommendation}</p>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* NYHA Classification */}
      <CollapsibleSection
        title={t('specialties.cardiology.calculators.nyha.title')}
        icon={<Heart className="h-4 w-4 text-blue-500" />}
      >
        <div className="space-y-4">
          <div className="space-y-3">
            {(['I', 'II', 'III', 'IV'] as const).map((cls) => (
              <label
                key={cls}
                className={`flex items-start gap-3 cursor-pointer rounded-lg border p-3 transition-colors ${
                  nyhaClass === cls ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
              >
                <input
                  type="radio"
                  name="nyha-class"
                  value={cls}
                  checked={nyhaClass === cls}
                  onChange={(e) => setNyhaClass(e.target.value)}
                  disabled={readOnly}
                  className="mt-1 h-4 w-4"
                />
                <div>
                  <span className="font-medium">
                    {t('specialties.cardiology.calculators.nyha.classLabel', { class: cls })}
                  </span>
                  <p className="text-sm text-muted-foreground">
                    {t(`specialties.cardiology.calculators.nyha.class${cls}Desc`)}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {!readOnly && (
            <Button onClick={calcNYHA} size="sm" variant="outline" disabled={!nyhaClass}>
              <Calculator className="mr-2 h-4 w-4" />
              {t('calculators.calculate')}
            </Button>
          )}

          {nyhaResult && nyhaResult.class > 0 && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t('specialties.cardiology.calculators.nyha.classification')}
                </span>
                <Badge
                  className={
                    nyhaResult.class === 1 ? 'bg-green-100 text-green-800 border-green-300' :
                    nyhaResult.class === 2 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                    nyhaResult.class === 3 ? 'bg-orange-100 text-orange-800 border-orange-300' :
                    'bg-red-100 text-red-800 border-red-300'
                  }
                >
                  {t('specialties.cardiology.calculators.nyha.classLabel', { class: ['I', 'II', 'III', 'IV'][nyhaResult.class - 1] })}
                </Badge>
              </div>
              <p className="text-sm">{nyhaResult.description}</p>
              <Separator />
              <p className="text-sm text-muted-foreground">
                {t('specialties.cardiology.calculators.nyha.mortality')}: {nyhaResult.mortality1yr}
              </p>
            </div>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}
