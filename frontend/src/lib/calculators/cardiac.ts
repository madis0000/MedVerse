// Re-export cardiac calculators from main medical-calculators module
export {
  calculateFramingham,
  calculateHEART,
  calculateCHA2DS2VASc,
  calculateWellsPE,
} from '@/lib/medical-calculators';

// ===== HAS-BLED Score =====

export function calculateHASBLED(
  hypertension: boolean,
  abnormalRenal: boolean,
  abnormalLiver: boolean,
  stroke: boolean,
  bleedingHistory: boolean,
  labileINR: boolean,
  elderly: boolean,
  drugs: boolean,
  alcohol: boolean
): { score: number; risk: string; recommendation: string; color: string } {
  let score = 0;
  if (hypertension) score += 1;
  if (abnormalRenal) score += 1;
  if (abnormalLiver) score += 1;
  if (stroke) score += 1;
  if (bleedingHistory) score += 1;
  if (labileINR) score += 1;
  if (elderly) score += 1;
  if (drugs) score += 1;
  if (alcohol) score += 1;

  let risk: string;
  let recommendation: string;
  let color: string;

  if (score <= 1) {
    risk = 'Low';
    recommendation = 'Anticoagulation can be considered with low bleeding risk';
    color = 'text-green-500';
  } else if (score === 2) {
    risk = 'Moderate';
    recommendation = 'Anticoagulation can be considered but monitor closely';
    color = 'text-yellow-500';
  } else {
    risk = 'High';
    recommendation = 'High bleeding risk — consider alternatives or close monitoring if anticoagulating';
    color = 'text-red-500';
  }

  return { score, risk, recommendation, color };
}

// ===== NYHA Classification =====

export function classifyNYHA(
  symptoms: string
): { class: number; description: string; mortality1yr: string; color: string } {
  switch (symptoms) {
    case 'I':
      return {
        class: 1,
        description: 'No limitation of physical activity. Ordinary physical activity does not cause undue fatigue, palpitation, or dyspnea.',
        mortality1yr: '5-10%',
        color: 'text-green-500',
      };
    case 'II':
      return {
        class: 2,
        description: 'Slight limitation of physical activity. Comfortable at rest. Ordinary physical activity results in fatigue, palpitation, or dyspnea.',
        mortality1yr: '10-15%',
        color: 'text-yellow-500',
      };
    case 'III':
      return {
        class: 3,
        description: 'Marked limitation of physical activity. Comfortable at rest. Less than ordinary activity causes fatigue, palpitation, or dyspnea.',
        mortality1yr: '15-25%',
        color: 'text-orange-500',
      };
    case 'IV':
      return {
        class: 4,
        description: 'Unable to carry on any physical activity without discomfort. Symptoms at rest. If any physical activity is undertaken, discomfort increases.',
        mortality1yr: '50-75%',
        color: 'text-red-500',
      };
    default:
      return {
        class: 0,
        description: 'Not classified',
        mortality1yr: 'N/A',
        color: 'text-gray-500',
      };
  }
}
