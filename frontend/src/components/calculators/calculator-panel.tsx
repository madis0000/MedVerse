import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CALCULATOR_REGISTRY, type CalculatorDefinition } from './calculator-registry';
import * as calcs from '@/lib/medical-calculators';

export function CalculatorPanel({ specialty }: { specialty?: string }) {
  const { t } = useTranslation();
  const [selectedCalc, setSelectedCalc] = useState<CalculatorDefinition | null>(null);
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const availableCalcs = specialty
    ? CALCULATOR_REGISTRY.filter((c) => c.specialties.includes('*') || c.specialties.includes(specialty))
    : CALCULATOR_REGISTRY;

  const updateInput = (key: string, value: any) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const calculate = () => {
    if (!selectedCalc) return;
    let res: any = null;

    switch (selectedCalc.id) {
      case 'bmi': {
        const bmi = calcs.calculateBMI(inputs.weight, inputs.height);
        const interp = calcs.interpretBMI(bmi);
        res = { value: bmi.toFixed(1), ...interp };
        break;
      }
      case 'bsa': {
        const bsa = calcs.calculateBSA(inputs.weight, inputs.height);
        res = { value: `${bsa.toFixed(2)} m²`, label: 'BSA' };
        break;
      }
      case 'egfr': {
        const egfr = calcs.calculateEGFR(inputs.creatinine, inputs.age, inputs.isFemale === 1 || inputs.isFemale === '1');
        const interp = calcs.interpretEGFR(egfr);
        res = { value: `${egfr.toFixed(0)} mL/min/1.73m²`, ...interp };
        break;
      }
      case 'crcl': {
        const crcl = calcs.calculateCrCl(inputs.creatinine, inputs.age, inputs.weight, inputs.isFemale === 1 || inputs.isFemale === '1');
        res = { value: `${crcl.toFixed(0)} mL/min`, label: 'CrCl' };
        break;
      }
      case 'meld': {
        const meld = calcs.calculateMELD(inputs.bilirubin, inputs.inr, inputs.creatinine);
        res = { value: meld.toString(), label: `MELD Score: ${meld}` };
        break;
      }
      case 'framingham': {
        res = calcs.calculateFramingham(
          inputs.age, inputs.totalCholesterol, inputs.hdl, inputs.systolicBP,
          !!inputs.isTreatedBP, !!inputs.isSmoker, inputs.isMale === 1 || inputs.isMale === '1'
        );
        res = { value: `${res.riskPercent}%`, label: res.category, color: res.color };
        break;
      }
      case 'cha2ds2vasc': {
        res = calcs.calculateCHA2DS2VASc(
          !!inputs.chf, !!inputs.hypertension, inputs.age || 0,
          !!inputs.diabetes, !!inputs.strokeTIA, !!inputs.vascularDisease,
          inputs.isFemale === 1 || inputs.isFemale === '1'
        );
        res = { value: res.score.toString(), label: `${res.riskPerYear}/yr - ${res.recommendation}`, color: res.color };
        break;
      }
      case 'phq9': {
        const responses = Array.from({ length: 9 }, (_, i) => Number(inputs[`q${i + 1}`] || 0));
        const phq = calcs.scorePHQ9(responses);
        res = { value: phq.score.toString(), label: phq.severity, color: phq.color };
        break;
      }
      case 'gad7': {
        const responses = Array.from({ length: 7 }, (_, i) => Number(inputs[`q${i + 1}`] || 0));
        const gad = calcs.scoreGAD7(responses);
        res = { value: gad.score.toString(), label: gad.severity, color: gad.color };
        break;
      }
    }
    setResult(res);
  };

  const selectCalculator = (calc: CalculatorDefinition) => {
    setSelectedCalc(calc);
    setInputs({});
    setResult(null);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            {t('calculators.title')}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          {!selectedCalc ? (
            <div className="grid grid-cols-2 gap-2">
              {availableCalcs.map((calc) => (
                <Button
                  key={calc.id}
                  variant="outline"
                  size="sm"
                  className="h-auto py-2 px-3 text-left justify-start"
                  onClick={() => selectCalculator(calc)}
                >
                  <div>
                    <p className="text-xs font-semibold">{calc.shortName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{calc.description}</p>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{selectedCalc.name}</h4>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setSelectedCalc(null); setResult(null); }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              {selectedCalc.inputs.map((input) => (
                <div key={input.key} className="space-y-1">
                  <Label className="text-xs">
                    {input.label} {input.unit && <span className="text-muted-foreground">({input.unit})</span>}
                  </Label>
                  {input.type === 'number' && (
                    <Input
                      type="number"
                      step="any"
                      value={inputs[input.key] ?? ''}
                      onChange={(e) => updateInput(input.key, parseFloat(e.target.value) || '')}
                      className="h-8 text-sm"
                    />
                  )}
                  {input.type === 'boolean' && (
                    <Switch
                      checked={!!inputs[input.key]}
                      onCheckedChange={(v) => updateInput(input.key, v)}
                    />
                  )}
                  {input.type === 'select' && input.options && (
                    <Select
                      value={String(inputs[input.key] ?? '')}
                      onValueChange={(v) => updateInput(input.key, v)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {input.options.map((opt) => (
                          <SelectItem key={String(opt.value)} value={String(opt.value)}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}

              <Button size="sm" onClick={calculate} className="w-full">
                {t('calculators.calculate')}
              </Button>

              {result && (
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-2xl font-bold">{result.value}</p>
                  {result.label && (
                    <Badge variant="secondary" className={result.color || ''}>
                      {result.label}
                    </Badge>
                  )}
                  {result.stage && (
                    <p className={`text-xs mt-1 ${result.color || ''}`}>Stage {result.stage}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
