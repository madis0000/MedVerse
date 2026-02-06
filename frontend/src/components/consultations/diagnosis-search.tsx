import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  X,
  Star,
  StarOff,
  Plus,
  Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Diagnosis } from '@/types';

interface ICD10Result {
  code: string;
  description: string;
}

interface DiagnosisSearchProps {
  consultationId: string;
  diagnoses: Diagnosis[];
  onDiagnosesChange: (diagnoses: Diagnosis[]) => void;
  readOnly?: boolean;
}

export function DiagnosisSearch({
  consultationId,
  diagnoses,
  onDiagnosesChange,
  readOnly,
}: DiagnosisSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ICD10Result[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchICD10 = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setSearching(true);
    try {
      const { data } = await apiClient.get('/icd10/search', {
        params: { q: searchQuery.trim() },
      });
      setResults(Array.isArray(data) ? data : data.data ?? []);
      setShowDropdown(true);
    } catch {
      toast.error('Failed to search ICD-10 codes');
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      searchICD10(value);
    }, 300);
  }

  async function handleAddDiagnosis(result: ICD10Result) {
    const alreadyAdded = diagnoses.some((d) => d.icd10Code === result.code);
    if (alreadyAdded) {
      toast.info('This diagnosis has already been added');
      return;
    }

    setAdding(result.code);
    try {
      const { data } = await apiClient.post(
        `/consultations/${consultationId}/diagnoses`,
        {
          icd10Code: result.code,
          icd10Description: result.description,
          isPrimary: diagnoses.length === 0,
        },
      );
      onDiagnosesChange([...diagnoses, data]);
      setQuery('');
      setResults([]);
      setShowDropdown(false);
      toast.success('Diagnosis added');
    } catch {
      toast.error('Failed to add diagnosis');
    } finally {
      setAdding(null);
    }
  }

  async function handleTogglePrimary(diagnosis: Diagnosis) {
    const updated = diagnoses.map((d) => ({
      ...d,
      isPrimary: d.id === diagnosis.id ? !d.isPrimary : false,
    }));

    try {
      await apiClient.patch(
        `/consultations/${consultationId}/diagnoses/${diagnosis.id}`,
        { isPrimary: !diagnosis.isPrimary },
      );
      onDiagnosesChange(updated);
    } catch {
      toast.error('Failed to update primary diagnosis');
    }
  }

  async function handleRemoveDiagnosis(diagnosis: Diagnosis) {
    try {
      await apiClient.delete(
        `/consultations/${consultationId}/diagnoses/${diagnosis.id}`,
      );
      onDiagnosesChange(diagnoses.filter((d) => d.id !== diagnosis.id));
      toast.success('Diagnosis removed');
    } catch {
      toast.error('Failed to remove diagnosis');
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Diagnoses (ICD-10)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        {!readOnly && (
          <div ref={searchRef} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ICD-10 codes or descriptions..."
                value={query}
                onChange={handleQueryChange}
                onFocus={() => {
                  if (results.length > 0) setShowDropdown(true);
                }}
                className="pl-9 pr-8"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Search Results Dropdown */}
            {showDropdown && results.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-64 overflow-y-auto">
                {results.map((result) => {
                  const alreadyAdded = diagnoses.some(
                    (d) => d.icd10Code === result.code,
                  );
                  return (
                    <button
                      key={result.code}
                      type="button"
                      disabled={alreadyAdded || adding === result.code}
                      onClick={() => handleAddDiagnosis(result)}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-start gap-2 border-b last:border-0',
                        alreadyAdded && 'opacity-50 cursor-not-allowed',
                      )}
                    >
                      <Badge variant="outline" className="shrink-0 mt-0.5 font-mono text-xs">
                        {result.code}
                      </Badge>
                      <span className="flex-1">{result.description}</span>
                      {adding === result.code && (
                        <Loader2 className="h-4 w-4 animate-spin shrink-0 mt-0.5" />
                      )}
                      {alreadyAdded && (
                        <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                          Added
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {showDropdown && !searching && query.trim().length >= 2 && results.length === 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg p-4 text-center text-sm text-muted-foreground">
                No matching ICD-10 codes found.
              </div>
            )}
          </div>
        )}

        {/* Current Diagnoses List */}
        {diagnoses.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No diagnoses added yet.
          </div>
        ) : (
          <div className="space-y-2">
            {diagnoses.map((diagnosis) => (
              <div
                key={diagnosis.id}
                className={cn(
                  'flex items-center gap-2 rounded-md border p-2.5 transition-colors',
                  diagnosis.isPrimary && 'border-primary/50 bg-primary/5',
                )}
              >
                {/* Primary toggle */}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleTogglePrimary(diagnosis)}
                    className="shrink-0 text-muted-foreground hover:text-yellow-500 transition-colors"
                    title={
                      diagnosis.isPrimary
                        ? 'Remove primary flag'
                        : 'Set as primary diagnosis'
                    }
                  >
                    {diagnosis.isPrimary ? (
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ) : (
                      <StarOff className="h-4 w-4" />
                    )}
                  </button>
                )}
                {readOnly && diagnosis.isPrimary && (
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 shrink-0" />
                )}

                <Badge variant="outline" className="shrink-0 font-mono text-xs">
                  {diagnosis.icd10Code}
                </Badge>
                <span className="flex-1 text-sm">{diagnosis.icd10Description}</span>
                {diagnosis.isPrimary && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    Primary
                  </Badge>
                )}

                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDiagnosis(diagnosis)}
                    className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                    title="Remove diagnosis"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
