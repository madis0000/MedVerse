import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Baby, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';

// ===== Types =====

type MilestoneStatus = 'achieved' | 'emerging' | 'not_yet' | 'concern';

interface MilestoneItem {
  id: string;
  category: 'gross_motor' | 'fine_motor' | 'language' | 'social_emotional' | 'cognitive';
  textKey: string;
}

interface AgeGroupDef {
  id: string;
  labelKey: string;
  minMonths: number;
  maxMonths: number;
  milestones: MilestoneItem[];
}

interface MilestoneRecord {
  milestoneId: string;
  status: MilestoneStatus;
}

// ===== Milestone Data =====

const MILESTONE_CATEGORIES = [
  'gross_motor',
  'fine_motor',
  'language',
  'social_emotional',
  'cognitive',
] as const;

const AGE_GROUPS: AgeGroupDef[] = [
  {
    id: '0-3',
    labelKey: 'specialties.pediatrics.milestones.ageGroups.0to3',
    minMonths: 0,
    maxMonths: 3,
    milestones: [
      { id: '0-3-gm1', category: 'gross_motor', textKey: 'specialties.pediatrics.milestones.items.liftsHead' },
      { id: '0-3-gm2', category: 'gross_motor', textKey: 'specialties.pediatrics.milestones.items.pushesUpOnArms' },
      { id: '0-3-fm1', category: 'fine_motor', textKey: 'specialties.pediatrics.milestones.items.graspReflex' },
      { id: '0-3-fm2', category: 'fine_motor', textKey: 'specialties.pediatrics.milestones.items.bringsHandsToMouth' },
      { id: '0-3-l1', category: 'language', textKey: 'specialties.pediatrics.milestones.items.coosGurgles' },
      { id: '0-3-l2', category: 'language', textKey: 'specialties.pediatrics.milestones.items.turnsToSound' },
      { id: '0-3-se1', category: 'social_emotional', textKey: 'specialties.pediatrics.milestones.items.socialSmile' },
      { id: '0-3-se2', category: 'social_emotional', textKey: 'specialties.pediatrics.milestones.items.eyeContact' },
      { id: '0-3-c1', category: 'cognitive', textKey: 'specialties.pediatrics.milestones.items.followsMovingObject' },
      { id: '0-3-c2', category: 'cognitive', textKey: 'specialties.pediatrics.milestones.items.recognizesCaregiver' },
    ],
  },
  {
    id: '3-6',
    labelKey: 'specialties.pediatrics.milestones.ageGroups.3to6',
    minMonths: 3,
    maxMonths: 6,
    milestones: [
      { id: '3-6-gm1', category: 'gross_motor', textKey: 'specialties.pediatrics.milestones.items.rollsOver' },
      { id: '3-6-gm2', category: 'gross_motor', textKey: 'specialties.pediatrics.milestones.items.sitsWithSupport' },
      { id: '3-6-fm1', category: 'fine_motor', textKey: 'specialties.pediatrics.milestones.items.reachesForObjects' },
      { id: '3-6-fm2', category: 'fine_motor', textKey: 'specialties.pediatrics.milestones.items.holdsRattle' },
      { id: '3-6-l1', category: 'language', textKey: 'specialties.pediatrics.milestones.items.laughsAloud' },
      { id: '3-6-l2', category: 'language', textKey: 'specialties.pediatrics.milestones.items.vowelSounds' },
      { id: '3-6-se1', category: 'social_emotional', textKey: 'specialties.pediatrics.milestones.items.smilesAtSelf' },
      { id: '3-6-se2', category: 'social_emotional', textKey: 'specialties.pediatrics.milestones.items.enjoysPlay' },
      { id: '3-6-c1', category: 'cognitive', textKey: 'specialties.pediatrics.milestones.items.exploresHandsFeet' },
      { id: '3-6-c2', category: 'cognitive', textKey: 'specialties.pediatrics.milestones.items.mouths objects' },
    ],
  },
  {
    id: '6-9',
    labelKey: 'specialties.pediatrics.milestones.ageGroups.6to9',
    minMonths: 6,
    maxMonths: 9,
    milestones: [
      { id: '6-9-gm1', category: 'gross_motor', textKey: 'specialties.pediatrics.milestones.items.sitsWithoutSupport' },
      { id: '6-9-gm2', category: 'gross_motor', textKey: 'specialties.pediatrics.milestones.items.pullsToStand' },
      { id: '6-9-gm3', category: 'gross_motor', textKey: 'specialties.pediatrics.milestones.items.crawls' },
      { id: '6-9-fm1', category: 'fine_motor', textKey: 'specialties.pediatrics.milestones.items.transfersObjects' },
      { id: '6-9-fm2', category: 'fine_motor', textKey: 'specialties.pediatrics.milestones.items.pincerGraspDeveloping' },
      { id: '6-9-fm3', category: 'fine_motor', textKey: 'specialties.pediatrics.milestones.items.bangsObjectsTogether' },
      { id: '6-9-l1', category: 'language', textKey: 'specialties.pediatrics.milestones.items.babbles' },
      { id: '6-9-l2', category: 'language', textKey: 'specialties.pediatrics.milestones.items.respondsToName' },
      { id: '6-9-l3', category: 'language', textKey: 'specialties.pediatrics.milestones.items.understandsNo' },
      { id: '6-9-se1', category: 'social_emotional', textKey: 'specialties.pediatrics.milestones.items.strangerAnxiety' },
      { id: '6-9-se2', category: 'social_emotional', textKey: 'specialties.pediatrics.milestones.items.looksForDropped' },
      { id: '6-9-se3', category: 'social_emotional', textKey: 'specialties.pediatrics.milestones.items.playsPeekaboo' },
      { id: '6-9-c1', category: 'cognitive', textKey: 'specialties.pediatrics.milestones.items.objectPermanence' },
      { id: '6-9-c2', category: 'cognitive', textKey: 'specialties.pediatrics.milestones.items.exploresCauseEffect' },
    ],
  },
  {
    id: '9-12',
    labelKey: 'specialties.pediatrics.milestones.ageGroups.9to12',
    minMonths: 9,
    maxMonths: 12,
    milestones: [
      { id: '9-12-gm1', category: 'gross_motor', textKey: 'specialties.pediatrics.milestones.items.cruisesFurniture' },
      { id: '9-12-gm2', category: 'gross_motor', textKey: 'specialties.pediatrics.milestones.items.standsAlone' },
      { id: '9-12-fm1', category: 'fine_motor', textKey: 'specialties.pediatrics.milestones.items.pincerGrasp' },
      { id: '9-12-fm2', category: 'fine_motor', textKey: 'specialties.pediatrics.milestones.items.pointsAtObjects' },
      { id: '9-12-l1', category: 'language', textKey: 'specialties.pediatrics.milestones.items.saysMamaDada' },
      { id: '9-12-l2', category: 'language', textKey: 'specialties.pediatrics.milestones.items.usesGestures' },
      { id: '9-12-se1', category: 'social_emotional', textKey: 'specialties.pediatrics.milestones.items.separationAnxiety' },
      { id: '9-12-se2', category: 'social_emotional', textKey: 'specialties.pediatrics.milestones.items.imitatesActions' },
      { id: '9-12-c1', category: 'cognitive', textKey: 'specialties.pediatrics.milestones.items.findsHiddenObjects' },
      { id: '9-12-c2', category: 'cognitive', textKey: 'specialties.pediatrics.milestones.items.exploresContainers' },
    ],
  },
  {
    id: '12-18',
    labelKey: 'specialties.pediatrics.milestones.ageGroups.12to18',
    minMonths: 12,
    maxMonths: 18,
    milestones: [
      { id: '12-18-gm1', category: 'gross_motor', textKey: 'specialties.pediatrics.milestones.items.walksIndependently' },
      { id: '12-18-gm2', category: 'gross_motor', textKey: 'specialties.pediatrics.milestones.items.climbsStairs' },
      { id: '12-18-fm1', category: 'fine_motor', textKey: 'specialties.pediatrics.milestones.items.stacksTwoBlocks' },
      { id: '12-18-fm2', category: 'fine_motor', textKey: 'specialties.pediatrics.milestones.items.scribbles' },
      { id: '12-18-l1', category: 'language', textKey: 'specialties.pediatrics.milestones.items.saysThreeWords' },
      { id: '12-18-l2', category: 'language', textKey: 'specialties.pediatrics.milestones.items.followsSimpleCommands' },
      { id: '12-18-se1', category: 'social_emotional', textKey: 'specialties.pediatrics.milestones.items.showsAffection' },
      { id: '12-18-se2', category: 'social_emotional', textKey: 'specialties.pediatrics.milestones.items.parallelPlay' },
      { id: '12-18-c1', category: 'cognitive', textKey: 'specialties.pediatrics.milestones.items.usesObjectsFunctionally' },
      { id: '12-18-c2', category: 'cognitive', textKey: 'specialties.pediatrics.milestones.items.pointsToBodyParts' },
    ],
  },
  {
    id: '18-24',
    labelKey: 'specialties.pediatrics.milestones.ageGroups.18to24',
    minMonths: 18,
    maxMonths: 24,
    milestones: [
      { id: '18-24-gm1', category: 'gross_motor', textKey: 'specialties.pediatrics.milestones.items.runs' },
      { id: '18-24-gm2', category: 'gross_motor', textKey: 'specialties.pediatrics.milestones.items.kicksBall' },
      { id: '18-24-fm1', category: 'fine_motor', textKey: 'specialties.pediatrics.milestones.items.stacksSixBlocks' },
      { id: '18-24-fm2', category: 'fine_motor', textKey: 'specialties.pediatrics.milestones.items.turnsPages' },
      { id: '18-24-l1', category: 'language', textKey: 'specialties.pediatrics.milestones.items.twoWordPhrases' },
      { id: '18-24-l2', category: 'language', textKey: 'specialties.pediatrics.milestones.items.fiftyWords' },
      { id: '18-24-se1', category: 'social_emotional', textKey: 'specialties.pediatrics.milestones.items.beginsPretendPlay' },
      { id: '18-24-se2', category: 'social_emotional', textKey: 'specialties.pediatrics.milestones.items.showsDefiance' },
      { id: '18-24-c1', category: 'cognitive', textKey: 'specialties.pediatrics.milestones.items.sortsShapes' },
      { id: '18-24-c2', category: 'cognitive', textKey: 'specialties.pediatrics.milestones.items.completesSimplePuzzle' },
    ],
  },
  {
    id: '2-3',
    labelKey: 'specialties.pediatrics.milestones.ageGroups.2to3',
    minMonths: 24,
    maxMonths: 36,
    milestones: [
      { id: '2-3-gm1', category: 'gross_motor', textKey: 'specialties.pediatrics.milestones.items.jumpsInPlace' },
      { id: '2-3-gm2', category: 'gross_motor', textKey: 'specialties.pediatrics.milestones.items.pedalsTricycle' },
      { id: '2-3-fm1', category: 'fine_motor', textKey: 'specialties.pediatrics.milestones.items.drawsCircle' },
      { id: '2-3-fm2', category: 'fine_motor', textKey: 'specialties.pediatrics.milestones.items.usesScissors' },
      { id: '2-3-l1', category: 'language', textKey: 'specialties.pediatrics.milestones.items.threeWordSentences' },
      { id: '2-3-l2', category: 'language', textKey: 'specialties.pediatrics.milestones.items.asksQuestions' },
      { id: '2-3-se1', category: 'social_emotional', textKey: 'specialties.pediatrics.milestones.items.takeTurns' },
      { id: '2-3-se2', category: 'social_emotional', textKey: 'specialties.pediatrics.milestones.items.expressesEmotions' },
      { id: '2-3-c1', category: 'cognitive', textKey: 'specialties.pediatrics.milestones.items.matchesColors' },
      { id: '2-3-c2', category: 'cognitive', textKey: 'specialties.pediatrics.milestones.items.understandsConcepts' },
    ],
  },
  {
    id: '3-4',
    labelKey: 'specialties.pediatrics.milestones.ageGroups.3to4',
    minMonths: 36,
    maxMonths: 48,
    milestones: [
      { id: '3-4-gm1', category: 'gross_motor', textKey: 'specialties.pediatrics.milestones.items.hopsOnOneFoot' },
      { id: '3-4-gm2', category: 'gross_motor', textKey: 'specialties.pediatrics.milestones.items.catchesBall' },
      { id: '3-4-fm1', category: 'fine_motor', textKey: 'specialties.pediatrics.milestones.items.drawsPerson' },
      { id: '3-4-fm2', category: 'fine_motor', textKey: 'specialties.pediatrics.milestones.items.usesForksSpoon' },
      { id: '3-4-l1', category: 'language', textKey: 'specialties.pediatrics.milestones.items.tellsStories' },
      { id: '3-4-l2', category: 'language', textKey: 'specialties.pediatrics.milestones.items.knowsFirstLastName' },
      { id: '3-4-se1', category: 'social_emotional', textKey: 'specialties.pediatrics.milestones.items.cooperativePlay' },
      { id: '3-4-se2', category: 'social_emotional', textKey: 'specialties.pediatrics.milestones.items.showsEmpathy' },
      { id: '3-4-c1', category: 'cognitive', textKey: 'specialties.pediatrics.milestones.items.countsToFive' },
      { id: '3-4-c2', category: 'cognitive', textKey: 'specialties.pediatrics.milestones.items.understandsTime' },
    ],
  },
  {
    id: '4-5',
    labelKey: 'specialties.pediatrics.milestones.ageGroups.4to5',
    minMonths: 48,
    maxMonths: 60,
    milestones: [
      { id: '4-5-gm1', category: 'gross_motor', textKey: 'specialties.pediatrics.milestones.items.skips' },
      { id: '4-5-gm2', category: 'gross_motor', textKey: 'specialties.pediatrics.milestones.items.balancesOneFoot' },
      { id: '4-5-fm1', category: 'fine_motor', textKey: 'specialties.pediatrics.milestones.items.writesLetters' },
      { id: '4-5-fm2', category: 'fine_motor', textKey: 'specialties.pediatrics.milestones.items.dressesIndependently' },
      { id: '4-5-l1', category: 'language', textKey: 'specialties.pediatrics.milestones.items.speaksInSentences' },
      { id: '4-5-l2', category: 'language', textKey: 'specialties.pediatrics.milestones.items.understandsRhymes' },
      { id: '4-5-se1', category: 'social_emotional', textKey: 'specialties.pediatrics.milestones.items.followsRules' },
      { id: '4-5-se2', category: 'social_emotional', textKey: 'specialties.pediatrics.milestones.items.expressesFeelingsWords' },
      { id: '4-5-c1', category: 'cognitive', textKey: 'specialties.pediatrics.milestones.items.countsToTen' },
      { id: '4-5-c2', category: 'cognitive', textKey: 'specialties.pediatrics.milestones.items.understandsOpposites' },
    ],
  },
];

// ===== Helpers =====

function getAgeInMonths(dob: string): number {
  const dobDate = new Date(dob);
  const now = new Date();
  const years = now.getFullYear() - dobDate.getFullYear();
  const months = now.getMonth() - dobDate.getMonth();
  const days = now.getDate() - dobDate.getDate();
  let total = years * 12 + months;
  if (days < 0) total -= 1;
  return Math.max(total, 0);
}

function getDefaultAgeGroup(dob: string): string {
  const ageMonths = getAgeInMonths(dob);
  for (const ag of AGE_GROUPS) {
    if (ageMonths >= ag.minMonths && ageMonths < ag.maxMonths) {
      return ag.id;
    }
  }
  if (ageMonths >= 60) return '4-5';
  return '0-3';
}

// ===== Component =====

interface DevelopmentalMilestonesProps {
  patientId: string;
  patientDob: string;
  consultationId: string;
  readOnly?: boolean;
}

export function DevelopmentalMilestones({
  patientId,
  patientDob,
  consultationId,
  readOnly,
}: DevelopmentalMilestonesProps) {
  const { t } = useTranslation();
  const [selectedGroup, setSelectedGroup] = useState(() => getDefaultAgeGroup(patientDob));
  const [milestoneRecords, setMilestoneRecords] = useState<MilestoneRecord[]>([]);
  const [saving, setSaving] = useState(false);

  const currentGroup = useMemo(
    () => AGE_GROUPS.find((g) => g.id === selectedGroup) ?? AGE_GROUPS[0],
    [selectedGroup],
  );

  // Load existing records
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await apiClient.get(`/consultations/${consultationId}`);
        const records = data.customFields?.pediatrics?.milestones;
        if (Array.isArray(records)) {
          setMilestoneRecords(records);
        }
      } catch {
        // silent
      }
    };
    if (consultationId) load();
  }, [consultationId]);

  const getStatus = useCallback(
    (milestoneId: string): MilestoneStatus => {
      const record = milestoneRecords.find((r) => r.milestoneId === milestoneId);
      return record?.status ?? 'not_yet';
    },
    [milestoneRecords],
  );

  const setStatus = useCallback(
    (milestoneId: string, status: MilestoneStatus) => {
      setMilestoneRecords((prev) => {
        const existing = prev.findIndex((r) => r.milestoneId === milestoneId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { milestoneId, status };
          return updated;
        }
        return [...prev, { milestoneId, status }];
      });
    },
    [],
  );

  const toggleAchieved = useCallback(
    (milestoneId: string) => {
      const current = getStatus(milestoneId);
      setStatus(milestoneId, current === 'achieved' ? 'not_yet' : 'achieved');
    },
    [getStatus, setStatus],
  );

  const cycleStatus = useCallback(
    (milestoneId: string) => {
      const current = getStatus(milestoneId);
      const order: MilestoneStatus[] = ['not_yet', 'emerging', 'achieved', 'concern'];
      const idx = order.indexOf(current);
      setStatus(milestoneId, order[(idx + 1) % order.length]);
    },
    [getStatus, setStatus],
  );

  // Summary
  const { achieved, total, delayFlag } = useMemo(() => {
    const items = currentGroup.milestones;
    const totalCount = items.length;
    const achievedCount = items.filter(
      (m) => getStatus(m.id) === 'achieved',
    ).length;
    return {
      achieved: achievedCount,
      total: totalCount,
      delayFlag: totalCount > 0 && achievedCount / totalCount < 0.5,
    };
  }, [currentGroup, getStatus]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const { data: consultation } = await apiClient.get(`/consultations/${consultationId}`);
      await apiClient.patch(`/consultations/${consultationId}`, {
        customFields: {
          ...consultation.customFields,
          pediatrics: {
            ...consultation.customFields?.pediatrics,
            milestones: milestoneRecords,
          },
        },
      });
      toast.success(t('specialties.pediatrics.milestones.saved'));
    } catch {
      toast.error(t('specialties.pediatrics.milestones.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [milestoneRecords, consultationId, t]);

  const getStatusBadge = (status: MilestoneStatus) => {
    switch (status) {
      case 'achieved':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer text-xs">
            {t('specialties.pediatrics.milestones.statusLabels.achieved')}
          </Badge>
        );
      case 'emerging':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 cursor-pointer text-xs">
            {t('specialties.pediatrics.milestones.statusLabels.emerging')}
          </Badge>
        );
      case 'concern':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200 cursor-pointer text-xs">
            {t('specialties.pediatrics.milestones.statusLabels.concern')}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="cursor-pointer text-xs">
            {t('specialties.pediatrics.milestones.statusLabels.notYet')}
          </Badge>
        );
    }
  };

  const categoryLabel = (cat: string) =>
    t(`specialties.pediatrics.milestones.categories.${cat}`);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Baby className="h-5 w-5" />
          {t('specialties.pediatrics.milestones.title')}
        </CardTitle>
        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AGE_GROUPS.map((ag) => (
              <SelectItem key={ag.id} value={ag.id}>
                {t(ag.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm">
              {t('specialties.pediatrics.milestones.summary', {
                achieved,
                total,
              })}
            </span>
          </div>
          {delayFlag && (
            <Badge className="bg-red-100 text-red-800">
              <AlertCircle className="h-3 w-3 mr-1" />
              {t('specialties.pediatrics.milestones.significantDelay')}
            </Badge>
          )}
        </div>

        <Separator className="mb-4" />

        {/* Milestones by category */}
        <div className="space-y-6">
          {MILESTONE_CATEGORIES.map((cat) => {
            const items = currentGroup.milestones.filter((m) => m.category === cat);
            if (items.length === 0) return null;

            return (
              <div key={cat}>
                <h4 className="text-sm font-semibold mb-2">{categoryLabel(cat)}</h4>
                <div className="space-y-2">
                  {items.map((milestone) => {
                    const status = getStatus(milestone.id);
                    return (
                      <div
                        key={milestone.id}
                        className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={status === 'achieved'}
                            onCheckedChange={() => {
                              if (!readOnly) toggleAchieved(milestone.id);
                            }}
                            disabled={readOnly}
                          />
                          <Label className="text-sm cursor-pointer">
                            {t(milestone.textKey)}
                          </Label>
                        </div>
                        {!readOnly ? (
                          <div onClick={() => cycleStatus(milestone.id)}>
                            {getStatusBadge(status)}
                          </div>
                        ) : (
                          getStatusBadge(status)
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {!readOnly && (
          <>
            <Separator className="my-4" />
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t('common.saving') : t('common.save')}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
