import { scorePHQ9, scoreGAD7 } from '@/lib/medical-calculators';

// ===== Interfaces =====

export interface ScreeningQuestion {
  id: string;
  text: string;
  options: { value: number; label: string }[];
}

export interface ScreeningInstrument {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  questions: ScreeningQuestion[];
  maxScore: number;
  scoringFunction: (responses: number[]) => { score: number; severity: string; color: string };
  severityBands: { min: number; max: number; label: string; color: string }[];
}

// ===== Common option scales =====

const LIKERT_0_3 = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
];

const YES_NO = [
  { value: 0, label: 'No' },
  { value: 1, label: 'Yes' },
];

// ===== PHQ-9 =====

const PHQ9_INSTRUMENT: ScreeningInstrument = {
  id: 'PHQ9',
  name: 'Patient Health Questionnaire-9',
  abbreviation: 'PHQ-9',
  description: 'A validated 9-item self-report measure used to screen for depression and monitor treatment response.',
  questions: [
    { id: 'phq9_1', text: 'Little interest or pleasure in doing things', options: LIKERT_0_3 },
    { id: 'phq9_2', text: 'Feeling down, depressed, or hopeless', options: LIKERT_0_3 },
    { id: 'phq9_3', text: 'Trouble falling or staying asleep, or sleeping too much', options: LIKERT_0_3 },
    { id: 'phq9_4', text: 'Feeling tired or having little energy', options: LIKERT_0_3 },
    { id: 'phq9_5', text: 'Poor appetite or overeating', options: LIKERT_0_3 },
    { id: 'phq9_6', text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down', options: LIKERT_0_3 },
    { id: 'phq9_7', text: 'Trouble concentrating on things, such as reading the newspaper or watching television', options: LIKERT_0_3 },
    { id: 'phq9_8', text: 'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual', options: LIKERT_0_3 },
    { id: 'phq9_9', text: 'Thoughts that you would be better off dead or of hurting yourself in some way', options: LIKERT_0_3 },
  ],
  maxScore: 27,
  scoringFunction: scorePHQ9,
  severityBands: [
    { min: 0, max: 4, label: 'Minimal', color: 'bg-green-500' },
    { min: 5, max: 9, label: 'Mild', color: 'bg-yellow-500' },
    { min: 10, max: 14, label: 'Moderate', color: 'bg-orange-500' },
    { min: 15, max: 19, label: 'Moderately Severe', color: 'bg-red-500' },
    { min: 20, max: 27, label: 'Severe', color: 'bg-red-700' },
  ],
};

// ===== GAD-7 =====

const GAD7_INSTRUMENT: ScreeningInstrument = {
  id: 'GAD7',
  name: 'Generalized Anxiety Disorder-7',
  abbreviation: 'GAD-7',
  description: 'A validated 7-item self-report measure used to screen for generalized anxiety disorder and monitor treatment response.',
  questions: [
    { id: 'gad7_1', text: 'Feeling nervous, anxious, or on edge', options: LIKERT_0_3 },
    { id: 'gad7_2', text: 'Not being able to stop or control worrying', options: LIKERT_0_3 },
    { id: 'gad7_3', text: 'Worrying too much about different things', options: LIKERT_0_3 },
    { id: 'gad7_4', text: 'Trouble relaxing', options: LIKERT_0_3 },
    { id: 'gad7_5', text: 'Being so restless that it is hard to sit still', options: LIKERT_0_3 },
    { id: 'gad7_6', text: 'Becoming easily annoyed or irritable', options: LIKERT_0_3 },
    { id: 'gad7_7', text: 'Feeling afraid, as if something awful might happen', options: LIKERT_0_3 },
  ],
  maxScore: 21,
  scoringFunction: scoreGAD7,
  severityBands: [
    { min: 0, max: 4, label: 'Minimal', color: 'bg-green-500' },
    { min: 5, max: 9, label: 'Mild', color: 'bg-yellow-500' },
    { min: 10, max: 14, label: 'Moderate', color: 'bg-orange-500' },
    { min: 15, max: 21, label: 'Severe', color: 'bg-red-500' },
  ],
};

// ===== AUDIT =====

function scoreAUDIT(responses: number[]): { score: number; severity: string; color: string } {
  const score = responses.reduce((sum, r) => sum + r, 0);
  if (score <= 7) return { score, severity: 'Low Risk', color: 'text-green-500' };
  if (score <= 15) return { score, severity: 'Hazardous Drinking', color: 'text-yellow-500' };
  if (score <= 19) return { score, severity: 'Harmful Drinking', color: 'text-orange-500' };
  return { score, severity: 'Possible Dependence', color: 'text-red-500' };
}

const AUDIT_FREQUENCY = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'Monthly or less' },
  { value: 2, label: '2-4 times a month' },
  { value: 3, label: '2-3 times a week' },
  { value: 4, label: '4 or more times a week' },
];

const AUDIT_QUANTITY = [
  { value: 0, label: '1-2' },
  { value: 1, label: '3-4' },
  { value: 2, label: '5-6' },
  { value: 3, label: '7-9' },
  { value: 4, label: '10 or more' },
];

const AUDIT_FREQUENCY_ALT = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'Less than monthly' },
  { value: 2, label: 'Monthly' },
  { value: 3, label: 'Weekly' },
  { value: 4, label: 'Daily or almost daily' },
];

const AUDIT_YES_NO = [
  { value: 0, label: 'No' },
  { value: 2, label: 'Yes, but not in the last year' },
  { value: 4, label: 'Yes, during the last year' },
];

const AUDIT_INSTRUMENT: ScreeningInstrument = {
  id: 'AUDIT',
  name: 'Alcohol Use Disorders Identification Test',
  abbreviation: 'AUDIT',
  description: 'A 10-item screening tool developed by the WHO to assess alcohol consumption, drinking behaviors, and alcohol-related problems.',
  questions: [
    { id: 'audit_1', text: 'How often do you have a drink containing alcohol?', options: AUDIT_FREQUENCY },
    { id: 'audit_2', text: 'How many drinks containing alcohol do you have on a typical day when you are drinking?', options: AUDIT_QUANTITY },
    { id: 'audit_3', text: 'How often do you have 6 or more drinks on one occasion?', options: AUDIT_FREQUENCY_ALT },
    { id: 'audit_4', text: 'How often during the last year have you found that you were not able to stop drinking once you had started?', options: AUDIT_FREQUENCY_ALT },
    { id: 'audit_5', text: 'How often during the last year have you failed to do what was normally expected from you because of drinking?', options: AUDIT_FREQUENCY_ALT },
    { id: 'audit_6', text: 'How often during the last year have you needed a first drink in the morning to get yourself going after a heavy drinking session?', options: AUDIT_FREQUENCY_ALT },
    { id: 'audit_7', text: 'How often during the last year have you had a feeling of guilt or remorse after drinking?', options: AUDIT_FREQUENCY_ALT },
    { id: 'audit_8', text: 'How often during the last year have you been unable to remember what happened the night before because you had been drinking?', options: AUDIT_FREQUENCY_ALT },
    { id: 'audit_9', text: 'Have you or someone else been injured as a result of your drinking?', options: AUDIT_YES_NO },
    { id: 'audit_10', text: 'Has a relative or friend or a doctor or other health worker been concerned about your drinking or suggested you cut down?', options: AUDIT_YES_NO },
  ],
  maxScore: 40,
  scoringFunction: scoreAUDIT,
  severityBands: [
    { min: 0, max: 7, label: 'Low Risk', color: 'bg-green-500' },
    { min: 8, max: 15, label: 'Hazardous Drinking', color: 'bg-yellow-500' },
    { min: 16, max: 19, label: 'Harmful Drinking', color: 'bg-orange-500' },
    { min: 20, max: 40, label: 'Possible Dependence', color: 'bg-red-500' },
  ],
};

// ===== CAGE =====

function scoreCAGE(responses: number[]): { score: number; severity: string; color: string } {
  const score = responses.reduce((sum, r) => sum + r, 0);
  if (score === 0) return { score, severity: 'No Concern', color: 'text-green-500' };
  if (score === 1) return { score, severity: 'Low Concern', color: 'text-yellow-500' };
  if (score <= 3) return { score, severity: 'Strong Suspicion', color: 'text-orange-500' };
  return { score, severity: 'High Likelihood of Alcoholism', color: 'text-red-500' };
}

const CAGE_INSTRUMENT: ScreeningInstrument = {
  id: 'CAGE',
  name: 'CAGE Questionnaire',
  abbreviation: 'CAGE',
  description: 'A 4-item screening tool for alcohol problems. Two or more positive answers suggest clinically significant alcohol problems.',
  questions: [
    { id: 'cage_1', text: 'Have you ever felt you should Cut down on your drinking?', options: YES_NO },
    { id: 'cage_2', text: 'Have people Annoyed you by criticizing your drinking?', options: YES_NO },
    { id: 'cage_3', text: 'Have you ever felt bad or Guilty about your drinking?', options: YES_NO },
    { id: 'cage_4', text: 'Have you ever had a drink first thing in the morning to steady your nerves or to get rid of a hangover (Eye-opener)?', options: YES_NO },
  ],
  maxScore: 4,
  scoringFunction: scoreCAGE,
  severityBands: [
    { min: 0, max: 0, label: 'No Concern', color: 'bg-green-500' },
    { min: 1, max: 1, label: 'Low Concern', color: 'bg-yellow-500' },
    { min: 2, max: 3, label: 'Strong Suspicion', color: 'bg-orange-500' },
    { min: 4, max: 4, label: 'High Likelihood', color: 'bg-red-500' },
  ],
};

// ===== Exports =====

export const INSTRUMENTS: Record<string, ScreeningInstrument> = {
  PHQ9: PHQ9_INSTRUMENT,
  GAD7: GAD7_INSTRUMENT,
  AUDIT: AUDIT_INSTRUMENT,
  CAGE: CAGE_INSTRUMENT,
};

export function getInstrument(id: string): ScreeningInstrument | undefined {
  return INSTRUMENTS[id];
}
