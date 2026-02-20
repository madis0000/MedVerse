import {
  Users,
  Calendar,
  Stethoscope,
  FileText,
  Settings,
  LayoutDashboard,
  FlaskConical,
  Pill,
  Receipt,
  DollarSign,
  UserPlus,
  ClipboardList,
  Calculator,
} from 'lucide-react';

export interface CommandItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[];
  group: string;
}

export function getNavigationCommands(navigate: (path: string) => void, t: (key: string) => string): CommandItem[] {
  return [
    { id: 'nav-dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, action: () => navigate('/dashboard'), keywords: ['home', 'main'], group: 'navigation' },
    { id: 'nav-patients', label: t('nav.patients'), icon: Users, action: () => navigate('/patients'), keywords: ['patient', 'list'], group: 'navigation' },
    { id: 'nav-appointments', label: t('nav.appointments'), icon: Calendar, action: () => navigate('/appointments'), keywords: ['schedule', 'booking'], group: 'navigation' },
    { id: 'nav-consultations', label: t('nav.consultations'), icon: Stethoscope, action: () => navigate('/consultations'), keywords: ['visit', 'soap'], group: 'navigation' },
    { id: 'nav-prescriptions', label: t('nav.prescriptions'), icon: Pill, action: () => navigate('/prescriptions'), keywords: ['medication', 'rx'], group: 'navigation' },
    { id: 'nav-laboratory', label: t('nav.laboratory'), icon: FlaskConical, action: () => navigate('/laboratory'), keywords: ['lab', 'test', 'results'], group: 'navigation' },
    { id: 'nav-billing', label: t('nav.billing'), icon: Receipt, action: () => navigate('/billing'), keywords: ['invoice', 'payment'], group: 'navigation' },
    { id: 'nav-finance', label: t('nav.finance'), icon: DollarSign, action: () => navigate('/finance'), keywords: ['money', 'revenue', 'expense'], group: 'navigation' },
    { id: 'nav-documents', label: t('nav.documents'), icon: FileText, action: () => navigate('/documents'), keywords: ['files', 'upload'], group: 'navigation' },
    { id: 'nav-settings', label: t('nav.settings'), icon: Settings, action: () => navigate('/settings'), keywords: ['config', 'preferences'], group: 'navigation' },
    { id: 'nav-audit', label: t('nav.auditLog'), icon: ClipboardList, action: () => navigate('/audit-log'), keywords: ['log', 'history', 'trail'], group: 'navigation' },
    { id: 'nav-staff', label: t('nav.users'), icon: Users, action: () => navigate('/users'), keywords: ['staff', 'team', 'doctors'], group: 'navigation' },
  ];
}

export function getQuickActions(navigate: (path: string) => void, t: (key: string) => string): CommandItem[] {
  return [
    { id: 'action-new-patient', label: t('patients.addPatient'), icon: UserPlus, action: () => navigate('/patients/new'), keywords: ['register', 'create'], group: 'actions' },
    { id: 'action-new-appointment', label: t('appointments.bookAppointment'), icon: Calendar, action: () => navigate('/appointments?action=book'), keywords: ['schedule', 'book'], group: 'actions' },
    { id: 'action-new-invoice', label: t('billing.newInvoice'), icon: Receipt, action: () => navigate('/billing?action=new'), keywords: ['bill', 'charge'], group: 'actions' },
    { id: 'action-calculator', label: 'Medical Calculator', icon: Calculator, action: () => {}, keywords: ['bmi', 'egfr', 'bsa', 'calc'], group: 'actions' },
  ];
}
