import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Download,
  CreditCard,
  Receipt,
  Calendar,
  User,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TableSkeleton } from '@/components/ui/loading-skeleton';
import { PaymentForm } from '@/components/billing/payment-form';
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import { useInvoice } from '@/api/billing';
import apiClient from '@/lib/api-client';
import type { Invoice, InvoiceStatus, Payment } from '@/types';

const statusStyles: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  PARTIAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  OVERDUE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-500',
};

export function InvoiceDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: invoiceData, isLoading } = useInvoice(id ?? '');

  const [paymentFormOpen, setPaymentFormOpen] = useState(false);

  const invoice: Invoice | null = invoiceData?.data ?? invoiceData ?? null;

  const methodLabels: Record<string, string> = {
    CASH: t('billing.paymentMethods.CASH'),
    CARD: t('billing.paymentMethods.CARD'),
    INSURANCE: t('billing.paymentMethods.INSURANCE'),
    BANK_TRANSFER: t('billing.paymentMethods.BANK_TRANSFER'),
  };

  async function handleDownloadPdf() {
    if (!id) return;
    try {
      const response = await apiClient.get(`/invoices/${id}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice?.invoiceNumber ?? id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error(t('billing.downloadFailed'));
    }
  }

  if (isLoading) {
    return (
      <PageWrapper title={t('billing.invoice')} breadcrumbs={[{ label: t('nav.billing'), path: '/billing' }, { label: t('common.details') }]}>
        <TableSkeleton rows={8} cols={5} />
      </PageWrapper>
    );
  }

  if (!invoice) {
    return (
      <PageWrapper title={t('billing.invoiceNotFound')} breadcrumbs={[{ label: t('nav.billing'), path: '/billing' }, { label: t('common.details') }]}>
        <div className="text-center py-12">
          <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('billing.invoiceNotFound')}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/billing')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')} {t('nav.billing')}
          </Button>
        </div>
      </PageWrapper>
    );
  }

  const paidAmount = (invoice.payments ?? []).reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = invoice.total - paidAmount;

  return (
    <PageWrapper
      title={`${t('billing.invoice')} ${invoice.invoiceNumber}`}
      breadcrumbs={[
        { label: t('nav.billing'), path: '/billing' },
        { label: invoice.invoiceNumber },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownloadPdf}>
            <Download className="h-4 w-4 mr-2" />
            {t('billing.downloadPdf')}
          </Button>
          {remainingBalance > 0 && (
            <Button onClick={() => setPaymentFormOpen(true)}>
              <CreditCard className="h-4 w-4 mr-2" />
              {t('billing.recordPayment')}
            </Button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold">{invoice.invoiceNumber}</h2>
                    <Badge className={cn('text-xs', statusStyles[invoice.status])}>
                      {t(`billing.status.${invoice.status}`)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(invoice.createdAt)}
                    </span>
                    {invoice.dueDate && (
                      <span className="flex items-center gap-1">
                        {t('billing.dueDate')}: {formatDate(invoice.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {invoice.patient && (
                <div className="mt-4 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {invoice.patient.firstName} {invoice.patient.lastName}
                    </span>
                    <span className="text-muted-foreground">MRN: {invoice.patient.mrn}</span>
                  </div>
                  {invoice.patient.phone && (
                    <p className="text-xs text-muted-foreground ml-6 mt-1">
                      {t('common.phone')}: {invoice.patient.phone}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('billing.lineItems')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                        {t('billing.serviceDescription')}
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                        {t('common.category')}
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                        {t('billing.qty')}
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                        {t('billing.unitPrice')}
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                        {t('billing.lineTotal')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(invoice.items ?? []).map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="px-4 py-2.5 text-sm font-medium">
                          {item.description}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-muted-foreground">
                          {item.category}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-right">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-right">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-right font-medium">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                    {(!invoice.items || invoice.items.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                          {t('billing.noLineItems')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('billing.paymentHistory')}</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.payments && invoice.payments.length > 0 ? (
                <div className="space-y-3">
                  {invoice.payments.map((payment: Payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {methodLabels[payment.method] ?? payment.method}
                          {payment.reference && ` - ${t('common.ref')}: ${payment.reference}`}
                        </p>
                        {payment.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5">{payment.notes}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(payment.paidAt)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {t('billing.noPayments')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Totals */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('billing.invoiceSummary')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('billing.subtotal')}</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('billing.tax')}</span>
                    <span className="font-medium">+{formatCurrency(invoice.tax)}</span>
                  </div>
                )}
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('billing.discount')}</span>
                    <span className="font-medium text-green-600">-{formatCurrency(invoice.discount)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between">
                  <span className="font-medium">{t('billing.grandTotal')}</span>
                  <span className="text-lg font-bold">{formatCurrency(invoice.total)}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('billing.paid')}</span>
                  <span className="font-medium text-green-600">{formatCurrency(paidAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('billing.balance')}</span>
                  <span className={cn('font-bold', remainingBalance > 0 ? 'text-red-600' : 'text-green-600')}>
                    {formatCurrency(remainingBalance)}
                  </span>
                </div>
              </div>

              {remainingBalance > 0 && (
                <Button
                  className="w-full mt-4"
                  onClick={() => setPaymentFormOpen(true)}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {t('billing.recordPayment')}
                </Button>
              )}
            </CardContent>
          </Card>

          {invoice.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('common.notes')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <PaymentForm
        open={paymentFormOpen}
        onOpenChange={setPaymentFormOpen}
        invoiceId={id ?? ''}
        remainingBalance={remainingBalance}
      />
    </PageWrapper>
  );
}
