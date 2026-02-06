import { useState } from 'react';
import { useAuditLogs } from '@/api/settings';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { DataTable } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateTime } from '@/lib/utils';
import { Shield, ChevronDown, ChevronRight, Search, Filter, RotateCcw } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  createdAt: string;
}

const ENTITY_TYPES = [
  { value: 'ALL', label: 'All Entities' },
  { value: 'USER', label: 'User' },
  { value: 'PATIENT', label: 'Patient' },
  { value: 'APPOINTMENT', label: 'Appointment' },
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'PRESCRIPTION', label: 'Prescription' },
  { value: 'LAB_ORDER', label: 'Lab Order' },
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'DOCUMENT', label: 'Document' },
  { value: 'SETTINGS', label: 'Settings' },
];

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  LOGIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  LOGOUT: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  VIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

function JsonDiff({ label, data }: { label: string; data: any }) {
  if (!data || Object.keys(data).length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
      <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

export function AuditLogPage() {
  const [entityTypeFilter, setEntityTypeFilter] = useState('ALL');
  const [userFilter, setUserFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const filters: any = {};
  if (entityTypeFilter !== 'ALL') filters.entityType = entityTypeFilter;
  if (userFilter) filters.user = userFilter;
  if (dateFrom) filters.dateFrom = dateFrom;
  if (dateTo) filters.dateTo = dateTo;

  const { data, isLoading } = useAuditLogs(
    Object.keys(filters).length > 0 ? filters : undefined,
  );

  const logs: AuditLogEntry[] = data?.data || [];

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleReset = () => {
    setEntityTypeFilter('ALL');
    setUserFilter('');
    setDateFrom('');
    setDateTo('');
  };

  const columns: ColumnDef<AuditLogEntry, any>[] = [
    {
      id: 'expand',
      header: '',
      cell: ({ row }) => {
        const hasDetails = row.original.oldValues || row.original.newValues;
        if (!hasDetails) return null;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleRow(row.original.id);
            }}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            {expandedRows.has(row.original.id) ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'createdAt',
      header: 'Timestamp',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: 'userName',
      header: 'User',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground">
          {row.original.userName}
        </span>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
            ACTION_COLORS[row.original.action] || ACTION_COLORS.VIEW
          }`}
        >
          {row.original.action}
        </span>
      ),
    },
    {
      accessorKey: 'entityType',
      header: 'Entity',
      cell: ({ row }) => (
        <div>
          <Badge variant="outline" className="text-xs">
            {row.original.entityType}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'details',
      header: 'Details',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
          {row.original.details || '-'}
        </span>
      ),
    },
  ];

  return (
    <PageWrapper
      title="Audit Log"
      breadcrumbs={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Audit Log' },
      ]}
    >
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-4 p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="w-4 h-4" />
            Filters
          </div>
          <div className="w-44">
            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Entity type" />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                placeholder="Search by user..."
                className="pl-9"
              />
            </div>
          </div>
          <div className="w-40">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From date"
            />
          </div>
          <div className="w-40">
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="To date"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="No audit logs found"
            description="No activity logs match the current filters. Try adjusting your filter criteria."
          />
        ) : (
          <div>
            <DataTable columns={columns} data={logs} pageSize={15} />

            {/* Expanded rows overlay */}
            {logs.map((log) => {
              if (!expandedRows.has(log.id)) return null;
              if (!log.oldValues && !log.newValues) return null;

              return (
                <div
                  key={`expanded-${log.id}`}
                  className="mt-2 mb-4 mx-4 p-4 rounded-lg border bg-muted/20 space-y-3"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span>Changes for {log.entityType} #{log.entityId?.slice(0, 8)}</span>
                    <span className="text-xs text-muted-foreground">
                      ({formatDateTime(log.createdAt)})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <JsonDiff label="Previous Values" data={log.oldValues} />
                    <JsonDiff label="New Values" data={log.newValues} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
