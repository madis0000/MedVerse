import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import type { ScreeningInstrument as ScreeningInstrumentType } from '@/lib/screening-instruments';

interface ScreeningInstrumentProps {
  instrument: ScreeningInstrumentType;
  consultationId: string;
  patientId: string;
  existingResponses?: number[];
  readOnly?: boolean;
  onComplete?: (score: number, responses: number[]) => void;
}

export function ScreeningInstrumentForm({
  instrument,
  consultationId,
  patientId,
  existingResponses,
  readOnly = false,
  onComplete,
}: ScreeningInstrumentProps) {
  const { t } = useTranslation();
  const [responses, setResponses] = useState<(number | null)[]>(
    existingResponses
      ? existingResponses
      : new Array(instrument.questions.length).fill(null),
  );
  const [isCompleted, setIsCompleted] = useState(!!existingResponses);

  const answeredCount = useMemo(
    () => responses.filter((r) => r !== null).length,
    [responses],
  );

  const totalQuestions = instrument.questions.length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const runningScore = useMemo(
    () => responses.reduce<number>((sum, r) => sum + (r ?? 0), 0),
    [responses],
  );

  const allAnswered = answeredCount === totalQuestions;

  const result = useMemo(() => {
    if (!allAnswered) return null;
    return instrument.scoringFunction(responses as number[]);
  }, [allAnswered, responses, instrument]);

  const currentBand = useMemo(() => {
    return instrument.severityBands.find(
      (band) => runningScore >= band.min && runningScore <= band.max,
    );
  }, [runningScore, instrument.severityBands]);

  const handleResponseChange = useCallback(
    (questionIndex: number, value: number) => {
      if (readOnly) return;
      setResponses((prev) => {
        const next = [...prev];
        next[questionIndex] = value;
        return next;
      });
      setIsCompleted(false);
    },
    [readOnly],
  );

  const handleSubmit = useCallback(() => {
    if (!allAnswered || !result) return;
    setIsCompleted(true);
    onComplete?.(result.score, responses as number[]);
  }, [allAnswered, result, responses, onComplete]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {instrument.abbreviation} - {instrument.name}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {instrument.description}
            </p>
          </div>
          {isCompleted && result && (
            <Badge
              className={
                result.color.replace('text-', 'bg-').replace('500', '100') +
                ' ' +
                result.color
              }
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {t('specialties.psychiatry.completed')}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t('specialties.psychiatry.progress')}: {answeredCount}/{totalQuestions}
            </span>
            <span className="font-medium">
              {t('specialties.psychiatry.runningScore')}: {runningScore}/{instrument.maxScore}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {currentBand && (
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${currentBand.color}`} />
              <span className="text-sm text-muted-foreground">
                {currentBand.label}
              </span>
            </div>
          )}
        </div>

        <Separator />

        {/* Questions */}
        <div className="space-y-6">
          {instrument.questions.map((question, qIdx) => (
            <div key={question.id} className="space-y-3">
              <Label className="text-sm font-medium leading-relaxed">
                {qIdx + 1}. {question.text}
              </Label>
              <div className="grid gap-2 pl-4 sm:grid-cols-2 lg:grid-cols-4">
                {question.options.map((option) => {
                  const isSelected = responses[qIdx] === option.value;
                  return (
                    <label
                      key={`${question.id}-${option.value}`}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5 font-medium'
                          : 'border-border hover:bg-accent/50'
                      } ${readOnly ? 'cursor-default' : ''}`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option.value}
                        checked={isSelected}
                        onChange={() => handleResponseChange(qIdx, option.value)}
                        disabled={readOnly}
                        className="sr-only"
                      />
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {isSelected && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                      <span>
                        ({option.value}) {option.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Result / Submit section */}
        {allAnswered && result && (
          <>
            <Separator />
            <div className="rounded-lg border-2 border-dashed p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('specialties.psychiatry.totalScore')}
                  </p>
                  <p className="text-3xl font-bold">
                    {result.score}
                    <span className="text-lg text-muted-foreground">
                      /{instrument.maxScore}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('specialties.psychiatry.severity')}
                  </p>
                  <p className={`text-xl font-bold ${result.color}`}>
                    {result.severity}
                  </p>
                </div>
              </div>

              {/* Severity band visualization */}
              <div className="mt-4 flex h-3 overflow-hidden rounded-full">
                {instrument.severityBands.map((band) => {
                  const width =
                    ((band.max - band.min + 1) / (instrument.maxScore + 1)) *
                    100;
                  return (
                    <div
                      key={band.label}
                      className={`${band.color} transition-opacity ${
                        result.score >= band.min && result.score <= band.max
                          ? 'opacity-100'
                          : 'opacity-30'
                      }`}
                      style={{ width: `${width}%` }}
                      title={`${band.label}: ${band.min}-${band.max}`}
                    />
                  );
                })}
              </div>

              {/* Question 9 suicide alert for PHQ-9 */}
              {instrument.id === 'PHQ9' &&
                responses[8] !== null &&
                (responses[8] as number) > 0 && (
                  <div className="mt-4 flex items-start gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      {t('specialties.psychiatry.suicideRiskAlert')}
                    </span>
                  </div>
                )}
            </div>
          </>
        )}

        {/* Save button */}
        {!readOnly && (
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered || isCompleted}
            >
              {isCompleted
                ? t('specialties.psychiatry.saved')
                : t('specialties.psychiatry.saveScreening')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
