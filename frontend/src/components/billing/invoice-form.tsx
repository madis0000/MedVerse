import { useState, useCallback, useEffect } from 'react';
import { Search, Plus, Trash2, Loader2, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { useCreateInvoice } from '@/api/billing';
import apiClient from '@/lib/api-client';
import type { Patient } from '@/types';

interface LineItem {
  tempId: string;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES = [
  'Consultation',
  'Laboratory',
  'Radiology',
  'Pharmacy',
  'Procedure',
  'Surgery',
  'Room & Board',
  'Other',
];

function createEmptyLineItem(): LineItem {
  return {
    tempId: crypto.randomUUID(),
    description: '',
    category: 'Consultation',
    quantity: 1,
    unitPrice: 0,
  };
}

export function InvoiceForm({ open, onOpenChange }: InvoiceFormProps) {
  const createInvoice = useCreateInvoice();

  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);

  const [lineItems, setLineItems] = useState<LineItem[]>([createEmptyLineItem()]);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [dueDate, setDueDate] = useState('');

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = subtotal + tax - discount;

  const searchPatients = useCallback(async (q: string) => {
    setPatientQuery(q);
    if (q.length < 2) {
      setPatientResults([]);
      return;
    }
    setPatientSearchLoading(true);
    try {
      const { data } = await apiClient.get('/patients', { params: { search: q, limit: 10 } });
      setPatientResults(data.data ?? data ?? []);
    } catch {
      setPatientResults([]);
    } finally {
      setPatientSearchLoading(false);
    }
  }, []);

  function selectPatient(patient: Patient) {
    setSelectedPatient(patient);
    setPatientQuery(`${patient.firstName} ${patient.lastName}`);
    setPatientResults([]);
  }

  function addLineItem() {
    setLineItems((prev) => [...prev, createEmptyLineItem()]);
  }

  function removeLineItem(tempId: string) {
    setLineItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((item) => item.tempId !== tempId);
    });
  }

  function updateLineItem(tempId: string, field: keyof LineItem, value: string | number) {
    setLineItems((prev) =>
      prev.map((item) =>
        item.tempId === tempId ? { ...item, [field]: value } : item,
      ),
    );
  }

  function resetForm() {
    setPatientQuery('');
    setPatientResults([]);
    setSelectedPatient(null);
    setLineItems([createEmptyLineItem()]);
    setTax(0);
    setDiscount(0);
    setDueDate('');
  }

  async function handleSubmit() {
    if (!selectedPatient) {
      toast.error('Select a patient');
      return;
    }

    const validItems = lineItems.filter((item) => item.description.trim() && item.unitPrice > 0);
    if (validItems.length === 0) {
      toast.error('Add at least one valid line item');
      return;
    }

    try {
      await createInvoice.mutateAsync({
        patientId: selectedPatient.id,
        items: validItems.map(({ tempId, ...rest }) => ({
          ...rest,
          total: rest.quantity * rest.unitPrice,
        })),
        tax,
        discount,
        dueDate: dueDate || undefined,
      });
      toast.success('Invoice created successfully');
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error('Failed to create invoice');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Create Invoice
          </DialogTitle>
          <DialogDescription>
            Create a new invoice for a patient with line items and pricing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Patient Search */}
          <div className="space-y-2">
            <Label>Patient</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={patientQuery}
                onChange={(e) => searchPatients(e.target.value)}
                placeholder="Search patient..."
                className="pl-9"
              />
              {patientSearchLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {patientResults.length > 0 && (
                <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-lg max-h-48 overflow-y-auto">
                  {patientResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="flex w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                      onClick={() => selectPatient(p)}
                    >
                      <div>
                        <p className="font-medium">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-muted-foreground">MRN: {p.mrn}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedPatient && (
              <div className="p-2 rounded-md bg-muted/50 text-sm">
                <span className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</span>
                <span className="text-muted-foreground ml-2">MRN: {selectedPatient.mrn}</span>
              </div>
            )}
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Line Items</Label>
              <Button variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            {lineItems.map((item, index) => (
              <div key={item.tempId} className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg border bg-muted/20">
                <div className="col-span-4">
                  <Label className="text-xs">Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateLineItem(item.tempId, 'description', e.target.value)}
                    placeholder="Service description"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Category</Label>
                  <Select
                    value={item.category}
                    onValueChange={(v) => updateLineItem(item.tempId, 'category', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateLineItem(item.tempId, 'quantity', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Unit Price</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateLineItem(item.tempId, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-1 flex items-end justify-center">
                  <span className="text-sm font-medium pb-2">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </span>
                </div>
                <div className="col-span-1 flex items-end justify-center">
                  {lineItems.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(item.tempId)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Tax and Discount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tax ($)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Discount ($)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-1 text-sm text-right">
            <p>Subtotal: <span className="font-medium">{formatCurrency(subtotal)}</span></p>
            {tax > 0 && <p>Tax: <span className="font-medium">+{formatCurrency(tax)}</span></p>}
            {discount > 0 && <p>Discount: <span className="font-medium text-green-600">-{formatCurrency(discount)}</span></p>}
            <p className="text-base font-bold">Total: {formatCurrency(total)}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createInvoice.isPending || !selectedPatient}
          >
            {createInvoice.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
