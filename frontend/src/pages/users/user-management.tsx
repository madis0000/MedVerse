import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { DataTable } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserForm } from '@/components/users/user-form';
import { formatDateTime } from '@/lib/utils';
import { Plus, Users, Pencil, UserX, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import type { User, Role } from '@/types';

const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  DOCTOR: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  NURSE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  RECEPTIONIST: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  LAB_TECH: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
};

function useUsers(filters?: { role?: string }) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/users', { params: filters });
      return data;
    },
  });
}

function useToggleUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data } = await apiClient.patch(`/users/${id}`, { isActive });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function UserManagementPage() {
  const { t } = useTranslation();
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const filters = roleFilter !== 'ALL' ? { role: roleFilter } : undefined;
  const { data, isLoading } = useUsers(filters);
  const toggleStatus = useToggleUserStatus();

  const users: User[] = data?.data || [];

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await toggleStatus.mutateAsync({ id: user.id, isActive: !user.isActive });
      toast.success(
        `${user.firstName} ${user.lastName} ${user.isActive ? t('common.deactivated') : t('common.activated')} ${t('common.successfully')}`,
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('common.errorUpdatingStatus'));
    }
  };

  const columns: ColumnDef<User, any>[] = [
    {
      accessorKey: 'name',
      header: t('users.firstName') + ' / ' + t('users.lastName'),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
            {row.original.firstName?.[0]}
            {row.original.lastName?.[0]}
          </div>
          <div>
            <p className="font-medium text-foreground">
              {row.original.firstName} {row.original.lastName}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: t('users.email'),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      accessorKey: 'role',
      header: t('users.role'),
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            ROLE_COLORS[row.original.role] || ''
          }`}
        >
          {t(`roles.${row.original.role}`)}
        </span>
      ),
    },
    {
      accessorKey: 'specialty',
      header: t('users.specialty'),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.specialty?.name || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: t('users.status'),
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? t('users.active') : t('users.inactive')}
        </Badge>
      ),
    },
    {
      accessorKey: 'lastLogin',
      header: t('users.lastLogin'),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {row.original.lastLogin ? formatDateTime(row.original.lastLogin) : t('common.never')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row.original);
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStatus(row.original);
            }}
            className={row.original.isActive ? 'text-destructive hover:text-destructive' : 'text-green-600 hover:text-green-600'}
          >
            {row.original.isActive ? (
              <UserX className="w-4 h-4" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
          </Button>
        </div>
      ),
      enableSorting: false,
    },
  ];

  return (
    <PageWrapper
      title={t('users.title')}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/dashboard' },
        { label: t('nav.users') },
      ]}
      actions={
        <Button onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          {t('users.addUser')}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-48">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.filter')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('users.allRoles')}</SelectItem>
                <SelectItem value="SUPER_ADMIN">{t('roles.SUPER_ADMIN')}</SelectItem>
                <SelectItem value="DOCTOR">{t('roles.DOCTOR')}</SelectItem>
                <SelectItem value="NURSE">{t('roles.NURSE')}</SelectItem>
                <SelectItem value="RECEPTIONIST">{t('roles.RECEPTIONIST')}</SelectItem>
                <SelectItem value="LAB_TECH">{t('roles.LAB_TECH')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} cols={7} />
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title={t('users.noUsers')}
            description={
              roleFilter !== 'ALL'
                ? t('users.noUsersFilterDescription')
                : t('users.noUsersDescription')
            }
            action={
              <Button onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" />
                {t('users.addUser')}
              </Button>
            }
          />
        ) : (
          <DataTable columns={columns} data={users} />
        )}
      </div>

      <UserForm
        open={showForm}
        onOpenChange={setShowForm}
        user={editingUser}
      />
    </PageWrapper>
  );
}
