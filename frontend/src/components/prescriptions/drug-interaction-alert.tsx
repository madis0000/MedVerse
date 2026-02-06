import { AlertTriangle, XCircle, AlertOctagon, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrugInteraction {
  id?: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'CONTRAINDICATED';
  drug1Name: string;
  drug2Name: string;
  description: string;
}

interface DrugInteractionAlertProps {
  interactions: DrugInteraction[];
}

const severityConfig = {
  MILD: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    border: 'border-yellow-300 dark:border-yellow-700',
    text: 'text-yellow-800 dark:text-yellow-300',
    icon: Info,
    label: 'Mild',
  },
  MODERATE: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-300 dark:border-orange-700',
    text: 'text-orange-800 dark:text-orange-300',
    icon: AlertTriangle,
    label: 'Moderate',
  },
  SEVERE: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-300 dark:border-red-700',
    text: 'text-red-800 dark:text-red-300',
    icon: AlertOctagon,
    label: 'Severe',
  },
  CONTRAINDICATED: {
    bg: 'bg-red-100 dark:bg-red-950/50',
    border: 'border-red-500 dark:border-red-600',
    text: 'text-red-900 dark:text-red-200',
    icon: XCircle,
    label: 'Contraindicated',
  },
};

export function DrugInteractionAlert({ interactions }: DrugInteractionAlertProps) {
  if (!interactions || interactions.length === 0) {
    return null;
  }

  const sorted = [...interactions].sort((a, b) => {
    const order = ['CONTRAINDICATED', 'SEVERE', 'MODERATE', 'MILD'];
    return order.indexOf(a.severity) - order.indexOf(b.severity);
  });

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        Drug Interactions ({interactions.length})
      </h4>
      {sorted.map((interaction, index) => {
        const config = severityConfig[interaction.severity];
        const Icon = config.icon;

        return (
          <div
            key={interaction.id ?? index}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-3',
              config.bg,
              config.border,
            )}
          >
            <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', config.text)} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn('text-xs font-semibold uppercase', config.text)}>
                  {config.label}
                </span>
              </div>
              <p className={cn('text-sm font-medium', config.text)}>
                {interaction.drug1Name} + {interaction.drug2Name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {interaction.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
