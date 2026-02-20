import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/loading-skeleton';
import { Plus, Trash2, Tags } from 'lucide-react';
import {
  useExpenseCategories,
  useCreateExpenseCategory,
  useDeleteExpenseCategory,
} from '@/api/finance';

export function ExpenseCategoryManager() {
  const { t } = useTranslation();
  const { data: categories, isLoading } = useExpenseCategories();
  const createCategory = useCreateExpenseCategory();
  const deleteCategory = useDeleteExpenseCategory();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [categoryName, setCategoryName] = useState('');

  const handleAdd = async () => {
    if (!categoryName.trim()) {
      toast.error(t('settings.expenseCategories.nameRequired'));
      return;
    }
    try {
      await createCategory.mutateAsync({ name: categoryName.trim() });
      toast.success(t('settings.expenseCategories.created'));
      setCategoryName('');
      setShowAddDialog(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('settings.expenseCategories.createFailed'));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteCategory.mutateAsync(id);
      toast.success(t('settings.expenseCategories.deleted', { name }));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('settings.expenseCategories.deleteFailed'));
    }
  };

  if (isLoading) {
    return <TableSkeleton rows={4} cols={2} />;
  }

  const list: any[] = categories || [];

  if (list.length === 0) {
    return (
      <EmptyState
        icon={Tags}
        title={t('settings.expenseCategories.noCategories')}
        description={t('settings.expenseCategories.noCategoriesDesc')}
        action={
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t('settings.expenseCategories.addCategory')}
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('settings.expenseCategories.addCategory')}
        </Button>
      </div>

      <div className="space-y-3">
        {list.map((category: any) => {
          const expenseCount = category._count?.expenses || 0;
          const recurringCount = category._count?.recurringExpenses || 0;
          const totalUsage = expenseCount + recurringCount;
          const canDelete = totalUsage === 0;

          return (
            <Card key={category.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="font-medium text-foreground">{category.name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs">
                          {t('settings.expenseCategories.expenseCount', { count: expenseCount })}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(category.id, category.name)}
                    disabled={!canDelete || deleteCategory.isPending}
                    className="text-destructive hover:text-destructive disabled:opacity-40"
                    title={canDelete ? t('common.delete') : t('settings.expenseCategories.cannotDelete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.expenseCategories.addCategory')}</DialogTitle>
            <DialogDescription>{t('settings.expenseCategories.addDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="category-name">{t('settings.expenseCategories.categoryName')}</Label>
              <Input
                id="category-name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder={t('settings.expenseCategories.categoryNamePlaceholder')}
                className="mt-1.5"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAdd} disabled={createCategory.isPending}>
              {createCategory.isPending ? t('common.saving') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
