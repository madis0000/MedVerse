import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { User, Role, Specialty } from '@/types';

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
}

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
  specialtyId: string;
  phone: string;
}

const ROLE_KEYS: { value: Role; labelKey: string }[] = [
  { value: 'SUPER_ADMIN', labelKey: 'roles.SUPER_ADMIN' },
  { value: 'DOCTOR', labelKey: 'roles.DOCTOR' },
  { value: 'NURSE', labelKey: 'roles.NURSE' },
  { value: 'RECEPTIONIST', labelKey: 'roles.RECEPTIONIST' },
  { value: 'LAB_TECH', labelKey: 'roles.LAB_TECH' },
];

const DEFAULT_FORM: UserFormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'DOCTOR',
  specialtyId: '',
  phone: '',
};

function useSpecialties() {
  return useQuery({
    queryKey: ['specialties'],
    queryFn: async () => {
      const { data } = await apiClient.get('/specialties');
      return data;
    },
  });
}

function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/users', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { data } = await apiClient.patch(`/users/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function UserForm({ open, onOpenChange, user }: UserFormProps) {
  const { t } = useTranslation();
  const { data: specialtiesData } = useSpecialties();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const [form, setForm] = useState<UserFormData>(DEFAULT_FORM);

  const specialties: Specialty[] = specialtiesData?.data?.filter((s: Specialty) => s.isActive) || [];
  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: '',
        role: user.role,
        specialtyId: user.specialtyId || '',
        phone: user.phone || '',
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [user, open]);

  const handleChange = (field: keyof UserFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      toast.error(t('users.fillRequiredFields'));
      return;
    }

    if (!isEditing && !form.password) {
      toast.error(t('users.passwordRequired'));
      return;
    }

    try {
      const payload: any = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        role: form.role,
        phone: form.phone || undefined,
        specialtyId: form.role === 'DOCTOR' ? form.specialtyId || undefined : undefined,
      };

      if (isEditing) {
        await updateUser.mutateAsync({ id: user!.id, ...payload });
        toast.success(t('users.userUpdated'));
      } else {
        payload.password = form.password;
        await createUser.mutateAsync(payload);
        toast.success(t('users.userCreated'));
      }

      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('users.saveFailed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('users.editStaffMember') : t('users.addNewStaffMember')}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? t('users.editDescription')
              : t('users.addDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">{t('users.firstName')} *</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder={t('users.firstNamePlaceholder')}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">{t('users.lastName')} *</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder={t('users.lastNamePlaceholder')}
                className="mt-1.5"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">{t('users.email')} *</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="user@example.com"
              className="mt-1.5"
              required
            />
          </div>

          {!isEditing && (
            <div>
              <Label htmlFor="password">{t('users.password')} *</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder={t('users.enterPassword')}
                className="mt-1.5"
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="role">{t('users.role')} *</Label>
            <Select value={form.role} onValueChange={(val) => handleChange('role', val)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder={t('users.selectRole')} />
              </SelectTrigger>
              <SelectContent>
                {ROLE_KEYS.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {t(role.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.role === 'DOCTOR' && (
            <div>
              <Label htmlFor="specialty">{t('users.specialty')}</Label>
              <Select
                value={form.specialtyId}
                onValueChange={(val) => handleChange('specialtyId', val)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder={t('users.selectSpecialty')} />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((specialty) => (
                    <SelectItem key={specialty.id} value={specialty.id}>
                      {specialty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="phone">{t('users.phone')}</Label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="(555) 123-4567"
              className="mt-1.5"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createUser.isPending || updateUser.isPending}>
              {createUser.isPending || updateUser.isPending
                ? t('common.saving')
                : isEditing
                  ? t('common.update')
                  : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
