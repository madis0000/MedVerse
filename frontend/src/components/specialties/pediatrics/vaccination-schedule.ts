// Algeria National Immunization Schedule data

export interface Vaccine {
  id: string;
  name: string;
  abbreviation: string;
  doses: VaccineDose[];
}

export interface VaccineDose {
  doseNumber: number;
  ageMonths: number;
  ageLabel: string;
  catchUpMaxMonths?: number;
}

export interface VaccinationRecord {
  vaccineId: string;
  doseNumber: number;
  dateAdministered: string;
  lotNumber?: string;
  site?: string;
  administeredBy?: string;
}

export const ALGERIA_VACCINATION_SCHEDULE: Vaccine[] = [
  {
    id: 'bcg',
    name: 'BCG (Bacillus Calmette-Guerin)',
    abbreviation: 'BCG',
    doses: [
      { doseNumber: 1, ageMonths: 0, ageLabel: 'Birth', catchUpMaxMonths: 12 },
    ],
  },
  {
    id: 'hepb',
    name: 'Hepatitis B',
    abbreviation: 'HepB',
    doses: [
      { doseNumber: 1, ageMonths: 0, ageLabel: 'Birth', catchUpMaxMonths: 1 },
      { doseNumber: 2, ageMonths: 1, ageLabel: '1 month', catchUpMaxMonths: 4 },
      { doseNumber: 3, ageMonths: 6, ageLabel: '6 months', catchUpMaxMonths: 18 },
    ],
  },
  {
    id: 'pentavalent',
    name: 'DTP-Hib-HepB (Pentavalent)',
    abbreviation: 'Penta',
    doses: [
      { doseNumber: 1, ageMonths: 2, ageLabel: '2 months', catchUpMaxMonths: 12 },
      { doseNumber: 2, ageMonths: 3, ageLabel: '3 months', catchUpMaxMonths: 12 },
      { doseNumber: 3, ageMonths: 4, ageLabel: '4 months', catchUpMaxMonths: 12 },
      { doseNumber: 4, ageMonths: 18, ageLabel: '18 months (booster)', catchUpMaxMonths: 36 },
    ],
  },
  {
    id: 'opv',
    name: 'Oral Polio Vaccine',
    abbreviation: 'OPV',
    doses: [
      { doseNumber: 1, ageMonths: 0, ageLabel: 'Birth', catchUpMaxMonths: 1 },
      { doseNumber: 2, ageMonths: 2, ageLabel: '2 months', catchUpMaxMonths: 12 },
      { doseNumber: 3, ageMonths: 3, ageLabel: '3 months', catchUpMaxMonths: 12 },
      { doseNumber: 4, ageMonths: 4, ageLabel: '4 months', catchUpMaxMonths: 12 },
      { doseNumber: 5, ageMonths: 18, ageLabel: '18 months', catchUpMaxMonths: 36 },
      { doseNumber: 6, ageMonths: 72, ageLabel: '6 years', catchUpMaxMonths: 96 },
    ],
  },
  {
    id: 'ipv',
    name: 'Injectable Polio Vaccine',
    abbreviation: 'IPV',
    doses: [
      { doseNumber: 1, ageMonths: 4, ageLabel: '4 months', catchUpMaxMonths: 12 },
    ],
  },
  {
    id: 'pcv13',
    name: 'Pneumococcal Conjugate Vaccine (PCV13)',
    abbreviation: 'PCV13',
    doses: [
      { doseNumber: 1, ageMonths: 2, ageLabel: '2 months', catchUpMaxMonths: 12 },
      { doseNumber: 2, ageMonths: 4, ageLabel: '4 months', catchUpMaxMonths: 12 },
      { doseNumber: 3, ageMonths: 12, ageLabel: '12 months', catchUpMaxMonths: 24 },
    ],
  },
  {
    id: 'rotavirus',
    name: 'Rotavirus Vaccine',
    abbreviation: 'Rota',
    doses: [
      { doseNumber: 1, ageMonths: 2, ageLabel: '2 months', catchUpMaxMonths: 4 },
      { doseNumber: 2, ageMonths: 3, ageLabel: '3 months', catchUpMaxMonths: 8 },
    ],
  },
  {
    id: 'mmr',
    name: 'Measles-Mumps-Rubella',
    abbreviation: 'MMR',
    doses: [
      { doseNumber: 1, ageMonths: 11, ageLabel: '11 months', catchUpMaxMonths: 24 },
      { doseNumber: 2, ageMonths: 18, ageLabel: '18 months', catchUpMaxMonths: 36 },
    ],
  },
  {
    id: 'dtp-booster',
    name: 'DTP Booster',
    abbreviation: 'DTP',
    doses: [
      { doseNumber: 1, ageMonths: 72, ageLabel: '6 years', catchUpMaxMonths: 96 },
      { doseNumber: 2, ageMonths: 144, ageLabel: '11-13 years', catchUpMaxMonths: 180 },
    ],
  },
  {
    id: 'td',
    name: 'Tetanus-Diphtheria',
    abbreviation: 'Td',
    doses: [
      { doseNumber: 1, ageMonths: 198, ageLabel: '16-18 years', catchUpMaxMonths: 240 },
    ],
  },
];

/**
 * Calculate the age in months from a DOB to a given reference date.
 */
function ageInMonths(dob: Date, referenceDate: Date): number {
  const years = referenceDate.getFullYear() - dob.getFullYear();
  const months = referenceDate.getMonth() - dob.getMonth();
  const days = referenceDate.getDate() - dob.getDate();
  let total = years * 12 + months;
  if (days < 0) total -= 1;
  return Math.max(total, 0);
}

/**
 * Determine status of a specific vaccine dose.
 */
export function getVaccineStatus(
  dobDate: Date,
  vaccine: Vaccine,
  dose: VaccineDose,
  records: VaccinationRecord[],
): 'completed' | 'due' | 'overdue' | 'upcoming' {
  const administered = records.find(
    (r) => r.vaccineId === vaccine.id && r.doseNumber === dose.doseNumber,
  );
  if (administered) return 'completed';

  const currentAgeMonths = ageInMonths(dobDate, new Date());
  const catchUpMax = dose.catchUpMaxMonths ?? dose.ageMonths + 6;

  if (currentAgeMonths > catchUpMax) return 'overdue';
  if (currentAgeMonths >= dose.ageMonths) return 'due';
  return 'upcoming';
}

/**
 * Get all vaccines that are due, overdue, or upcoming for a patient.
 */
export function getVaccinesDue(
  dobDate: Date,
  records: VaccinationRecord[],
): { vaccine: Vaccine; dose: VaccineDose; status: 'due' | 'overdue' | 'upcoming' }[] {
  const result: { vaccine: Vaccine; dose: VaccineDose; status: 'due' | 'overdue' | 'upcoming' }[] = [];

  for (const vaccine of ALGERIA_VACCINATION_SCHEDULE) {
    for (const dose of vaccine.doses) {
      const status = getVaccineStatus(dobDate, vaccine, dose, records);
      if (status !== 'completed') {
        result.push({ vaccine, dose, status });
      }
    }
  }

  return result.sort((a, b) => a.dose.ageMonths - b.dose.ageMonths);
}
