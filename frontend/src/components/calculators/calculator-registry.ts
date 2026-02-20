export type CalculatorCategory = 'universal' | 'renal' | 'hepatic' | 'cardiac' | 'psych' | 'peds';

export interface CalculatorDefinition {
  id: string;
  name: string;
  shortName: string;
  category: CalculatorCategory;
  specialties: string[];
  description: string;
  inputs: CalculatorInput[];
}

export interface CalculatorInput {
  key: string;
  label: string;
  type: 'number' | 'boolean' | 'select';
  unit?: string;
  placeholder?: string;
  options?: { label: string; value: string | number }[];
  required?: boolean;
}

export const CALCULATOR_REGISTRY: CalculatorDefinition[] = [
  {
    id: 'bmi',
    name: 'Body Mass Index',
    shortName: 'BMI',
    category: 'universal',
    specialties: ['*'],
    description: 'Calculate BMI from weight and height',
    inputs: [
      { key: 'weight', label: 'Weight', type: 'number', unit: 'kg', required: true },
      { key: 'height', label: 'Height', type: 'number', unit: 'm', required: true },
    ],
  },
  {
    id: 'bsa',
    name: 'Body Surface Area',
    shortName: 'BSA',
    category: 'universal',
    specialties: ['*'],
    description: 'Mosteller formula for BSA',
    inputs: [
      { key: 'weight', label: 'Weight', type: 'number', unit: 'kg', required: true },
      { key: 'height', label: 'Height', type: 'number', unit: 'cm', required: true },
    ],
  },
  {
    id: 'egfr',
    name: 'eGFR (CKD-EPI)',
    shortName: 'eGFR',
    category: 'renal',
    specialties: ['*'],
    description: 'Estimated glomerular filtration rate',
    inputs: [
      { key: 'creatinine', label: 'Creatinine', type: 'number', unit: 'mg/dL', required: true },
      { key: 'age', label: 'Age', type: 'number', unit: 'years', required: true },
      { key: 'isFemale', label: 'Sex', type: 'select', options: [{ label: 'Male', value: 0 }, { label: 'Female', value: 1 }], required: true },
    ],
  },
  {
    id: 'crcl',
    name: 'Creatinine Clearance',
    shortName: 'CrCl',
    category: 'renal',
    specialties: ['*'],
    description: 'Cockcroft-Gault equation',
    inputs: [
      { key: 'creatinine', label: 'Creatinine', type: 'number', unit: 'mg/dL', required: true },
      { key: 'age', label: 'Age', type: 'number', unit: 'years', required: true },
      { key: 'weight', label: 'Weight', type: 'number', unit: 'kg', required: true },
      { key: 'isFemale', label: 'Sex', type: 'select', options: [{ label: 'Male', value: 0 }, { label: 'Female', value: 1 }], required: true },
    ],
  },
  {
    id: 'meld',
    name: 'MELD Score',
    shortName: 'MELD',
    category: 'hepatic',
    specialties: ['General Medicine', 'Gastroenterology'],
    description: 'Model for End-Stage Liver Disease',
    inputs: [
      { key: 'bilirubin', label: 'Bilirubin', type: 'number', unit: 'mg/dL', required: true },
      { key: 'inr', label: 'INR', type: 'number', required: true },
      { key: 'creatinine', label: 'Creatinine', type: 'number', unit: 'mg/dL', required: true },
    ],
  },
  {
    id: 'framingham',
    name: 'Framingham Risk Score',
    shortName: 'Framingham',
    category: 'cardiac',
    specialties: ['Cardiology', 'General Medicine'],
    description: '10-year CVD risk estimation',
    inputs: [
      { key: 'age', label: 'Age', type: 'number', unit: 'years', required: true },
      { key: 'totalCholesterol', label: 'Total Cholesterol', type: 'number', unit: 'mg/dL', required: true },
      { key: 'hdl', label: 'HDL', type: 'number', unit: 'mg/dL', required: true },
      { key: 'systolicBP', label: 'Systolic BP', type: 'number', unit: 'mmHg', required: true },
      { key: 'isTreatedBP', label: 'On BP Treatment', type: 'boolean' },
      { key: 'isSmoker', label: 'Current Smoker', type: 'boolean' },
      { key: 'isMale', label: 'Sex', type: 'select', options: [{ label: 'Male', value: 1 }, { label: 'Female', value: 0 }], required: true },
    ],
  },
  {
    id: 'cha2ds2vasc',
    name: 'CHA\u2082DS\u2082-VASc Score',
    shortName: 'CHA\u2082DS\u2082-VASc',
    category: 'cardiac',
    specialties: ['Cardiology'],
    description: 'Stroke risk in atrial fibrillation',
    inputs: [
      { key: 'chf', label: 'CHF', type: 'boolean' },
      { key: 'hypertension', label: 'Hypertension', type: 'boolean' },
      { key: 'age', label: 'Age', type: 'number', unit: 'years', required: true },
      { key: 'diabetes', label: 'Diabetes', type: 'boolean' },
      { key: 'strokeTIA', label: 'Prior Stroke/TIA', type: 'boolean' },
      { key: 'vascularDisease', label: 'Vascular Disease', type: 'boolean' },
      { key: 'isFemale', label: 'Sex', type: 'select', options: [{ label: 'Male', value: 0 }, { label: 'Female', value: 1 }], required: true },
    ],
  },
  {
    id: 'phq9',
    name: 'PHQ-9 (Depression)',
    shortName: 'PHQ-9',
    category: 'psych',
    specialties: ['Psychiatry', 'General Medicine'],
    description: 'Patient Health Questionnaire for depression',
    inputs: Array.from({ length: 9 }, (_, i) => ({
      key: `q${i + 1}`,
      label: `Q${i + 1}`,
      type: 'select' as const,
      options: [
        { label: 'Not at all (0)', value: 0 },
        { label: 'Several days (1)', value: 1 },
        { label: 'More than half (2)', value: 2 },
        { label: 'Nearly every day (3)', value: 3 },
      ],
    })),
  },
  {
    id: 'gad7',
    name: 'GAD-7 (Anxiety)',
    shortName: 'GAD-7',
    category: 'psych',
    specialties: ['Psychiatry', 'General Medicine'],
    description: 'Generalized Anxiety Disorder screener',
    inputs: Array.from({ length: 7 }, (_, i) => ({
      key: `q${i + 1}`,
      label: `Q${i + 1}`,
      type: 'select' as const,
      options: [
        { label: 'Not at all (0)', value: 0 },
        { label: 'Several days (1)', value: 1 },
        { label: 'More than half (2)', value: 2 },
        { label: 'Nearly every day (3)', value: 3 },
      ],
    })),
  },
];

export function getCalculatorsForSpecialty(specialtyName: string): CalculatorDefinition[] {
  return CALCULATOR_REGISTRY.filter(
    (calc) => calc.specialties.includes('*') || calc.specialties.includes(specialtyName)
  );
}
