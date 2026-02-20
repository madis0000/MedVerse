import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Stethoscope, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/lib/api-client';
import { LesionBodyMap, type LesionRecord } from './lesion-body-map';
import { LesionDetailForm } from './lesion-detail-form';
import { LesionEvolution } from './lesion-evolution';

interface DermatologyPanelProps {
  consultationId: string;
  patientId: string;
  specialty: string;
}

let lesionIdCounter = 0;
function generateLesionId(): string {
  lesionIdCounter += 1;
  return `lesion-${Date.now()}-${lesionIdCounter}`;
}

export function DermatologyPanel({ consultationId, patientId }: DermatologyPanelProps) {
  const { t } = useTranslation();

  const [lesions, setLesions] = useState<LesionRecord[]>([]);
  const [selectedLesionId, setSelectedLesionId] = useState<string | undefined>(undefined);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newLesionDraft, setNewLesionDraft] = useState<LesionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load existing lesion data from consultation customFields
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const response = await apiClient.get(`/consultations/${consultationId}`);
        const consultation = response.data;
        const savedLesions =
          consultation?.customFields?.dermatology?.lesions || [];
        setLesions(savedLesions);
      } catch (err) {
        console.error('Failed to load dermatology data:', err);
      } finally {
        setLoading(false);
      }
    }

    if (consultationId) {
      loadData();
    }
  }, [consultationId]);

  // Save lesions to backend
  const saveLesions = useCallback(
    async (updatedLesions: LesionRecord[]) => {
      setSaving(true);
      try {
        await apiClient.patch(`/consultations/${consultationId}`, {
          customFields: {
            dermatology: {
              lesions: updatedLesions,
            },
          },
        });
        toast.success(t('specialties.dermatology.saved'));
      } catch (err) {
        console.error('Failed to save dermatology data:', err);
        toast.error(t('specialties.dermatology.saveFailed'));
      } finally {
        setSaving(false);
      }
    },
    [consultationId, t],
  );

  // Handle body map click to start adding a new lesion
  const handleAddLesion = useCallback(
    (region: string, view: string) => {
      const draft: LesionRecord = {
        id: generateLesionId(),
        region,
        view: view as LesionRecord['view'],
        type: '',
        color: '',
        shape: '',
        size: '',
        border: '',
        distribution: '',
        surface: '',
        notes: '',
        createdAt: new Date().toISOString(),
      };
      setNewLesionDraft(draft);
      setIsAddingNew(true);
      setSelectedLesionId(draft.id);
    },
    [],
  );

  // Select an existing lesion from body map or list
  const handleLesionSelect = useCallback((lesion: LesionRecord) => {
    setSelectedLesionId(lesion.id);
    setIsAddingNew(false);
    setNewLesionDraft(null);
  }, []);

  // Save a lesion (new or existing)
  const handleLesionSave = useCallback(
    (lesion: LesionRecord) => {
      let updatedLesions: LesionRecord[];

      if (isAddingNew) {
        updatedLesions = [...lesions, lesion];
        setIsAddingNew(false);
        setNewLesionDraft(null);
      } else {
        updatedLesions = lesions.map((l) => (l.id === lesion.id ? lesion : l));
      }

      setLesions(updatedLesions);
      setSelectedLesionId(lesion.id);
      saveLesions(updatedLesions);
    },
    [isAddingNew, lesions, saveLesions],
  );

  // Delete a lesion
  const handleLesionDelete = useCallback(
    (id: string) => {
      const updatedLesions = lesions.filter((l) => l.id !== id);
      setLesions(updatedLesions);
      setSelectedLesionId(undefined);
      setIsAddingNew(false);
      setNewLesionDraft(null);
      saveLesions(updatedLesions);
    },
    [lesions, saveLesions],
  );

  // Determine which lesion to show in the detail form
  const activeLesion: LesionRecord | null = isAddingNew
    ? newLesionDraft
    : lesions.find((l) => l.id === selectedLesionId) || null;

  // Lesion summary counts
  const lesionTypeCounts = lesions.reduce<Record<string, number>>((acc, l) => {
    if (l.type) {
      acc[l.type] = (acc[l.type] || 0) + 1;
    }
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-rose-500" />
          <h2 className="text-lg font-semibold">
            {t('specialties.dermatology.title')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {lesions.length > 0 && (
            <Badge variant="outline">
              {lesions.length}{' '}
              {lesions.length === 1
                ? t('specialties.dermatology.lesionSingular')
                : t('specialties.dermatology.lesionPlural')}
            </Badge>
          )}
          {saving && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t('common.saving')}
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="tracker" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tracker">
            {t('specialties.dermatology.tabs.lesionTracker')}
          </TabsTrigger>
          <TabsTrigger value="evolution">
            {t('specialties.dermatology.tabs.evolution')}
          </TabsTrigger>
        </TabsList>

        {/* Lesion Tracker Tab */}
        <TabsContent value="tracker" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Body Map */}
            <div className="space-y-3">
              <LesionBodyMap
                lesions={lesions}
                onLesionSelect={handleLesionSelect}
                onAddLesion={handleAddLesion}
                selectedLesionId={selectedLesionId}
              />

              {/* Lesion type summary */}
              {Object.keys(lesionTypeCounts).length > 0 && (
                <div className="rounded-md border p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('specialties.dermatology.summary')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(lesionTypeCounts).map(([type, count]) => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {t(`specialties.dermatology.morphologyTypes.${type}`)} ({count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Lesion Detail Form */}
            <div>
              <LesionDetailForm
                lesion={activeLesion}
                onSave={handleLesionSave}
                onDelete={handleLesionDelete}
              />
            </div>
          </div>
        </TabsContent>

        {/* Evolution Tab */}
        <TabsContent value="evolution" className="mt-4">
          <LesionEvolution
            patientId={patientId}
            currentLesions={lesions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DermatologyPanel;
