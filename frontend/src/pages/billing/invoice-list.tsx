import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ColumnDef } from '@tanstack/react-table';
import {
  Receipt,
  Plus,
  Eye,
  MoreHorizontal,
  Download,
} from 'lucide-react';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { DataTable } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TableSkeleton } from '@/components/ui/loading-skeleton';
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import { InvoiceForm } from '@/components/billing/invoice-form';
import { useInvoices } from '@/api/billing';
import type { Invoice, InvoiceStatus } from '@/types';

const statusStyles: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  PARTIAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  OVERDUE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-500',
};

const STATUS_TAB_KEYS = [
  { key: 'billing.tabs.all', value: 'ALL' },
  { key: 'billing.tabs.pending', value: 'PENDING' },
  { key: 'billing.tabs.partial', value: 'PARTIAL' },
  { key: 'billing.tabs.paid', value: 'PAID' },
  { key: 'billing.tabs.overdue', value: 'OVERDUE' },
];

export function InvoiceListPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);

  const { data: invoicesData, isLoading } = useInvoices(
    statusFilter !== 'ALL' ? { status: statusFilter } : undefined,
  );

  const invoices: Invoice[] = invoicesData?.data ?? invoicesData ?? [];

  const columns: ColumnDef<Invoice, any>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: t('billing.invoiceNumber'),
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium">{row.original.invoiceNumber}</span>
      ),
    },
    {
      accessorKey: 'patient',
      header: t('billing.patient'),
      cell: ({ row }) => {
        const p = row.original.patient;
        return p ? (
          <span className="font-medium">{p.firstName} {p.lastName}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: t('common.date'),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      accessorKey: 'total',
      header: t('billing.total'),
      cell: ({ row }) => (
        <span className="font-medium">{formatCurrency(row.original.total)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: t('common.status'),
      cell: ({ row }) => (
        <Badge className={cn('text-xs', statusStyles[row.original.status])}>
          {t(`billing.status.${row.original.status}`)}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/billing/${row.original.id}`);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageWrapper
      title={t('nav.billing')}
      breadcrumbs={[{ label: t('nav.billing') }]}
      actions={
        <Button onClick={() => setInvoiceFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('billing.newInvoice')}
        </Button>
      }
    >
      <Tabs
        value={statusFilter}
        onValueChange={setStatusFilter}
        className="space-y-4"
      >
        <TabsList>
          {STATUS_TAB_KEYS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {t(tab.key)}
            </TabsTrigger>
          ))}
        </TabsList>

        {STATUS_TAB_KEYS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {isLoading ? (
              <TableSkeleton rows={6} cols={6} />
            ) : invoices.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title={t('billing.noInvoices')}
                description={
                  statusFilter === 'ALL'
                    ? t('billing.noInvoicesDescription')
                    : t('billing.noInvoicesDescription')
                }
                action={
                  <Button onClick={() => setInvoiceFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('billing.newInvoice')}
                  </Button>
                }
              />
            ) : (
              <DataTable
                columns={columns}
                data={invoices}
                onRowClick={(row) => navigate(`/billing/${row.id}`)}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      <InvoiceForm open={invoiceFormOpen} onOpenChange={setInvoiceFormOpen} />
    </PageWrapper>
  );
}
