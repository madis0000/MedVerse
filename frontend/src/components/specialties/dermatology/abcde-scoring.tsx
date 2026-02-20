import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export interface ABCDEScore {
  asymmetry: 0 | 1 | 2;
  border: 0 | 1 | 2;
  color: 0 | 1 | 2;
  diameter: 0 | 1 | 2;
  evolution: 0 | 1 | 2;
  totalScore: number;
  riskLevel: string;
}

interface ABCDEScoringProps {
  onScore: (score: ABCDEScore) => void;
  existingScore?: ABCDEScore;
  readOnly?: boolean;
}

function getRiskLevel(total: number): string {
  if (total <= 2) return 'low';
  if (total <= 5) return 'moderate';
  return 'high';
}

function getRiskBadgeClass(level: string): string {
  if (level === 'low') return 'bg-green-100 text-green-800 border-green-300';
  if (level === 'moderate') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  return 'bg-red-100 text-red-800 border-red-300';
}

export function ABCDEScoring({ onScore, existingScore, readOnly = false }: ABCDEScoringProps) {
  const { t } = useTranslation();

  const [asymmetry, setAsymmetry] = useState<0 | 1 | 2>(existingScore?.asymmetry ?? 0);
  const [border, setBorder] = useState<0 | 1 | 2>(existingScore?.border ?? 0);
  const [color, setColor] = useState<0 | 1 | 2>(existingScore?.color ?? 0);
  const [diameter, setDiameter] = useState<0 | 1 | 2>(existingScore?.diameter ?? 0);
  const [evolution, setEvolution] = useState<0 | 1 | 2>(existingScore?.evolution ?? 0);

  useEffect(() => {
    if (existingScore) {
      setAsymmetry(existingScore.asymmetry);
      setBorder(existingScore.border);
      setColor(existingScore.color);
      setDiameter(existingScore.diameter);
      setEvolution(existingScore.evolution);
    }
  }, [existingScore]);

  const totalScore = asymmetry + border + color + diameter + evolution;
  const riskLevel = getRiskLevel(totalScore);

  const handleSave = useCallback(() => {
    const score: ABCDEScore = {
      asymmetry,
      border,
      color,
      diameter,
      evolution,
      totalScore,
      riskLevel,
    };
    onScore(score);
  }, [asymmetry, border, color, diameter, evolution, totalScore, riskLevel, onScore]);

  const criteria: {
    key: string;
    value: 0 | 1 | 2;
    setter: (v: 0 | 1 | 2) => void;
    letter: string;
  }[] = [
    { key: 'asymmetry', value: asymmetry, setter: setAsymmetry, letter: 'A' },
    { key: 'border', value: border, setter: setBorder, letter: 'B' },
    { key: 'color', value: color, setter: setColor, letter: 'C' },
    { key: 'diameter', value: diameter, setter: setDiameter, letter: 'D' },
    { key: 'evolution', value: evolution, setter: setEvolution, letter: 'E' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="h-4 w-4 text-orange-500" />
          {t('specialties.dermatology.abcde.title')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {t('specialties.dermatology.abcde.description')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {criteria.map(({ key, value, setter, letter }) => (
          <div key={key} className="space-y-2">
            <Label className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {letter}
              </span>
              {t(`specialties.dermatology.abcde.criteria.${key}.label`)}
            </Label>
            <div className="space-y-1.5">
              {([0, 1, 2] as const).map((score) => (
                <label
                  key={score}
                  className={cn(
                    'flex items-start gap-3 cursor-pointer rounded-lg border p-2.5 transition-colors text-sm',
                    value === score
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50',
                    readOnly && 'cursor-default',
                  )}
                >
                  <input
                    type="radio"
                    name={`abcde-${key}`}
                    value={score}
                    checked={value === score}
                    onChange={() => setter(score)}
                    disabled={readOnly}
                    className="mt-0.5 h-4 w-4"
                  />
                  <div className="flex-1">
                    <span className="font-medium">{score} -</span>{' '}
                    {t(`specialties.dermatology.abcde.criteria.${key}.options.${score}`)}
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}

        <Separator />

        {/* Score result */}
        <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {t('specialties.dermatology.abcde.totalScore')}
            </span>
            <span className="text-xl font-bold">{totalScore}/10</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all',
                riskLevel === 'low'
                  ? 'bg-green-500'
                  : riskLevel === 'moderate'
                    ? 'bg-yellow-500'
                    : 'bg-red-500',
              )}
              style={{ width: `${(totalScore / 10) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <Badge className={getRiskBadgeClass(riskLevel)}>
              {t(`specialties.dermatology.abcde.riskLevels.${riskLevel}`)}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground">
            {t(`specialties.dermatology.abcde.recommendations.${riskLevel}`)}
          </p>
        </div>

        {!readOnly && (
          <Button onClick={handleSave} className="w-full">
            {t('specialties.dermatology.abcde.saveScore')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
