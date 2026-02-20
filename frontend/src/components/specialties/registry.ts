import { lazy, ComponentType } from 'react';

export interface SpecialtyModule {
  SpecialtyPanel: ComponentType<{ consultationId: string; patientId: string; specialty: string }>;
}

const SPECIALTY_MODULES: Record<string, () => Promise<SpecialtyModule>> = {
  'Cardiology': () => import('./cardiology').then((m) => ({ SpecialtyPanel: m.default || m.CardiologyPanel })),
  'Psychiatry': () => import('./psychiatry').then((m) => ({ SpecialtyPanel: m.default || m.PsychiatryPanel })),
  'Pediatrics': () => import('./pediatrics').then((m) => ({ SpecialtyPanel: m.default || m.PediatricsPanel })),
  'Dermatology': () => import('./dermatology').then((m) => ({ SpecialtyPanel: m.default || m.DermatologyPanel })),
  'Ophthalmology': () => import('./ophthalmology').then((m) => ({ SpecialtyPanel: m.default || m.OphthalmologyPanel })),
};

export function hasSpecialtyModule(specialtyName: string): boolean {
  return specialtyName in SPECIALTY_MODULES;
}

export function getSpecialtyModule(specialtyName: string): (() => Promise<SpecialtyModule>) | null {
  return SPECIALTY_MODULES[specialtyName] || null;
}

export function getRegisteredSpecialties(): string[] {
  return Object.keys(SPECIALTY_MODULES);
}
