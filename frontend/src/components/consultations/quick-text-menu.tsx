import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquarePlus, Settings, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

interface QuickText {
  id: string;
  category: string;
  label: string;
  text: string;
}

interface QuickTextMenuProps {
  onInsert: (text: string) => void;
  disabled?: boolean;
}

export function QuickTextMenu({ onInsert, disabled }: QuickTextMenuProps) {
  const { t } = useTranslation();
  const [quickTexts, setQuickTexts] = useState<QuickText[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchQuickTexts = useCallback(async () => {
    if (quickTexts.length > 0) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get('/quick-texts');
      setQuickTexts(data);
    } catch {
      toast.error(t('consultations.quickText.loadError'));
    } finally {
      setLoading(false);
    }
  }, [quickTexts.length, t]);

  useEffect(() => {
    if (open && quickTexts.length === 0) {
      fetchQuickTexts();
    }
  }, [open, fetchQuickTexts, quickTexts.length]);

  const groupedTexts = quickTexts.reduce<Record<string, QuickText[]>>(
    (acc, qt) => {
      const cat = qt.category || t('consultations.quickText.general');
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(qt);
      return acc;
    },
    {},
  );

  const categories = Object.keys(groupedTexts).sort();

  function handleSelect(text: string) {
    onInsert(text);
    setOpen(false);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-1.5"
        >
          <MessageSquarePlus className="h-4 w-4" />
          {t('consultations.quickText')}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 max-h-80 overflow-y-auto">
        {loading && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            {t('consultations.quickText.loading')}
          </div>
        )}
        {!loading && categories.length === 0 && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            {t('consultations.quickText.noQuickTexts')}
          </div>
        )}
        {!loading &&
          categories.map((category, catIndex) => (
            <div key={category}>
              {catIndex > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel>{category}</DropdownMenuLabel>
              {groupedTexts[category].map((qt) => (
                <DropdownMenuItem
                  key={qt.id}
                  onClick={() => handleSelect(qt.text)}
                  className="flex flex-col items-start gap-0.5 cursor-pointer"
                >
                  <span className="font-medium text-sm">{qt.label}</span>
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {qt.text}
                  </span>
                </DropdownMenuItem>
              ))}
            </div>
          ))}
        {!loading && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                window.open('/settings?tab=quick-texts', '_blank');
              }}
              className="gap-2 text-muted-foreground cursor-pointer"
            >
              <Settings className="h-3.5 w-3.5" />
              {t('consultations.quickText.manage')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
