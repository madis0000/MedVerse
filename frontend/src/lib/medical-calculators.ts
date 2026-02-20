// ===== Universal Calculators =====

export function calculateBMI(weightKg: number, heightM: number): number {
  if (!weightKg || !heightM) return 0;
  return weightKg / (heightM * heightM);
}

export function interpretBMI(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-500' };
  if (bmi < 25) return { label: 'Normal', color: 'text-green-500' };
  if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-500' };
  if (bmi < 35) return { label: 'Obese Class I', color: 'text-orange-500' };
  if (bmi < 40) return { label: 'Obese Class II', color: 'text-red-500' };
  return { label: 'Obese Class III', color: 'text-red-700' };
}

export function calculateBSA(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm) return 0;
  return Math.sqrt((weightKg * heightCm) / 3600); // Mosteller
}

export function calculateBMR(weightKg: number, heightCm: number, age: number, isMale: boolean): number {
  if (!weightKg || !heightCm || !age) return 0;
  // Mifflin-St Jeor
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return isMale ? base + 5 : base - 161;
}

export function calculateIBW(heightCm: number, isMale: boolean): number {
  if (!heightCm) return 0;
  const heightInches = heightCm / 2.54;
  if (heightInches <= 60) return isMale ? 50 : 45.5;
  return isMale
    ? 50 + 2.3 * (heightInches - 60)
    : 45.5 + 2.3 * (heightInches - 60);
}

// ===== Renal Calculators =====

export function calculateEGFR(creatinine: number, age: number, isFemale: boolean): number {
  if (!creatinine || !age) return 0;
  const kappa = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.241 : -0.302;
  const sexMultiplier = isFemale ? 1.012 : 1.0;
  const minRatio = Math.min(creatinine / kappa, 1);
  const maxRatio = Math.max(creatinine / kappa, 1);
  return 142 * Math.pow(minRatio, alpha) * Math.pow(maxRatio, -1.200) * Math.pow(0.9938, age) * sexMultiplier;
}

export function interpretEGFR(egfr: number): { stage: string; label: string; color: string } {
  if (egfr >= 90) return { stage: 'G1', label: 'Normal', color: 'text-green-500' };
  if (egfr >= 60) return { stage: 'G2', label: 'Mildly decreased', color: 'text-yellow-500' };
  if (egfr >= 45) return { stage: 'G3a', label: 'Mild-moderate decrease', color: 'text-orange-400' };
  if (egfr >= 30) return { stage: 'G3b', label: 'Moderate-severe decrease', color: 'text-orange-500' };
  if (egfr >= 15) return { stage: 'G4', label: 'Severely decreased', color: 'text-red-500' };
  return { stage: 'G5', label: 'Kidney failure', color: 'text-red-700' };
}

export function calculateCrCl(creatinine: number, age: number, weightKg: number, isFemale: boolean): number {
  if (!creatinine || !age || !weightKg) return 0;
  let crcl = ((140 - age) * weightKg) / (72 * creatinine);
  if (isFemale) crcl *= 0.85;
  return crcl;
}

// ===== Hepatic Calculators =====

export function calculateMELD(bilirubin: number, inr: number, creatinine: number, sodium?: number): number {
  if (!bilirubin || !inr || !creatinine) return 0;
  const bili = Math.max(bilirubin, 1);
  const cr = Math.min(Math.max(creatinine, 1), 4);
  const inrVal = Math.max(inr, 1);
  let meld = 3.78 * Math.log(bili) + 11.2 * Math.log(inrVal) + 9.57 * Math.log(cr) + 6.43;
  meld = Math.round(meld);
  if (sodium !== undefined) {
    const na = Math.min(Math.max(sodium, 125), 137);
    meld = meld - na - 0.025 * meld * (140 - na) + 140;
  }
  return Math.max(Math.min(Math.round(meld), 40), 6);
}

export function calculateChildPugh(
  ascites: 'none' | 'mild' | 'moderate',
  encephalopathy: 'none' | 'grade1_2' | 'grade3_4',
  bilirubin: number,
  albumin: number,
  inr: number,
): { score: number; class: string; survival1yr: string; survival2yr: string } {
  let score = 0;

  // Ascites
  if (ascites === 'none') score += 1;
  else if (ascites === 'mild') score += 2;
  else score += 3;

  // Encephalopathy
  if (encephalopathy === 'none') score += 1;
  else if (encephalopathy === 'grade1_2') score += 2;
  else score += 3;

  // Bilirubin
  if (bilirubin < 2) score += 1;
  else if (bilirubin <= 3) score += 2;
  else score += 3;

  // Albumin
  if (albumin > 3.5) score += 1;
  else if (albumin >= 2.8) score += 2;
  else score += 3;

  // INR
  if (inr < 1.7) score += 1;
  else if (inr <= 2.3) score += 2;
  else score += 3;

  if (score <= 6) return { score, class: 'A', survival1yr: '100%', survival2yr: '85%' };
  if (score <= 9) return { score, class: 'B', survival1yr: '81%', survival2yr: '57%' };
  return { score, class: 'C', survival1yr: '45%', survival2yr: '35%' };
}

// ===== Cardiac Calculators =====

export function calculateFramingham(
  age: number, totalCholesterol: number, hdl: number, systolicBP: number,
  isTreatedBP: boolean, isSmoker: boolean, isMale: boolean
): { riskPercent: number; category: string; color: string } {
  if (!age || !totalCholesterol || !hdl || !systolicBP) return { riskPercent: 0, category: 'Incomplete', color: 'text-gray-500' };

  // Simplified Framingham point system
  let points = 0;

  if (isMale) {
    if (age >= 20 && age <= 34) points += -9;
    else if (age <= 39) points += -4;
    else if (age <= 44) points += 0;
    else if (age <= 49) points += 3;
    else if (age <= 54) points += 6;
    else if (age <= 59) points += 8;
    else if (age <= 64) points += 10;
    else if (age <= 69) points += 11;
    else points += 12;

    if (totalCholesterol < 160) points += 0;
    else if (totalCholesterol < 200) points += 4;
    else if (totalCholesterol < 240) points += 7;
    else if (totalCholesterol < 280) points += 9;
    else points += 11;

    if (hdl >= 60) points += -1;
    else if (hdl >= 50) points += 0;
    else if (hdl >= 40) points += 1;
    else points += 2;

    if (isSmoker) points += 8;

    if (isTreatedBP) {
      if (systolicBP < 120) points += 0;
      else if (systolicBP < 130) points += 1;
      else if (systolicBP < 140) points += 2;
      else if (systolicBP < 160) points += 2;
      else points += 3;
    } else {
      if (systolicBP < 120) points += 0;
      else if (systolicBP < 130) points += 0;
      else if (systolicBP < 140) points += 1;
      else if (systolicBP < 160) points += 1;
      else points += 2;
    }
  } else {
    if (age >= 20 && age <= 34) points += -7;
    else if (age <= 39) points += -3;
    else if (age <= 44) points += 0;
    else if (age <= 49) points += 3;
    else if (age <= 54) points += 6;
    else if (age <= 59) points += 8;
    else if (age <= 64) points += 10;
    else if (age <= 69) points += 12;
    else points += 14;

    if (totalCholesterol < 160) points += 0;
    else if (totalCholesterol < 200) points += 4;
    else if (totalCholesterol < 240) points += 8;
    else if (totalCholesterol < 280) points += 11;
    else points += 13;

    if (hdl >= 60) points += -1;
    else if (hdl >= 50) points += 0;
    else if (hdl >= 40) points += 1;
    else points += 2;

    if (isSmoker) points += 9;

    if (isTreatedBP) {
      if (systolicBP < 120) points += 0;
      else if (systolicBP < 130) points += 3;
      else if (systolicBP < 140) points += 4;
      else if (systolicBP < 160) points += 5;
      else points += 6;
    } else {
      if (systolicBP < 120) points += 0;
      else if (systolicBP < 130) points += 1;
      else if (systolicBP < 140) points += 2;
      else if (systolicBP < 160) points += 3;
      else points += 4;
    }
  }

  // Simplified risk lookup
  let riskPercent: number;
  if (points <= 0) riskPercent = 1;
  else if (points <= 4) riskPercent = 1;
  else if (points <= 6) riskPercent = 2;
  else if (points <= 7) riskPercent = 3;
  else if (points <= 8) riskPercent = 4;
  else if (points <= 9) riskPercent = 5;
  else if (points <= 10) riskPercent = 6;
  else if (points <= 11) riskPercent = 8;
  else if (points <= 12) riskPercent = 10;
  else if (points <= 13) riskPercent = 12;
  else if (points <= 14) riskPercent = 16;
  else if (points <= 15) riskPercent = 20;
  else if (points <= 16) riskPercent = 25;
  else riskPercent = 30;

  let category: string;
  let color: string;
  if (riskPercent < 10) { category = 'Low Risk'; color = 'text-green-500'; }
  else if (riskPercent < 20) { category = 'Moderate Risk'; color = 'text-yellow-500'; }
  else { category = 'High Risk'; color = 'text-red-500'; }

  return { riskPercent, category, color };
}

export function calculateHEART(
  history: 0 | 1 | 2, ecg: 0 | 1 | 2, age: 0 | 1 | 2,
  riskFactors: 0 | 1 | 2, troponin: 0 | 1 | 2
): { score: number; risk: string; recommendation: string; color: string } {
  const score = history + ecg + age + riskFactors + troponin;
  if (score <= 3) return { score, risk: 'Low (1.6%)', recommendation: 'Consider early discharge', color: 'text-green-500' };
  if (score <= 6) return { score, risk: 'Moderate (12-16.6%)', recommendation: 'Admit for observation', color: 'text-yellow-500' };
  return { score, risk: 'High (50-65%)', recommendation: 'Early invasive strategy', color: 'text-red-500' };
}

export function calculateCHA2DS2VASc(
  chf: boolean, hypertension: boolean, age: number,
  diabetes: boolean, strokeTIA: boolean, vascularDisease: boolean,
  isFemale: boolean
): { score: number; riskPerYear: string; recommendation: string; color: string } {
  let score = 0;
  if (chf) score += 1;
  if (hypertension) score += 1;
  if (age >= 75) score += 2;
  else if (age >= 65) score += 1;
  if (diabetes) score += 1;
  if (strokeTIA) score += 2;
  if (vascularDisease) score += 1;
  if (isFemale) score += 1;

  let riskPerYear: string;
  let color: string;
  let recommendation: string;
  if (score === 0) { riskPerYear = '0.2%'; recommendation = 'No anticoagulation'; color = 'text-green-500'; }
  else if (score === 1) { riskPerYear = '0.6%'; recommendation = 'Consider anticoagulation'; color = 'text-yellow-500'; }
  else if (score === 2) { riskPerYear = '2.2%'; recommendation = 'Anticoagulation recommended'; color = 'text-orange-500'; }
  else if (score === 3) { riskPerYear = '3.2%'; recommendation = 'Anticoagulation recommended'; color = 'text-orange-500'; }
  else if (score === 4) { riskPerYear = '4.8%'; recommendation = 'Anticoagulation recommended'; color = 'text-red-500'; }
  else { riskPerYear = `${(score * 2).toFixed(1)}%`; recommendation = 'Anticoagulation strongly recommended'; color = 'text-red-700'; }

  return { score, riskPerYear, recommendation, color };
}

export function calculateWellsPE(
  clinicalDVT: boolean, alternativeLessLikely: boolean, heartRate100: boolean,
  immobilization: boolean, previousPEDVT: boolean, hemoptysis: boolean, malignancy: boolean
): { score: number; risk: string; probability: string; color: string } {
  let score = 0;
  if (clinicalDVT) score += 3;
  if (alternativeLessLikely) score += 3;
  if (heartRate100) score += 1.5;
  if (immobilization) score += 1.5;
  if (previousPEDVT) score += 1.5;
  if (hemoptysis) score += 1;
  if (malignancy) score += 1;

  if (score <= 1) return { score, risk: 'Low', probability: '1.3%', color: 'text-green-500' };
  if (score <= 4) return { score, risk: 'Moderate', probability: '16.2%', color: 'text-yellow-500' };
  return { score, risk: 'High', probability: '37.5%', color: 'text-red-500' };
}

// ===== Psych Scoring =====

export function scorePHQ9(responses: number[]): { score: number; severity: string; color: string } {
  const score = responses.reduce((sum, r) => sum + r, 0);
  if (score <= 4) return { score, severity: 'Minimal', color: 'text-green-500' };
  if (score <= 9) return { score, severity: 'Mild', color: 'text-yellow-500' };
  if (score <= 14) return { score, severity: 'Moderate', color: 'text-orange-500' };
  if (score <= 19) return { score, severity: 'Moderately Severe', color: 'text-red-500' };
  return { score, severity: 'Severe', color: 'text-red-700' };
}

export function scoreGAD7(responses: number[]): { score: number; severity: string; color: string } {
  const score = responses.reduce((sum, r) => sum + r, 0);
  if (score <= 4) return { score, severity: 'Minimal', color: 'text-green-500' };
  if (score <= 9) return { score, severity: 'Mild', color: 'text-yellow-500' };
  if (score <= 14) return { score, severity: 'Moderate', color: 'text-orange-500' };
  return { score, severity: 'Severe', color: 'text-red-500' };
}

// ===== OB/Peds =====

export function calculateAPGAR(
  appearance: 0 | 1 | 2, pulse: 0 | 1 | 2, grimace: 0 | 1 | 2,
  activity: 0 | 1 | 2, respiration: 0 | 1 | 2
): { score: number; interpretation: string; color: string } {
  const score = appearance + pulse + grimace + activity + respiration;
  if (score >= 7) return { score, interpretation: 'Normal', color: 'text-green-500' };
  if (score >= 4) return { score, interpretation: 'Moderately depressed', color: 'text-yellow-500' };
  return { score, interpretation: 'Severely depressed', color: 'text-red-500' };
}

export function calculateCorrectedAge(dobWeeks: number, currentAgeMonths: number): number {
  const weeksPreterm = 40 - dobWeeks;
  const correctionMonths = weeksPreterm / 4.33;
  return Math.max(currentAgeMonths - correctionMonths, 0);
}
