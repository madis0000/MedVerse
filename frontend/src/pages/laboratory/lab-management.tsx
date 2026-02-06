import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  FlaskConical,
  Plus,
  ClipboardList,
  TestTube,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { DataTable } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableSkeleton } from '@/components/ui/loading-skeleton';
import { cn, formatDate } from '@/lib/utils';
import { LabOrderForm } from '@/components/laboratory/lab-order-form';
import { ResultEntryForm } from '@/components/laboratory/result-entry-form';
import { useLabOrders, useLabOrder, useLabTests } from '@/api/laboratory';
import type { LabOrder, LabOrderStatus, LabPriority } from '@/types';

const statusStyles: Record<LabOrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  SAMPLE_COLLECTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PROCESSING: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  RESULTS_AVAILABLE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const priorityStyles: Record<LabPriority, string> = {
  ROUTINE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  URGENT: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  STAT: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_FILTERS: Array<{ label: string; value: string }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Sample Collected', value: 'SAMPLE_COLLECTED' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Results Available', value: 'RESULTS_AVAILABLE' },
];

interface LabTestDef {
  id: string;
  name: string;
  category: string;
  unit?: string;
  normalRangeMin?: number;
  normalRangeMax?: number;
}

export function LabManagementPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  const { data: ordersData, isLoading: ordersLoading } = useLabOrders(
    statusFilter !== 'ALL' ? { status: statusFilter } : undefined,
  );
  const { data: selectedOrderData } = useLabOrder(selectedOrderId);
  const { data: testsData, isLoading: testsLoading } = useLabTests();

  const orders: LabOrder[] = ordersData?.data ?? ordersData ?? [];
  const selectedOrder: LabOrder | null = selectedOrderData?.data ?? selectedOrderData ?? null;
  const labTests: LabTestDef[] = testsData?.data ?? testsData ?? [];

  // Group tests by category for catalog tab
  const testsByCategory = useMemo(() => {
    return labTests.reduce<Record<string, LabTestDef[]>>((acc, test) => {
      const cat = test.category || 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(test);
      return acc;
    }, {});
  }, [labTests]);

  const orderColumns: ColumnDef<LabOrder, any>[] = [
    {
      accessorKey: 'id',
      header: 'Order ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      accessorKey: 'patient',
      header: 'Patient',
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
      accessorKey: 'orderedBy',
      header: 'Ordered By',
      cell: ({ row }) => {
        const doc = row.original.orderedBy;
        return doc ? (
          <span>Dr. {doc.firstName} {doc.lastName}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => (
        <Badge className={cn('text-xs', priorityStyles[row.original.priority])}>
          {row.original.priority}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={cn('text-xs', statusStyles[row.original.status])}>
          {row.original.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>
      ),
    },
  ];

  return (
    <PageWrapper
      title="Laboratory"
      breadcrumbs={[{ label: 'Laboratory' }]}
      actions={
        <Button onClick={() => setOrderFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Lab Order
        </Button>
      }
    >
      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders" className="flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-1.5">
            <TestTube className="h-4 w-4" />
            Results Entry
          </TabsTrigger>
          <TabsTrigger value="catalog" className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            Test Catalog
          </TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex items-center gap-2">
            {STATUS_FILTERS.map((f) => (
              <Button
                key={f.value}
                variant={statusFilter === f.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>

          {ordersLoading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={FlaskConical}
              title="No lab orders"
              description="No lab orders match the current filter."
              action={
                <Button onClick={() => setOrderFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Lab Order
                </Button>
              }
            />
          ) : (
            <DataTable columns={orderColumns} data={orders} />
          )}
        </TabsContent>

        {/* Results Entry Tab */}
        <TabsContent value="results" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Select Order</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedOrderId}
                    onValueChange={(v) => setSelectedOrderId(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a lab order..." />
                    </SelectTrigger>
                    <SelectContent>
                      {orders
                        .filter((o) => o.status !== 'CANCELLED')
                        .map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            <span className="flex items-center gap-2">
                              <span className="font-mono text-xs">
                                {o.id.slice(0, 8).toUpperCase()}
                              </span>
                              <span>
                                {o.patient
                                  ? `${o.patient.firstName} ${o.patient.lastName}`
                                  : 'Unknown'}
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              {selectedOrder ? (
                <ResultEntryForm
                  order={selectedOrder}
                  onComplete={() => setSelectedOrderId('')}
                />
              ) : (
                <EmptyState
                  icon={TestTube}
                  title="No order selected"
                  description="Select a lab order from the left to enter results."
                />
              )}
            </div>
          </div>
        </TabsContent>

        {/* Test Catalog Tab */}
        <TabsContent value="catalog" className="space-y-4">
          {testsLoading ? (
            <TableSkeleton rows={8} cols={4} />
          ) : labTests.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No test definitions"
              description="The test catalog is empty."
            />
          ) : (
            <div className="space-y-6">
              {Object.entries(testsByCategory).map(([category, tests]) => (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FlaskConical className="h-4 w-4" />
                      {category}
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {tests.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                              Test Name
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                              Unit
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                              Normal Range
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {tests.map((test) => (
                            <tr
                              key={test.id}
                              className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                            >
                              <td className="px-4 py-2.5 text-sm font-medium">
                                {test.name}
                              </td>
                              <td className="px-4 py-2.5 text-sm text-muted-foreground">
                                {test.unit ?? '-'}
                              </td>
                              <td className="px-4 py-2.5 text-sm text-muted-foreground">
                                {test.normalRangeMin !== undefined &&
                                test.normalRangeMax !== undefined
                                  ? `${test.normalRangeMin} - ${test.normalRangeMax}`
                                  : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <LabOrderForm open={orderFormOpen} onOpenChange={setOrderFormOpen} />
    </PageWrapper>
  );
}
