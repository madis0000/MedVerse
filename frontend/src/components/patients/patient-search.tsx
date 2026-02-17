import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { usePatients } from '@/api/patients';
import type { Patient } from '@/types';

interface PatientSearchProps {
  value?: string;
  onSelect: (patient: Patient | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function PatientSearch({
  value,
  onSelect,
  placeholder,
  disabled = false,
}: PatientSearchProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data, isLoading } = usePatients({
    search: search || undefined,
    limit: 20,
  });

  const patients: Patient[] = data?.data || [];
  const selectedPatient = patients.find((p) => p.id === value);

  const displayPlaceholder = placeholder || t('patients.searchPatient');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {selectedPatient ? (
            <span className="flex items-center gap-2 truncate">
              <User className="h-4 w-4 shrink-0 text-muted-foreground" />
              {selectedPatient.firstName} {selectedPatient.lastName}
              <span className="text-muted-foreground">({selectedPatient.mrn})</span>
            </span>
          ) : (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Search className="h-4 w-4 shrink-0" />
              {displayPlaceholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t('patients.searchByNameMrnPhone')}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">{t('common.searching')}</div>
            ) : (
              <>
                <CommandEmpty>{t('patients.noPatientsFound')}</CommandEmpty>
                <CommandGroup>
                  {patients.map((patient) => (
                    <CommandItem
                      key={patient.id}
                      value={patient.id}
                      onSelect={() => {
                        onSelect(patient.id === value ? null : patient);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === patient.id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {patient.firstName} {patient.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('patients.mrn')}: {patient.mrn}
                          {patient.phone && ` | ${patient.phone}`}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                          patient.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
                        )}
                      >
                        {patient.status}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
