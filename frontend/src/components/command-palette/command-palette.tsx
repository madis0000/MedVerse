import { useCallback, useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Search, Calculator, Clock, ArrowRight } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { getNavigationCommands, getQuickActions } from './command-groups';
import { tryCalculate } from './medical-calculators';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const { data: patientResults } = useQuery({
    queryKey: ['quick-search', search],
    queryFn: async () => {
      if (search.length < 2) return [];
      const { data } = await apiClient.get(`/patients/quick-search`, { params: { q: search } });
      return data?.data || data || [];
    },
    enabled: open && search.length >= 2,
    staleTime: 30000,
  });

  const calculatorResult = search.length >= 3 ? tryCalculate(search) : null;

  const navigationCommands = getNavigationCommands((path) => {
    navigate(path);
    onOpenChange(false);
  }, t);

  const quickActions = getQuickActions((path) => {
    navigate(path);
    onOpenChange(false);
  }, t);

  const handlePatientSelect = useCallback(
    (patientId: string) => {
      navigate(`/patients/${patientId}`);
      onOpenChange(false);
    },
    [navigate, onOpenChange]
  );

  // Reset search when closed
  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const patients = patientResults || [];

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command Menu"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
    >
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative w-full max-w-lg rounded-xl border bg-popover text-popover-foreground shadow-2xl animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder={t('commandPalette.placeholder')}
            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            ESC
          </kbd>
        </div>
        <Command.List className="max-h-[300px] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            {t('commandPalette.noResults')}
          </Command.Empty>

          {/* Calculator Result */}
          {calculatorResult && (
            <Command.Group heading={t('commandPalette.calculator')}>
              <Command.Item className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer aria-selected:bg-accent">
                <Calculator className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <span className="font-medium">{calculatorResult.label}: </span>
                  <span className={calculatorResult.color || ''}>{calculatorResult.value}</span>
                  {calculatorResult.interpretation && (
                    <span className={`ml-2 text-xs ${calculatorResult.color || 'text-muted-foreground'}`}>
                      ({calculatorResult.interpretation})
                    </span>
                  )}
                </div>
              </Command.Item>
            </Command.Group>
          )}

          {/* Patient Results */}
          {patients.length > 0 && (
            <Command.Group heading={t('commandPalette.patients')}>
              {patients.map((patient: any) => (
                <Command.Item
                  key={patient.id}
                  value={`patient-${patient.firstName}-${patient.lastName}-${patient.mrn}`}
                  onSelect={() => handlePatientSelect(patient.id)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer aria-selected:bg-accent"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {patient.firstName?.[0]}{patient.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{patient.firstName} {patient.lastName}</p>
                    <p className="text-xs text-muted-foreground">{patient.mrn}{patient.phone ? ` · ${patient.phone}` : ''}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* Quick Actions */}
          {!search && (
            <Command.Group heading={t('commandPalette.quickActions')}>
              {quickActions.map((item) => (
                <Command.Item
                  key={item.id}
                  value={item.label}
                  onSelect={item.action}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer aria-selected:bg-accent"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* Navigation */}
          <Command.Group heading={t('commandPalette.navigation')}>
            {navigationCommands.map((item) => (
              <Command.Item
                key={item.id}
                value={[item.label, ...(item.keywords || [])].join(' ')}
                onSelect={item.action}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer aria-selected:bg-accent"
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span>{item.label}</span>
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
        <div className="border-t px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{t('commandPalette.hint')}</span>
          <div className="flex items-center gap-2">
            <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">↑↓</kbd>
            <span>{t('commandPalette.navigate')}</span>
            <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">↵</kbd>
            <span>{t('commandPalette.select')}</span>
          </div>
        </div>
      </div>
    </Command.Dialog>
  );
}
