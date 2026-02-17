import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type BodyView = 'front' | 'back';

interface BodyMarker {
  id: string;
  region: string;
  note: string;
  view: BodyView;
}

interface BodyMapProps {
  markers: BodyMarker[];
  onChange: (markers: BodyMarker[]) => void;
  readOnly?: boolean;
}

const FRONT_REGIONS: Record<string, { label: string; path: string }> = {
  head: {
    label: 'Head',
    path: 'M 90,10 C 90,10 75,10 70,25 C 65,40 65,50 70,55 C 75,60 85,65 90,65 C 95,65 105,60 110,55 C 115,50 115,40 110,25 C 105,10 90,10 90,10 Z',
  },
  chest: {
    label: 'Chest',
    path: 'M 65,70 L 115,70 L 120,85 L 120,110 L 60,110 L 60,85 Z',
  },
  abdomen: {
    label: 'Abdomen',
    path: 'M 60,110 L 120,110 L 118,145 L 110,160 L 70,160 L 62,145 Z',
  },
  leftArm: {
    label: 'Left Arm',
    path: 'M 60,70 L 40,80 L 25,120 L 15,170 L 25,172 L 40,130 L 55,90 L 60,85 Z',
  },
  rightArm: {
    label: 'Right Arm',
    path: 'M 120,70 L 140,80 L 155,120 L 165,170 L 155,172 L 140,130 L 125,90 L 120,85 Z',
  },
  leftLeg: {
    label: 'Left Leg',
    path: 'M 70,160 L 80,160 L 82,200 L 85,240 L 82,280 L 68,280 L 65,240 L 62,200 Z',
  },
  rightLeg: {
    label: 'Right Leg',
    path: 'M 100,160 L 110,160 L 118,200 L 115,240 L 112,280 L 98,280 L 95,240 L 98,200 Z',
  },
};

const BACK_REGIONS: Record<string, { label: string; path: string }> = {
  headBack: {
    label: 'Head (Back)',
    path: 'M 90,10 C 90,10 75,10 70,25 C 65,40 65,50 70,55 C 75,60 85,65 90,65 C 95,65 105,60 110,55 C 115,50 115,40 110,25 C 105,10 90,10 90,10 Z',
  },
  upperBack: {
    label: 'Upper Back',
    path: 'M 65,70 L 115,70 L 120,85 L 120,110 L 60,110 L 60,85 Z',
  },
  lowerBack: {
    label: 'Lower Back',
    path: 'M 60,110 L 120,110 L 118,145 L 110,160 L 70,160 L 62,145 Z',
  },
  leftArmBack: {
    label: 'Left Arm (Back)',
    path: 'M 60,70 L 40,80 L 25,120 L 15,170 L 25,172 L 40,130 L 55,90 L 60,85 Z',
  },
  rightArmBack: {
    label: 'Right Arm (Back)',
    path: 'M 120,70 L 140,80 L 155,120 L 165,170 L 155,172 L 140,130 L 125,90 L 120,85 Z',
  },
  leftLegBack: {
    label: 'Left Leg (Back)',
    path: 'M 70,160 L 80,160 L 82,200 L 85,240 L 82,280 L 68,280 L 65,240 L 62,200 Z',
  },
  rightLegBack: {
    label: 'Right Leg (Back)',
    path: 'M 100,160 L 110,160 L 118,200 L 115,240 L 112,280 L 98,280 L 95,240 L 98,200 Z',
  },
};

let markerIdCounter = 0;
function generateMarkerId(): string {
  markerIdCounter += 1;
  return `marker-${Date.now()}-${markerIdCounter}`;
}

export function BodyMap({ markers, onChange, readOnly }: BodyMapProps) {
  const { t } = useTranslation();
  const [view, setView] = useState<BodyView>('front');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const regions = view === 'front' ? FRONT_REGIONS : BACK_REGIONS;

  const handleRegionClick = useCallback(
    (regionKey: string) => {
      if (readOnly) return;
      setSelectedRegion(regionKey);
      setNoteInput('');
    },
    [readOnly],
  );

  function handleAddMarker() {
    if (!selectedRegion || !noteInput.trim()) return;

    const regionDef = regions[selectedRegion];
    const newMarker: BodyMarker = {
      id: generateMarkerId(),
      region: selectedRegion,
      note: noteInput.trim(),
      view,
    };

    onChange([...markers, newMarker]);
    setNoteInput('');
    setSelectedRegion(null);
  }

  function handleRemoveMarker(markerId: string) {
    onChange(markers.filter((m) => m.id !== markerId));
  }

  function handleClearAll() {
    onChange([]);
  }

  const currentViewMarkers = markers.filter((m) => m.view === view);

  function getRegionMarkerCount(regionKey: string): number {
    return markers.filter((m) => m.region === regionKey && m.view === view).length;
  }

  function getRegionLabel(regionKey: string): string {
    const allRegions = { ...FRONT_REGIONS, ...BACK_REGIONS };
    return allRegions[regionKey]?.label ?? regionKey;
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {t('consultations.bodyMap')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border overflow-hidden">
              <button
                type="button"
                onClick={() => setView('front')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  view === 'front'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted',
                )}
              >
                {t('consultations.bodyMap.front')}
              </button>
              <button
                type="button"
                onClick={() => setView('back')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  view === 'back'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted',
                )}
              >
                {t('consultations.bodyMap.back')}
              </button>
            </div>
            {!readOnly && markers.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-muted-foreground h-7 px-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* SVG Body Map */}
        <div className="flex justify-center">
          <svg
            viewBox="0 0 180 295"
            className="w-48 h-auto"
            style={{ maxHeight: 320 }}
          >
            {/* Body outline stroke */}
            <path
              d="M 90,8 C 78,8 68,18 66,30 C 64,42 66,52 72,58 C 74,60 78,63 82,65 L 65,70 L 38,80 L 22,125 L 12,175 L 22,177 L 38,132 L 55,92 L 58,110 L 58,148 L 66,163 L 62,205 L 64,250 L 66,283 L 84,283 L 86,245 L 88,205 L 90,180 L 92,205 L 94,245 L 96,283 L 114,283 L 116,250 L 118,205 L 114,163 L 122,148 L 122,110 L 125,92 L 142,132 L 158,177 L 168,175 L 158,125 L 142,80 L 115,70 L 98,65 C 102,63 106,60 108,58 C 114,52 116,42 114,30 C 112,18 102,8 90,8 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-muted-foreground/30"
            />

            {/* Clickable regions */}
            {Object.entries(regions).map(([key, region]) => {
              const count = getRegionMarkerCount(key);
              const isSelected = selectedRegion === key;
              const isHovered = hoveredRegion === key;

              return (
                <g key={key}>
                  <path
                    d={region.path}
                    fill={
                      isSelected
                        ? 'hsl(var(--primary) / 0.3)'
                        : count > 0
                          ? 'hsl(var(--destructive) / 0.15)'
                          : isHovered
                            ? 'hsl(var(--primary) / 0.1)'
                            : 'transparent'
                    }
                    stroke={
                      isSelected
                        ? 'hsl(var(--primary))'
                        : count > 0
                          ? 'hsl(var(--destructive) / 0.5)'
                          : isHovered
                            ? 'hsl(var(--primary) / 0.5)'
                            : 'transparent'
                    }
                    strokeWidth="1"
                    className={cn(
                      'transition-all duration-150',
                      !readOnly && 'cursor-pointer',
                    )}
                    onClick={() => handleRegionClick(key)}
                    onMouseEnter={() => setHoveredRegion(key)}
                    onMouseLeave={() => setHoveredRegion(null)}
                  />
                  {count > 0 && (
                    <g>
                      {/* Marker dot indicator in region center — derived from bounding box */}
                      <circle
                        cx={key.includes('left') || key.includes('Left') ? 45 : key.includes('right') || key.includes('Right') ? 135 : 90}
                        cy={
                          key.includes('head') || key.includes('Head') ? 38
                            : key.includes('chest') || key.includes('upper') || key.includes('Upper') ? 90
                              : key.includes('abdomen') || key.includes('lower') || key.includes('Lower') ? 135
                                : key.includes('Arm') || key.includes('arm') ? 125
                                  : 220
                        }
                        r="8"
                        fill="hsl(var(--destructive))"
                        className="opacity-80"
                      />
                      <text
                        x={key.includes('left') || key.includes('Left') ? 45 : key.includes('right') || key.includes('Right') ? 135 : 90}
                        y={
                          (key.includes('head') || key.includes('Head') ? 38
                            : key.includes('chest') || key.includes('upper') || key.includes('Upper') ? 90
                              : key.includes('abdomen') || key.includes('lower') || key.includes('Lower') ? 135
                                : key.includes('Arm') || key.includes('arm') ? 125
                                  : 220) + 1
                        }
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="white"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        {count}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Add note to selected region */}
        {selectedRegion && !readOnly && (
          <div className="rounded-md border bg-muted/30 p-3 space-y-2">
            <p className="text-sm font-medium">
              {t('consultations.bodyMap.addNoteTo')}{' '}
              <span className="text-primary">{regions[selectedRegion]?.label}</span>
            </p>
            <div className="flex gap-2">
              <Input
                placeholder={t('consultations.bodyMap.describeFinding')}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMarker();
                  }
                }}
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleAddMarker}
                disabled={!noteInput.trim()}
              >
                {t('common.add')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedRegion(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Markers List */}
        {markers.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('consultations.bodyMap.annotations')} ({markers.length})
            </p>
            <div className="space-y-1">
              {markers.map((marker) => (
                <div
                  key={marker.id}
                  className={cn(
                    'flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm',
                    marker.view !== view && 'opacity-50',
                  )}
                >
                  <MapPin className="h-3.5 w-3.5 text-destructive shrink-0" />
                  <Badge variant="outline" className="text-xs shrink-0">
                    {getRegionLabel(marker.region)}
                  </Badge>
                  <span className="flex-1 truncate">{marker.note}</span>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMarker(marker.id)}
                      className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {markers.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-2">
            {t('consultations.bodyMap.clickToAnnotate')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
