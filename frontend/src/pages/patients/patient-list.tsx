import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ColumnDef } from '@tanstack/react-table';
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Users,
} from 'lucide-react';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { DataTable } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePatients } from '@/api/patients';
import { formatDate } from '@/lib/utils';
import type { Patient, PatientStatus } from '@/types';

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  INACTIVE: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  REFERRED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  DISCHARGED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export function PatientListPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PatientStatus | 'ALL'>('ALL');

  const statusOptions: { label: string; value: PatientStatus | 'ALL' }[] = [
    { label: t('patients.allStatuses'), value: 'ALL' },
    { label: t('patients.status.NEW'), value: 'NEW' },
    { label: t('patients.status.ACTIVE'), value: 'ACTIVE' },
    { label: t('patients.status.INACTIVE'), value: 'INACTIVE' },
    { label: t('patients.status.REFERRED'), value: 'REFERRED' },
    { label: t('patients.status.DISCHARGED'), value: 'DISCHARGED' },
  ];

  const filters = useMemo(() => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (statusFilter !== 'ALL') params.status = statusFilter;
    return params;
  }, [search, statusFilter]);

  const { data, isLoading } = usePatients(filters);

  const patients: Patient[] = data?.data || [];

  const columns: ColumnDef<Patient, any>[] = useMemo(
    () => [
      {
        accessorKey: 'mrn',
        header: t('patients.mrn'),
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium">{row.original.mrn}</span>
        ),
      },
      {
        id: 'name',
        header: t('common.name'),
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">
              {row.original.firstName} {row.original.lastName}
            </p>
            {row.original.email && (
              <p className="text-xs text-muted-foreground">{row.original.email}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        header: t('common.phone'),
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.phone || '--'}</span>
        ),
      },
      {
        accessorKey: 'gender',
        header: t('patients.gender'),
        cell: ({ row }) => (
          <span className="capitalize text-muted-foreground">
            {row.original.gender?.toLowerCase() || '--'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('common.status'),
        cell: ({ row }) => (
          <Badge className={statusColors[row.original.status] || ''} variant="secondary">
            {t(`patients.status.${row.original.status}`, row.original.status)}
          </Badge>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: t('patients.lastVisit'),
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDate(row.original.updatedAt)}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/patients/${row.original.id}`)}>
                <Eye className="h-4 w-4 mr-2" />
                {t('patients.viewProfile')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/patients/${row.original.id}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                {t('patients.editPatient')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [navigate, t],
  );

  return (
    <PageWrapper
      title={t('patients.title')}
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/dashboard' },
        { label: t('patients.title') },
      ]}
      actions={
        <Button asChild>
          <Link to="/patients/new">
            <Plus className="h-4 w-4 mr-2" />
            {t('patients.addPatient')}
          </Link>
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('patients.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as PatientStatus | 'ALL')}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t('patients.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : patients.length === 0 ? (
          <EmptyState
            icon={Users}
            title={t('patients.noPatients')}
            description={
              search || statusFilter !== 'ALL'
                ? t('patients.noPatientsSearch')
                : t('patients.noPatientsEmpty')
            }
            action={
              !search && statusFilter === 'ALL' ? (
                <Button asChild>
                  <Link to="/patients/new">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('patients.addPatient')}
                  </Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <DataTable
            columns={columns}
            data={patients}
            onRowClick={(patient) => navigate(`/patients/${patient.id}`)}
          />
        )}
      </div>
    </PageWrapper>
  );
}
