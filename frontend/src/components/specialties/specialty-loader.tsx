import { Suspense, useState, useEffect, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getSpecialtyModule, hasSpecialtyModule } from './registry';

interface SpecialtyLoaderProps {
  specialtyName: string;
  consultationId: string;
  patientId: string;
}

export function SpecialtyLoader({ specialtyName, consultationId, patientId }: SpecialtyLoaderProps) {
  const [SpecialtyPanel, setSpecialtyPanel] = useState<ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSpecialtyModule(specialtyName)) {
      setLoading(false);
      return;
    }

    const loader = getSpecialtyModule(specialtyName);
    if (!loader) {
      setLoading(false);
      return;
    }

    loader()
      .then((module) => {
        setSpecialtyPanel(() => module.SpecialtyPanel);
        setLoading(false);
      })
      .catch((err) => {
        console.error(`Failed to load specialty module: ${specialtyName}`, err);
        setError(`Failed to load ${specialtyName} module`);
        setLoading(false);
      });
  }, [specialtyName]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (!SpecialtyPanel) {
    return null; // No specialty module for this specialty - that's okay
  }

  return (
    <SpecialtyPanel
      consultationId={consultationId}
      patientId={patientId}
      specialty={specialtyName}
    />
  );
}
