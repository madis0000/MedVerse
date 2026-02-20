import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Gauge, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import apiClient from '@/lib/api-client';

export interface IOPData {
  od: number | null;
  os: number | null;
  method: string;
  time: string;
  notes?: string;
}

interface IOPTrackerProps {
  patientId: string;
  consultationId: string;
  readOnly?: boolean;
  existingData?: IOPData;
}

interface IOPHistoryRecord {
  date: string;
  od: number | null;
  os: number | null;
}

const METHOD_OPTIONS = [
  'goldmann',
  'tonopen',
  'nonContact',
  'iCare',
] as const;

const DEFAULT_DATA: IOPData = {
  od: null,
  os: null,
  method: 'goldmann',
  time: '',
  notes: '',
};

function getIOPBadge(iop: number | null): { label: string; className: string } | null {
  if (iop === null) return null;
  if (iop > 30) return { label: 'HIGH', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
  if (iop > 21) return { label: 'BORDERLINE', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
  if (iop >= 10) return { label: 'NORMAL', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
  return { label: 'LOW', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' };
}

export function IOPTracker({
  patientId,
  consultationId,
  readOnly = false,
  existingData,
}: IOPTrackerProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<IOPData>(existingData || DEFAULT_DATA);
  const [history, setHistory] = useState<IOPHistoryRecord[]>([]);
  const [targetPressure, setTargetPressure] = useState<number>(15);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch IOP history from past consultations
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/consultations', {
        params: { patientId },
      });
      const consultations = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      const records: IOPHistoryRecord[] = [];
      for (const consult of consultations) {
        const iop = consult.customFields?.ophthalmology?.iop;
        if (iop && (iop.od !== null || iop.os !== null)) {
          records.push({
            date: formatDate(consult.date || consult.createdAt),
            od: iop.od ?? null,
            os: iop.os ?? null,
          });
        }
      }

      // Sort by date ascending
      records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setHistory(records);
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  }

  const autoSave = useCallback(
    (updatedData: IOPData) => {
      if (readOnly) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        try {
          await apiClient.patch(`/consultations/${consultationId}`, {
            customFields: {
              ophthalmology: {
                iop: updatedData,
              },
            },
          });
        } catch {
          toast.error(t('specialties.ophthalmology.saveFailed'));
        }
      }, 1500);
    },
    [consultationId, readOnly, t]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const updateData = useCallback(
    (updater: (prev: IOPData) => IOPData) => {
      setData((prev) => {
        const updated = updater(prev);
        autoSave(updated);
        return updated;
      });
    },
    [autoSave]
  );

  const odBadge = getIOPBadge(data.od);
  const osBadge = getIOPBadge(data.os);

  return (
    <div className="space-y-4">
      {/* Current Measurement Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="h-5 w-5 text-purple-500" />
            {t('specialties.ophthalmology.iop.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* IOP Measurement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* OD */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                {t('specialties.ophthalmology.od')} — {t('specialties.ophthalmology.rightEye')}
              </h4>
              <div className="rounded-lg border p-4 space-y-2">
                <Label>{t('specialties.ophthalmology.iop.pressure')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={80}
                    value={data.od ?? ''}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        od: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    disabled={readOnly}
                    placeholder="mmHg"
                    className="max-w-[120px]"
                  />
                  <span className="text-sm text-muted-foreground">mmHg</span>
                  {odBadge && (
                    <Badge className={odBadge.className}>
                      {data.od! > 21 && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {t(`specialties.ophthalmology.iop.${odBadge.label.toLowerCase()}`)}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('specialties.ophthalmology.iop.normalRange')}
                </p>
              </div>
            </div>

            {/* OS */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-green-700 dark:text-green-400">
                {t('specialties.ophthalmology.os')} — {t('specialties.ophthalmology.leftEye')}
              </h4>
              <div className="rounded-lg border p-4 space-y-2">
                <Label>{t('specialties.ophthalmology.iop.pressure')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={80}
                    value={data.os ?? ''}
                    onChange={(e) =>
                      updateData((prev) => ({
                        ...prev,
                        os: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    disabled={readOnly}
                    placeholder="mmHg"
                    className="max-w-[120px]"
                  />
                  <span className="text-sm text-muted-foreground">mmHg</span>
                  {osBadge && (
                    <Badge className={osBadge.className}>
                      {data.os! > 21 && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {t(`specialties.ophthalmology.iop.${osBadge.label.toLowerCase()}`)}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('specialties.ophthalmology.iop.normalRange')}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Method and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('specialties.ophthalmology.iop.method')}</Label>
              <Select
                value={data.method}
                onValueChange={(v) => updateData((prev) => ({ ...prev, method: v }))}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHOD_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {t(`specialties.ophthalmology.iop.methods.${m}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {t('specialties.ophthalmology.iop.time')}
              </Label>
              <Input
                type="time"
                value={data.time}
                onChange={(e) => updateData((prev) => ({ ...prev, time: e.target.value }))}
                disabled={readOnly}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{t('common.notes')}</Label>
            <Textarea
              value={data.notes || ''}
              onChange={(e) => updateData((prev) => ({ ...prev, notes: e.target.value }))}
              disabled={readOnly}
              placeholder={t('specialties.ophthalmology.iop.notesPlaceholder')}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* IOP History Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">
              {t('specialties.ophthalmology.iop.history')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label className="text-xs">{t('specialties.ophthalmology.iop.targetPressure')}</Label>
              <Input
                type="number"
                min={5}
                max={25}
                value={targetPressure}
                onChange={(e) => setTargetPressure(Number(e.target.value))}
                className="w-[70px] h-7 text-xs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
              {t('common.loading')}
            </div>
          ) : history.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis domain={[0, 50]} fontSize={11} label={{ value: 'mmHg', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {/* Normal range shaded area (10-21 mmHg) */}
                <ReferenceArea y1={10} y2={21} fill="#22c55e" fillOpacity={0.1} />
                {/* Normal range boundaries */}
                <ReferenceLine
                  y={21}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label={{ value: '21', position: 'right', fontSize: 10 }}
                />
                <ReferenceLine
                  y={10}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label={{ value: '10', position: 'right', fontSize: 10 }}
                />
                {/* Target pressure line */}
                <ReferenceLine
                  y={targetPressure}
                  stroke="#8b5cf6"
                  strokeDasharray="5 5"
                  label={{ value: `Target: ${targetPressure}`, position: 'left', fontSize: 10, fill: '#8b5cf6' }}
                />
                <Line
                  type="monotone"
                  dataKey="od"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name={`${t('specialties.ophthalmology.od')} (${t('specialties.ophthalmology.rightEye')})`}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="os"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name={`${t('specialties.ophthalmology.os')} (${t('specialties.ophthalmology.leftEye')})`}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
              {t('specialties.ophthalmology.iop.noHistory')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
