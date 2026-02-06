import { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';
import { usePatientPrescriptions } from '@/api/prescriptions';
import type { Prescription, PrescriptionStatus } from '@/types';

interface PrescriptionHistoryProps {
  patientId: string;
}

const statusStyles: Record<PrescriptionStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export function PrescriptionHistory({ patientId }: PrescriptionHistoryProps) {
  const { data, isLoading } = usePatientPrescriptions(patientId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const prescriptions: Prescription[] = data?.data ?? data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No previous prescriptions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4" />
        Recent Prescriptions
      </h4>
      {prescriptions.map((rx) => {
        const isExpanded = expandedId === rx.id;
        const medicationNames = rx.items?.map((item) => item.medicationName).join(', ') ?? '';

        return (
          <div key={rx.id} className="rounded-lg border bg-card overflow-hidden">
            <button
              type="button"
              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : rx.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium">{formatDate(rx.createdAt)}</span>
                  <Badge className={cn('text-xs', statusStyles[rx.status])}>
                    {rx.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {rx.doctor ? `Dr. ${rx.doctor.firstName} ${rx.doctor.lastName}` : 'Unknown Doctor'}
                  {medicationNames && ` - ${medicationNames}`}
                </p>
              </div>
            </button>

            {isExpanded && rx.items && rx.items.length > 0 && (
              <div className="px-4 pb-3 border-t bg-muted/20">
                <div className="pt-3 space-y-2">
                  {rx.items.map((item, idx) => (
                    <div key={item.id ?? idx} className="text-sm pl-6">
                      <p className="font-medium">{item.medicationName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.dosage} &middot; {item.frequency} &middot; {item.duration} &middot; {item.route}
                      </p>
                      {item.instructions && (
                        <p className="text-xs text-muted-foreground italic mt-0.5">
                          {item.instructions}
                        </p>
                      )}
                    </div>
                  ))}
                  {rx.notes && (
                    <p className="text-xs text-muted-foreground pl-6 pt-1 border-t mt-2">
                      Notes: {rx.notes}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
