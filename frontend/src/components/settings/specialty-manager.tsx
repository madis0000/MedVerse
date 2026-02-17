import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import {
  Plus,
  Pencil,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Specialty, SpecialtyField } from '@/types';

interface NewCustomField {
  fieldName: string;
  fieldType: string;
  isRequired: boolean;
}

const FIELD_TYPES = [
  { value: 'TEXT', labelKey: 'settings.specialties.fieldTypes.text' },
  { value: 'NUMBER', labelKey: 'settings.specialties.fieldTypes.number' },
  { value: 'DATE', labelKey: 'settings.specialties.fieldTypes.date' },
  { value: 'SELECT', labelKey: 'settings.specialties.fieldTypes.select' },
  { value: 'TEXTAREA', labelKey: 'settings.specialties.fieldTypes.textarea' },
  { value: 'BOOLEAN', labelKey: 'settings.specialties.fieldTypes.boolean' },
];

function useSpecialties() {
  return useQuery({
    queryKey: ['specialties'],
    queryFn: async () => {
      const { data } = await apiClient.get('/specialties');
      return data;
    },
  });
}

function useCreateSpecialty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/specialties', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialties'] });
    },
  });
}

function useUpdateSpecialty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { data } = await apiClient.patch(`/specialties/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialties'] });
    },
  });
}

function useAddCustomField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ specialtyId, ...payload }: any) => {
      const { data } = await apiClient.post(`/specialties/${specialtyId}/fields`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialties'] });
    },
  });
}

function useRemoveCustomField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ specialtyId, fieldId }: { specialtyId: string; fieldId: string }) => {
      const { data } = await apiClient.delete(`/specialties/${specialtyId}/fields/${fieldId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialties'] });
    },
  });
}

export function SpecialtyManager() {
  const { t } = useTranslation();
  const { data, isLoading } = useSpecialties();
  const createSpecialty = useCreateSpecialty();
  const updateSpecialty = useUpdateSpecialty();
  const addCustomField = useAddCustomField();
  const removeCustomField = useRemoveCustomField();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
  const [specialtyForm, setSpecialtyForm] = useState({ name: '', description: '' });
  const [newField, setNewField] = useState<NewCustomField>({
    fieldName: '',
    fieldType: 'TEXT',
    isRequired: false,
  });

  const specialties: Specialty[] = data?.data || [];

  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleOpenAddDialog = () => {
    setSpecialtyForm({ name: '', description: '' });
    setEditingSpecialty(null);
    setShowAddDialog(true);
  };

  const handleOpenEditDialog = (specialty: Specialty) => {
    setSpecialtyForm({ name: specialty.name, description: specialty.description || '' });
    setEditingSpecialty(specialty);
    setShowAddDialog(true);
  };

  const handleSaveSpecialty = async () => {
    if (!specialtyForm.name.trim()) {
      toast.error(t('settings.specialties.nameRequired'));
      return;
    }

    try {
      if (editingSpecialty) {
        await updateSpecialty.mutateAsync({ id: editingSpecialty.id, ...specialtyForm });
        toast.success(t('settings.specialties.updated'));
      } else {
        await createSpecialty.mutateAsync(specialtyForm);
        toast.success(t('settings.specialties.created'));
      }
      setShowAddDialog(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('settings.specialties.saveFailed'));
    }
  };

  const handleToggleActive = async (specialty: Specialty) => {
    try {
      await updateSpecialty.mutateAsync({ id: specialty.id, isActive: !specialty.isActive });
      toast.success(
        t('settings.specialties.toggledActive', {
          name: specialty.name,
          status: specialty.isActive ? t('settings.specialties.deactivated') : t('settings.specialties.activated'),
        }),
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('settings.specialties.updateFailed'));
    }
  };

  const handleAddField = async (specialtyId: string) => {
    if (!newField.fieldName.trim()) {
      toast.error(t('settings.specialties.fieldNameRequired'));
      return;
    }

    try {
      await addCustomField.mutateAsync({
        specialtyId,
        ...newField,
        sortOrder: 0,
      });
      setNewField({ fieldName: '', fieldType: 'TEXT', isRequired: false });
      toast.success(t('settings.specialties.fieldAdded'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('settings.specialties.fieldAddFailed'));
    }
  };

  const handleRemoveField = async (specialtyId: string, fieldId: string) => {
    try {
      await removeCustomField.mutateAsync({ specialtyId, fieldId });
      toast.success(t('settings.specialties.fieldRemoved'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('settings.specialties.fieldRemoveFailed'));
    }
  };

  if (isLoading) {
    return <TableSkeleton rows={4} cols={3} />;
  }

  if (specialties.length === 0) {
    return (
      <EmptyState
        icon={Stethoscope}
        title={t('settings.specialties.noSpecialties')}
        description={t('settings.specialties.noSpecialtiesDescription')}
        action={
          <Button onClick={handleOpenAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            {t('settings.specialties.addSpecialty')}
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleOpenAddDialog}>
          <Plus className="w-4 h-4 mr-2" />
          {t('settings.specialties.addSpecialty')}
        </Button>
      </div>

      <div className="space-y-3">
        {specialties.map((specialty) => (
          <Card key={specialty.id}>
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleExpand(specialty.id)}
                    className="p-1 rounded hover:bg-muted transition-colors"
                  >
                    {expandedId === specialty.id ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{specialty.name}</span>
                      <Badge variant={specialty.isActive ? 'default' : 'secondary'}>
                        {specialty.isActive ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </div>
                    {specialty.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {specialty.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEditDialog(specialty)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Switch
                    checked={specialty.isActive}
                    onCheckedChange={() => handleToggleActive(specialty)}
                  />
                </div>
              </div>

              {expandedId === specialty.id && (
                <div className="border-t px-4 py-4 bg-muted/30 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">{t('settings.specialties.customFields')}</h4>
                    {specialty.fields && specialty.fields.length > 0 ? (
                      <div className="space-y-2">
                        {specialty.fields.map((field: SpecialtyField) => (
                          <div
                            key={field.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-background"
                          >
                            <div className="flex items-center gap-3">
                              <GripVertical className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <span className="text-sm font-medium text-foreground">
                                  {field.fieldName}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant="outline" className="text-xs">
                                    {field.fieldType}
                                  </Badge>
                                  {field.isRequired && (
                                    <Badge variant="secondary" className="text-xs">
                                      {t('common.required')}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveField(specialty.id, field.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {t('settings.specialties.noCustomFields')}
                      </p>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-foreground mb-3">{t('settings.specialties.addCustomField')}</h4>
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <Label htmlFor={`field-name-${specialty.id}`}>{t('settings.specialties.fieldName')}</Label>
                        <Input
                          id={`field-name-${specialty.id}`}
                          value={newField.fieldName}
                          onChange={(e) =>
                            setNewField((prev) => ({ ...prev, fieldName: e.target.value }))
                          }
                          placeholder={t('settings.specialties.fieldNamePlaceholder')}
                          className="mt-1"
                        />
                      </div>
                      <div className="w-40">
                        <Label>{t('settings.specialties.fieldType')}</Label>
                        <Select
                          value={newField.fieldType}
                          onValueChange={(val) =>
                            setNewField((prev) => ({ ...prev, fieldType: val }))
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {t(type.labelKey)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={newField.isRequired}
                          onCheckedChange={(checked) =>
                            setNewField((prev) => ({ ...prev, isRequired: checked }))
                          }
                        />
                        <Label className="text-xs">{t('common.required')}</Label>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddField(specialty.id)}
                        disabled={addCustomField.isPending}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {t('common.add')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSpecialty ? t('settings.specialties.editSpecialty') : t('settings.specialties.addNewSpecialty')}
            </DialogTitle>
            <DialogDescription>
              {editingSpecialty
                ? t('settings.specialties.editDescription')
                : t('settings.specialties.addDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="specialty-name">{t('settings.specialties.specialtyName')}</Label>
              <Input
                id="specialty-name"
                value={specialtyForm.name}
                onChange={(e) => setSpecialtyForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={t('settings.specialties.specialtyNamePlaceholder')}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="specialty-description">{t('settings.specialties.description')}</Label>
              <Input
                id="specialty-description"
                value={specialtyForm.description}
                onChange={(e) =>
                  setSpecialtyForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder={t('settings.specialties.descriptionPlaceholder')}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSaveSpecialty}
              disabled={createSpecialty.isPending || updateSpecialty.isPending}
            >
              {createSpecialty.isPending || updateSpecialty.isPending
                ? t('common.saving')
                : editingSpecialty
                  ? t('common.update')
                  : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
