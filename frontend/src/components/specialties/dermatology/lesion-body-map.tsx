import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { ABCDEScore } from './abcde-scoring';

export interface LesionRecord {
  id: string;
  region: string;
  view: 'anterior' | 'posterior' | 'left' | 'right';
  type: string;
  color: string;
  shape: string;
  size: string;
  border: string;
  distribution: string;
  surface: string;
  notes: string;
  dermoscopyFindings?: string;
  abcdeScore?: ABCDEScore;
  biopsyOrdered?: boolean;
  biopsyResult?: string;
  photos?: string[];
  createdAt: string;
  updatedAt?: string;
}

interface LesionBodyMapProps {
  lesions: LesionRecord[];
  onLesionSelect: (lesion: LesionRecord) => void;
  onAddLesion: (region: string, view: string) => void;
  readOnly?: boolean;
  selectedLesionId?: string;
}

// Region definitions with approximate center coordinates for marker placement
interface RegionDef {
  labelKey: string;
  path: string;
  cx: number;
  cy: number;
}

const ANTERIOR_REGIONS: Record<string, RegionDef> = {
  forehead: {
    labelKey: 'regions.forehead',
    path: 'M 78,12 L 102,12 L 104,24 L 76,24 Z',
    cx: 90, cy: 18,
  },
  rightCheek: {
    labelKey: 'regions.rightCheek',
    path: 'M 76,24 L 82,24 L 80,38 L 72,36 Z',
    cx: 77, cy: 31,
  },
  nose: {
    labelKey: 'regions.nose',
    path: 'M 86,24 L 94,24 L 93,38 L 87,38 Z',
    cx: 90, cy: 31,
  },
  leftCheek: {
    labelKey: 'regions.leftCheek',
    path: 'M 98,24 L 104,24 L 108,36 L 100,38 Z',
    cx: 103, cy: 31,
  },
  chin: {
    labelKey: 'regions.chin',
    path: 'M 80,38 L 100,38 L 98,48 L 82,48 Z',
    cx: 90, cy: 43,
  },
  neck: {
    labelKey: 'regions.neck',
    path: 'M 82,48 L 98,48 L 100,62 L 80,62 Z',
    cx: 90, cy: 55,
  },
  chest: {
    labelKey: 'regions.chest',
    path: 'M 64,65 L 116,65 L 118,100 L 62,100 Z',
    cx: 90, cy: 82,
  },
  abdomen: {
    labelKey: 'regions.abdomen',
    path: 'M 62,100 L 118,100 L 115,145 L 65,145 Z',
    cx: 90, cy: 122,
  },
  rightShoulder: {
    labelKey: 'regions.rightShoulder',
    path: 'M 46,62 L 64,65 L 62,80 L 44,76 Z',
    cx: 54, cy: 71,
  },
  leftShoulder: {
    labelKey: 'regions.leftShoulder',
    path: 'M 116,65 L 134,62 L 136,76 L 118,80 Z',
    cx: 126, cy: 71,
  },
  rightUpperArm: {
    labelKey: 'regions.rightUpperArm',
    path: 'M 40,76 L 56,80 L 50,115 L 36,110 Z',
    cx: 46, cy: 95,
  },
  leftUpperArm: {
    labelKey: 'regions.leftUpperArm',
    path: 'M 124,80 L 140,76 L 144,110 L 130,115 Z',
    cx: 134, cy: 95,
  },
  rightForearm: {
    labelKey: 'regions.rightForearm',
    path: 'M 32,110 L 48,115 L 40,160 L 26,155 Z',
    cx: 37, cy: 135,
  },
  leftForearm: {
    labelKey: 'regions.leftForearm',
    path: 'M 132,115 L 148,110 L 154,155 L 140,160 Z',
    cx: 143, cy: 135,
  },
  rightHand: {
    labelKey: 'regions.rightHand',
    path: 'M 22,155 L 38,160 L 34,182 L 18,178 Z',
    cx: 28, cy: 168,
  },
  leftHand: {
    labelKey: 'regions.leftHand',
    path: 'M 142,160 L 158,155 L 162,178 L 146,182 Z',
    cx: 152, cy: 168,
  },
  rightThigh: {
    labelKey: 'regions.rightThigh',
    path: 'M 65,148 L 88,148 L 86,210 L 62,210 Z',
    cx: 75, cy: 179,
  },
  leftThigh: {
    labelKey: 'regions.leftThigh',
    path: 'M 92,148 L 115,148 L 118,210 L 94,210 Z',
    cx: 105, cy: 179,
  },
  rightKnee: {
    labelKey: 'regions.rightKnee',
    path: 'M 62,210 L 86,210 L 84,232 L 64,232 Z',
    cx: 74, cy: 221,
  },
  leftKnee: {
    labelKey: 'regions.leftKnee',
    path: 'M 94,210 L 118,210 L 116,232 L 96,232 Z',
    cx: 106, cy: 221,
  },
  rightLowerLeg: {
    labelKey: 'regions.rightLowerLeg',
    path: 'M 64,232 L 84,232 L 82,282 L 66,282 Z',
    cx: 74, cy: 257,
  },
  leftLowerLeg: {
    labelKey: 'regions.leftLowerLeg',
    path: 'M 96,232 L 116,232 L 114,282 L 98,282 Z',
    cx: 106, cy: 257,
  },
  rightFoot: {
    labelKey: 'regions.rightFoot',
    path: 'M 62,282 L 86,282 L 86,298 L 60,298 Z',
    cx: 73, cy: 290,
  },
  leftFoot: {
    labelKey: 'regions.leftFoot',
    path: 'M 94,282 L 118,282 L 120,298 L 94,298 Z',
    cx: 107, cy: 290,
  },
};

const POSTERIOR_REGIONS: Record<string, RegionDef> = {
  scalp: {
    labelKey: 'regions.scalp',
    path: 'M 76,6 L 104,6 L 106,20 L 74,20 Z',
    cx: 90, cy: 13,
  },
  headBack: {
    labelKey: 'regions.headBack',
    path: 'M 76,20 L 104,20 L 102,44 L 78,44 Z',
    cx: 90, cy: 32,
  },
  neckBack: {
    labelKey: 'regions.neckBack',
    path: 'M 80,44 L 100,44 L 100,62 L 80,62 Z',
    cx: 90, cy: 53,
  },
  upperBack: {
    labelKey: 'regions.upperBack',
    path: 'M 62,65 L 118,65 L 118,105 L 62,105 Z',
    cx: 90, cy: 85,
  },
  lowerBack: {
    labelKey: 'regions.lowerBack',
    path: 'M 64,105 L 116,105 L 114,145 L 66,145 Z',
    cx: 90, cy: 125,
  },
  rightShoulderBack: {
    labelKey: 'regions.rightShoulder',
    path: 'M 44,62 L 62,65 L 62,80 L 42,76 Z',
    cx: 53, cy: 71,
  },
  leftShoulderBack: {
    labelKey: 'regions.leftShoulder',
    path: 'M 118,65 L 136,62 L 138,76 L 118,80 Z',
    cx: 128, cy: 71,
  },
  rightUpperArmBack: {
    labelKey: 'regions.rightUpperArm',
    path: 'M 38,76 L 56,80 L 50,115 L 34,110 Z',
    cx: 44, cy: 95,
  },
  leftUpperArmBack: {
    labelKey: 'regions.leftUpperArm',
    path: 'M 124,80 L 142,76 L 146,110 L 130,115 Z',
    cx: 136, cy: 95,
  },
  rightForearmBack: {
    labelKey: 'regions.rightForearm',
    path: 'M 30,110 L 48,115 L 40,160 L 24,155 Z',
    cx: 36, cy: 135,
  },
  leftForearmBack: {
    labelKey: 'regions.leftForearm',
    path: 'M 132,115 L 150,110 L 156,155 L 140,160 Z',
    cx: 144, cy: 135,
  },
  rightHandBack: {
    labelKey: 'regions.rightHand',
    path: 'M 20,155 L 38,160 L 34,182 L 16,178 Z',
    cx: 27, cy: 168,
  },
  leftHandBack: {
    labelKey: 'regions.leftHand',
    path: 'M 142,160 L 160,155 L 164,178 L 146,182 Z',
    cx: 153, cy: 168,
  },
  rightButtock: {
    labelKey: 'regions.rightButtock',
    path: 'M 66,145 L 90,145 L 90,170 L 66,170 Z',
    cx: 78, cy: 157,
  },
  leftButtock: {
    labelKey: 'regions.leftButtock',
    path: 'M 90,145 L 114,145 L 114,170 L 90,170 Z',
    cx: 102, cy: 157,
  },
  rightThighBack: {
    labelKey: 'regions.rightThigh',
    path: 'M 64,170 L 88,170 L 86,222 L 62,222 Z',
    cx: 75, cy: 196,
  },
  leftThighBack: {
    labelKey: 'regions.leftThigh',
    path: 'M 92,170 L 116,170 L 118,222 L 94,222 Z',
    cx: 105, cy: 196,
  },
  rightCalfBack: {
    labelKey: 'regions.rightLowerLeg',
    path: 'M 64,225 L 84,225 L 82,280 L 66,280 Z',
    cx: 74, cy: 252,
  },
  leftCalfBack: {
    labelKey: 'regions.leftLowerLeg',
    path: 'M 96,225 L 116,225 L 114,280 L 98,280 Z',
    cx: 106, cy: 252,
  },
  rightFootBack: {
    labelKey: 'regions.rightFoot',
    path: 'M 62,280 L 86,280 L 86,298 L 60,298 Z',
    cx: 73, cy: 289,
  },
  leftFootBack: {
    labelKey: 'regions.leftFoot',
    path: 'M 94,280 L 118,280 L 120,298 L 94,298 Z',
    cx: 107, cy: 289,
  },
};

const LEFT_SIDE_REGIONS: Record<string, RegionDef> = {
  headLeft: {
    labelKey: 'regions.headSide',
    path: 'M 78,6 L 108,6 L 110,44 L 82,44 Z',
    cx: 94, cy: 25,
  },
  earLeft: {
    labelKey: 'regions.leftEar',
    path: 'M 108,18 L 118,18 L 118,36 L 108,36 Z',
    cx: 113, cy: 27,
  },
  neckLeft: {
    labelKey: 'regions.neck',
    path: 'M 84,44 L 104,44 L 104,62 L 84,62 Z',
    cx: 94, cy: 53,
  },
  torsoLeft: {
    labelKey: 'regions.torsoSide',
    path: 'M 68,65 L 118,65 L 116,145 L 70,145 Z',
    cx: 93, cy: 105,
  },
  armOuterLeft: {
    labelKey: 'regions.leftUpperArm',
    path: 'M 118,65 L 142,62 L 148,125 L 122,130 Z',
    cx: 132, cy: 95,
  },
  forearmOuterLeft: {
    labelKey: 'regions.leftForearm',
    path: 'M 124,130 L 150,125 L 158,172 L 132,178 Z',
    cx: 140, cy: 150,
  },
  handLeft: {
    labelKey: 'regions.leftHand',
    path: 'M 134,178 L 162,172 L 166,196 L 138,198 Z',
    cx: 150, cy: 185,
  },
  hipLeft: {
    labelKey: 'regions.leftHip',
    path: 'M 70,145 L 116,145 L 112,170 L 72,170 Z',
    cx: 93, cy: 157,
  },
  thighLeft: {
    labelKey: 'regions.leftThigh',
    path: 'M 72,170 L 112,170 L 108,230 L 76,230 Z',
    cx: 92, cy: 200,
  },
  kneeLeft: {
    labelKey: 'regions.leftKnee',
    path: 'M 76,230 L 108,230 L 106,250 L 78,250 Z',
    cx: 92, cy: 240,
  },
  lowerLegLeft: {
    labelKey: 'regions.leftLowerLeg',
    path: 'M 78,250 L 106,250 L 104,288 L 80,288 Z',
    cx: 92, cy: 269,
  },
  footLeft: {
    labelKey: 'regions.leftFoot',
    path: 'M 76,288 L 108,288 L 108,298 L 74,298 Z',
    cx: 91, cy: 293,
  },
};

const RIGHT_SIDE_REGIONS: Record<string, RegionDef> = {
  headRight: {
    labelKey: 'regions.headSide',
    path: 'M 72,6 L 102,6 L 98,44 L 70,44 Z',
    cx: 86, cy: 25,
  },
  earRight: {
    labelKey: 'regions.rightEar',
    path: 'M 62,18 L 72,18 L 72,36 L 62,36 Z',
    cx: 67, cy: 27,
  },
  neckRight: {
    labelKey: 'regions.neck',
    path: 'M 76,44 L 96,44 L 96,62 L 76,62 Z',
    cx: 86, cy: 53,
  },
  torsoRight: {
    labelKey: 'regions.torsoSide',
    path: 'M 62,65 L 112,65 L 110,145 L 64,145 Z',
    cx: 87, cy: 105,
  },
  armOuterRight: {
    labelKey: 'regions.rightUpperArm',
    path: 'M 38,62 L 62,65 L 58,130 L 32,125 Z',
    cx: 48, cy: 95,
  },
  forearmOuterRight: {
    labelKey: 'regions.rightForearm',
    path: 'M 30,125 L 56,130 L 48,178 L 22,172 Z',
    cx: 40, cy: 150,
  },
  handRight: {
    labelKey: 'regions.rightHand',
    path: 'M 18,172 L 46,178 L 42,198 L 14,196 Z',
    cx: 30, cy: 185,
  },
  hipRight: {
    labelKey: 'regions.rightHip',
    path: 'M 64,145 L 110,145 L 108,170 L 68,170 Z',
    cx: 87, cy: 157,
  },
  thighRight: {
    labelKey: 'regions.rightThigh',
    path: 'M 68,170 L 108,170 L 104,230 L 72,230 Z',
    cx: 88, cy: 200,
  },
  kneeRight: {
    labelKey: 'regions.rightKnee',
    path: 'M 72,230 L 104,230 L 102,250 L 74,250 Z',
    cx: 88, cy: 240,
  },
  lowerLegRight: {
    labelKey: 'regions.rightLowerLeg',
    path: 'M 74,250 L 102,250 L 100,288 L 76,288 Z',
    cx: 88, cy: 269,
  },
  footRight: {
    labelKey: 'regions.rightFoot',
    path: 'M 72,288 L 104,288 L 106,298 L 70,298 Z',
    cx: 88, cy: 293,
  },
};

const VIEW_REGIONS: Record<string, Record<string, RegionDef>> = {
  anterior: ANTERIOR_REGIONS,
  posterior: POSTERIOR_REGIONS,
  left: LEFT_SIDE_REGIONS,
  right: RIGHT_SIDE_REGIONS,
};

// Body silhouette outlines per view
const BODY_OUTLINES: Record<string, string> = {
  anterior:
    'M 90,8 C 78,8 68,15 68,28 C 68,38 74,46 80,48 L 80,56 L 64,62 L 46,62 L 38,76 L 30,110 L 22,155 L 16,178 L 20,182 L 34,182 L 40,160 L 48,115 L 56,82 L 60,100 L 62,145 L 64,148 L 62,210 L 62,260 L 60,282 L 60,298 L 86,298 L 86,282 L 86,232 L 88,210 L 90,190 L 92,210 L 94,232 L 94,282 L 94,298 L 120,298 L 120,282 L 118,260 L 118,210 L 116,148 L 118,145 L 120,100 L 124,82 L 132,115 L 140,160 L 146,182 L 160,182 L 164,178 L 158,155 L 150,110 L 142,76 L 134,62 L 116,62 L 100,56 L 100,48 C 106,46 112,38 112,28 C 112,15 102,8 90,8 Z',
  posterior:
    'M 90,8 C 78,8 68,15 68,28 C 68,38 74,46 80,48 L 80,56 L 64,62 L 44,62 L 36,76 L 28,110 L 20,155 L 14,178 L 18,182 L 34,182 L 40,160 L 48,115 L 56,82 L 60,100 L 62,145 L 66,170 L 62,222 L 62,260 L 60,280 L 60,298 L 86,298 L 86,280 L 86,232 L 88,210 L 90,190 L 92,210 L 94,232 L 94,280 L 94,298 L 120,298 L 120,280 L 118,260 L 118,222 L 114,170 L 118,145 L 120,100 L 124,82 L 132,115 L 140,160 L 146,182 L 162,182 L 166,178 L 160,155 L 152,110 L 144,76 L 136,62 L 116,62 L 100,56 L 100,48 C 106,46 112,38 112,28 C 112,15 102,8 90,8 Z',
  left:
    'M 94,8 C 82,8 74,15 74,28 C 74,38 80,46 86,48 L 86,56 L 78,62 L 68,65 L 118,65 L 142,62 L 148,80 L 156,125 L 162,172 L 166,196 L 160,198 L 138,198 L 132,178 L 122,130 L 118,100 L 116,145 L 112,170 L 108,230 L 106,250 L 104,288 L 108,298 L 76,298 L 80,288 L 78,250 L 76,230 L 72,170 L 70,145 L 68,100 L 68,65 L 86,56 L 86,48 C 80,46 74,38 74,28 C 74,15 82,8 94,8 Z',
  right:
    'M 86,8 C 98,8 106,15 106,28 C 106,38 100,46 94,48 L 94,56 L 102,62 L 112,65 L 62,65 L 38,62 L 32,80 L 24,125 L 18,172 L 14,196 L 20,198 L 42,198 L 48,178 L 58,130 L 62,100 L 64,145 L 68,170 L 72,230 L 74,250 L 76,288 L 72,298 L 104,298 L 100,288 L 102,250 L 104,230 L 108,170 L 110,145 L 112,100 L 112,65 L 94,56 L 94,48 C 100,46 106,38 106,28 C 106,15 98,8 86,8 Z',
};

function getLesionColor(type: string): string {
  switch (type) {
    case 'macule':
    case 'patch':
      return '#8B5CF6'; // purple
    case 'papule':
    case 'nodule':
    case 'plaque':
      return '#EF4444'; // red
    case 'vesicle':
    case 'bulla':
      return '#3B82F6'; // blue
    case 'pustule':
      return '#F59E0B'; // amber
    case 'wheal':
      return '#EC4899'; // pink
    case 'ulcer':
    case 'erosion':
      return '#DC2626'; // dark red
    case 'cyst':
      return '#6366F1'; // indigo
    default:
      return '#EF4444';
  }
}

export function LesionBodyMap({
  lesions,
  onLesionSelect,
  onAddLesion,
  readOnly = false,
  selectedLesionId,
}: LesionBodyMapProps) {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<'anterior' | 'posterior' | 'left' | 'right'>('anterior');
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const regions = VIEW_REGIONS[activeView];

  const getRegionLabel = useCallback(
    (regionKey: string): string => {
      const region = regions[regionKey];
      if (!region) return regionKey;
      return t(`specialties.dermatology.${region.labelKey}`);
    },
    [regions, t],
  );

  const handleRegionClick = useCallback(
    (regionKey: string) => {
      if (readOnly) return;
      const label = getRegionLabel(regionKey);
      onAddLesion(label, activeView);
    },
    [readOnly, getRegionLabel, onAddLesion, activeView],
  );

  // Group lesions by view for marker display
  const viewLesions = useMemo(
    () => lesions.filter((l) => l.view === activeView),
    [lesions, activeView],
  );

  // Find which region key a lesion belongs to (match by region label)
  const getLesionRegionDef = useCallback(
    (lesion: LesionRecord): RegionDef | null => {
      for (const [, def] of Object.entries(regions)) {
        const label = t(`specialties.dermatology.${def.labelKey}`);
        if (label === lesion.region) return def;
      }
      return null;
    },
    [regions, t],
  );

  // Count lesions per region for highlighting
  const regionLesionCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [key, def] of Object.entries(regions)) {
      const label = t(`specialties.dermatology.${def.labelKey}`);
      counts[key] = viewLesions.filter((l) => l.region === label).length;
    }
    return counts;
  }, [regions, viewLesions, t]);

  const viewLabels: Record<string, string> = {
    anterior: t('specialties.dermatology.views.anterior'),
    posterior: t('specialties.dermatology.views.posterior'),
    left: t('specialties.dermatology.views.left'),
    right: t('specialties.dermatology.views.right'),
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            {t('specialties.dermatology.bodyMap.title')}
          </CardTitle>
          <Badge variant="outline">
            {viewLesions.length} {t('specialties.dermatology.bodyMap.lesionsInView')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="anterior">{viewLabels.anterior}</TabsTrigger>
            <TabsTrigger value="posterior">{viewLabels.posterior}</TabsTrigger>
            <TabsTrigger value="left">{viewLabels.left}</TabsTrigger>
            <TabsTrigger value="right">{viewLabels.right}</TabsTrigger>
          </TabsList>

          {(['anterior', 'posterior', 'left', 'right'] as const).map((view) => (
            <TabsContent key={view} value={view} className="mt-3">
              <div className="flex justify-center">
                <svg
                  viewBox="0 0 180 305"
                  className="w-56 h-auto"
                  style={{ maxHeight: 380 }}
                >
                  {/* Body outline */}
                  <path
                    d={BODY_OUTLINES[view]}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    className="text-muted-foreground/30"
                  />

                  {/* Clickable region overlays */}
                  {Object.entries(VIEW_REGIONS[view]).map(([key, region]) => {
                    const count = regionLesionCount[key] || 0;
                    const isHovered = hoveredRegion === key;

                    return (
                      <path
                        key={key}
                        d={region.path}
                        fill={
                          count > 0
                            ? 'hsl(var(--destructive) / 0.15)'
                            : isHovered && !readOnly
                              ? 'hsl(var(--primary) / 0.12)'
                              : 'transparent'
                        }
                        stroke={
                          count > 0
                            ? 'hsl(var(--destructive) / 0.4)'
                            : isHovered && !readOnly
                              ? 'hsl(var(--primary) / 0.4)'
                              : 'transparent'
                        }
                        strokeWidth="0.8"
                        className={cn(
                          'transition-all duration-150',
                          !readOnly && 'cursor-pointer',
                        )}
                        onClick={() => handleRegionClick(key)}
                        onMouseEnter={() => setHoveredRegion(key)}
                        onMouseLeave={() => setHoveredRegion(null)}
                      />
                    );
                  })}

                  {/* Lesion markers */}
                  {view === activeView &&
                    viewLesions.map((lesion, index) => {
                      const regionDef = getLesionRegionDef(lesion);
                      if (!regionDef) return null;

                      const isSelected = lesion.id === selectedLesionId;
                      const markerColor = getLesionColor(lesion.type);

                      return (
                        <g
                          key={lesion.id}
                          className={cn('cursor-pointer')}
                          onClick={(e) => {
                            e.stopPropagation();
                            onLesionSelect(lesion);
                          }}
                        >
                          {isSelected && (
                            <circle
                              cx={regionDef.cx}
                              cy={regionDef.cy}
                              r="11"
                              fill="none"
                              stroke="hsl(var(--primary))"
                              strokeWidth="2"
                              className="animate-pulse"
                            />
                          )}
                          <circle
                            cx={regionDef.cx}
                            cy={regionDef.cy}
                            r="7"
                            fill={markerColor}
                            stroke="white"
                            strokeWidth="1.5"
                            className="opacity-90"
                          />
                          <text
                            x={regionDef.cx}
                            y={regionDef.cy + 0.5}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="white"
                            fontSize="7"
                            fontWeight="bold"
                          >
                            {index + 1}
                          </text>
                        </g>
                      );
                    })}

                  {/* Hovered region label */}
                  {hoveredRegion && regions[hoveredRegion] && (
                    <text
                      x="90"
                      y="302"
                      textAnchor="middle"
                      fill="currentColor"
                      fontSize="8"
                      className="text-foreground"
                    >
                      {getRegionLabel(hoveredRegion)}
                    </text>
                  )}
                </svg>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Lesion summary for current view */}
        {viewLesions.length > 0 && (
          <div className="space-y-1.5 pt-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('specialties.dermatology.bodyMap.lesionList')}
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {viewLesions.map((lesion, idx) => (
                <button
                  key={lesion.id}
                  type="button"
                  onClick={() => onLesionSelect(lesion)}
                  className={cn(
                    'flex items-center gap-2 w-full rounded-md border px-2.5 py-1.5 text-sm text-left transition-colors',
                    lesion.id === selectedLesionId
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50',
                  )}
                >
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: getLesionColor(lesion.type) }}
                  >
                    {idx + 1}
                  </span>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {lesion.region}
                  </Badge>
                  <span className="text-xs text-muted-foreground truncate">
                    {lesion.type
                      ? t(`specialties.dermatology.morphologyTypes.${lesion.type}`)
                      : t('specialties.dermatology.bodyMap.unclassified')}
                  </span>
                  {lesion.biopsyOrdered && (
                    <Badge variant="destructive" className="text-[10px] ml-auto shrink-0">
                      {t('specialties.dermatology.biopsy')}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {viewLesions.length === 0 && !readOnly && (
          <p className="text-center text-sm text-muted-foreground py-2">
            {t('specialties.dermatology.bodyMap.clickToAdd')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
