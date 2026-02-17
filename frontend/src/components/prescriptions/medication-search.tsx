import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Pill, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/api-client';
import type { Medication } from '@/types';

interface MedicationSearchProps {
  value: string;
  onSelect: (medication: { medicationId: string; medicationName: string }) => void;
  placeholder?: string;
}

export function MedicationSearch({ value, onSelect, placeholder }: MedicationSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Medication[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleInputChange(searchValue: string) {
    setQuery(searchValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchValue.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await apiClient.get(`/medications/search?q=${encodeURIComponent(searchValue)}`);
        setResults(data.data ?? data ?? []);
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }

  function handleSelect(medication: Medication) {
    setQuery(medication.name);
    setIsOpen(false);
    onSelect({
      medicationId: medication.id,
      medicationName: medication.name,
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder ?? t('prescriptions.medicationSearch')}
          className="pl-9 pr-8"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-lg max-h-60 overflow-y-auto">
          {results.map((med) => (
            <button
              key={med.id}
              type="button"
              className={cn(
                'flex items-start gap-3 w-full px-3 py-2.5 text-left text-sm',
                'hover:bg-accent hover:text-accent-foreground transition-colors',
              )}
              onClick={() => handleSelect(med)}
            >
              <Pill className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium truncate">{med.name}</p>
                <p className="text-xs text-muted-foreground">
                  {med.category} &middot; {med.form}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-lg p-4 text-center text-sm text-muted-foreground">
          {t('prescriptions.noMedications')}
        </div>
      )}
    </div>
  );
}
