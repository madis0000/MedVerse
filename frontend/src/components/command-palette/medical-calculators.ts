export interface CalculatorResult {
  label: string;
  value: string;
  interpretation?: string;
  color?: string;
}

export function parseBMI(input: string): CalculatorResult | null {
  const match = input.match(/bmi\s+(\d+\.?\d*)\s*kg?\s+(\d+\.?\d*)\s*m?/i);
  if (!match) return null;
  const weight = parseFloat(match[1]);
  const height = parseFloat(match[2]);
  if (!weight || !height) return null;
  const bmi = weight / (height * height);
  let interpretation = '';
  let color = '';
  if (bmi < 18.5) { interpretation = 'Underweight'; color = 'text-blue-500'; }
  else if (bmi < 25) { interpretation = 'Normal'; color = 'text-green-500'; }
  else if (bmi < 30) { interpretation = 'Overweight'; color = 'text-yellow-500'; }
  else { interpretation = 'Obese'; color = 'text-red-500'; }
  return { label: 'BMI', value: bmi.toFixed(1), interpretation, color };
}

export function parseBSA(input: string): CalculatorResult | null {
  const match = input.match(/bsa\s+(\d+\.?\d*)\s*kg?\s+(\d+\.?\d*)\s*cm?/i);
  if (!match) return null;
  const weight = parseFloat(match[1]);
  const height = parseFloat(match[2]);
  if (!weight || !height) return null;
  const bsa = Math.sqrt((weight * height) / 3600);
  return { label: 'BSA (Mosteller)', value: `${bsa.toFixed(2)} m²` };
}

export function parseEGFR(input: string): CalculatorResult | null {
  const match = input.match(/egfr\s+(\d+\.?\d*)\s+(\d+)\s*(m|f)/i);
  if (!match) return null;
  const creatinine = parseFloat(match[1]);
  const age = parseInt(match[2]);
  const isFemale = match[3].toLowerCase() === 'f';
  if (!creatinine || !age) return null;

  const kappa = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.241 : -0.302;
  const sexMultiplier = isFemale ? 1.012 : 1.0;

  const minRatio = Math.min(creatinine / kappa, 1);
  const maxRatio = Math.max(creatinine / kappa, 1);
  const egfr = 142 * Math.pow(minRatio, alpha) * Math.pow(maxRatio, -1.200) * Math.pow(0.9938, age) * sexMultiplier;

  let interpretation = '';
  let color = '';
  if (egfr >= 90) { interpretation = 'Normal'; color = 'text-green-500'; }
  else if (egfr >= 60) { interpretation = 'Mild decrease'; color = 'text-yellow-500'; }
  else if (egfr >= 30) { interpretation = 'Moderate decrease'; color = 'text-orange-500'; }
  else if (egfr >= 15) { interpretation = 'Severe decrease'; color = 'text-red-500'; }
  else { interpretation = 'Kidney failure'; color = 'text-red-700'; }

  return { label: 'eGFR (CKD-EPI)', value: `${egfr.toFixed(0)} mL/min/1.73m²`, interpretation, color };
}

export function parseCrCl(input: string): CalculatorResult | null {
  const match = input.match(/crcl\s+(\d+\.?\d*)\s+(\d+)\s+(\d+\.?\d*)\s*(m|f)/i);
  if (!match) return null;
  const creatinine = parseFloat(match[1]);
  const age = parseInt(match[2]);
  const weight = parseFloat(match[3]);
  const isFemale = match[4].toLowerCase() === 'f';
  if (!creatinine || !age || !weight) return null;
  let crcl = ((140 - age) * weight) / (72 * creatinine);
  if (isFemale) crcl *= 0.85;
  return { label: 'CrCl (Cockcroft-Gault)', value: `${crcl.toFixed(0)} mL/min` };
}

export function tryCalculate(input: string): CalculatorResult | null {
  return parseBMI(input) || parseBSA(input) || parseEGFR(input) || parseCrCl(input);
}
