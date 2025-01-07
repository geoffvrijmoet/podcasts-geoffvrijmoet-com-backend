"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Invoice {
  _id: string;
  client: string;
  episodeTitle: string;
  type: string;
  earnedAfterFees: number;
  invoicedAmount: number;
  billedMinutes: number;
  length: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  paymentMethod: string;
  editingTime: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  billableHours: number;
  runningHourlyTotal: number;
  ratePerMinute: number;
  dateInvoiced: string;
  datePaid: string;
  note: string;
}

interface InvoiceEditFormProps {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

const calculateEarnedAfterFees = (amount: number, paymentMethod: string): number => {
  if (!amount) return 0;
  
  switch (paymentMethod.toLowerCase()) {
    case 'venmo':
      // 1.9% + $0.10 fee
      return amount - (amount * 0.019 + 0.10);
    case 'paypal':
      // 2.9% + $0.10 fee
      return amount - (amount * 0.029 + 0.10);
    default:
      // No fees for other payment methods
      return amount;
  }
};

const calculateStats = (
  earnedAfterFees: number,
  billedMinutes: number,
  editingTime: { hours: number; minutes: number; seconds: number }
) => {
  // Calculate earnings per delivered minute
  const perMinute = billedMinutes > 0 
    ? earnedAfterFees / billedMinutes 
    : 0;

  // Calculate total editing time in hours
  const totalEditingHours = editingTime.hours + 
    (editingTime.minutes / 60) + 
    (editingTime.seconds / 3600);

  // Calculate earnings per hour worked
  const perHourWorked = totalEditingHours > 0 
    ? earnedAfterFees / totalEditingHours 
    : 0;

  return {
    perMinute: Number(perMinute.toFixed(2)),
    perHourWorked: Number(perHourWorked.toFixed(2))
  };
};

export function InvoiceEditForm({ invoice, open, onOpenChange, onSave }: InvoiceEditFormProps) {
  const [formData, setFormData] = useState<Partial<Invoice>>({
    client: invoice.client,
    episodeTitle: invoice.episodeTitle,
    type: invoice.type,
    earnedAfterFees: invoice.earnedAfterFees,
    invoicedAmount: invoice.invoicedAmount,
    billedMinutes: invoice.billedMinutes,
    paymentMethod: invoice.paymentMethod,
    dateInvoiced: invoice.dateInvoiced,
    datePaid: invoice.datePaid,
    note: invoice.note,
    editingTime: invoice.editingTime,
  });

  const [stats, setStats] = useState(() => 
    calculateStats(
      invoice.earnedAfterFees,
      invoice.billedMinutes,
      invoice.editingTime
    )
  );

  // Update stats when relevant values change
  useEffect(() => {
    const newStats = calculateStats(
      formData.earnedAfterFees || 0,
      formData.billedMinutes || 0,
      formData.editingTime || { hours: 0, minutes: 0, seconds: 0 }
    );
    setStats(newStats);
  }, [formData.earnedAfterFees, formData.billedMinutes, formData.editingTime]);

  const [saving, setSaving] = useState(false);

  // Automatically calculate earnedAfterFees when invoicedAmount or paymentMethod changes
  useEffect(() => {
    const earnedAfterFees = calculateEarnedAfterFees(
      formData.invoicedAmount || 0,
      formData.paymentMethod || ''
    );
    setFormData(prev => ({
      ...prev,
      earnedAfterFees: Number(earnedAfterFees.toFixed(2)), // Round to 2 decimal places
    }));
  }, [formData.invoicedAmount, formData.paymentMethod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/invoices/${invoice._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update invoice');
      }

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating invoice:', error);
      // You might want to show an error message to the user here
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleEditingTimeChange = (field: 'hours' | 'minutes' | 'seconds', value: string) => {
    setFormData(prev => ({
      ...prev,
      editingTime: {
        hours: field === 'hours' ? parseInt(value) || 0 : prev.editingTime?.hours || 0,
        minutes: field === 'minutes' ? parseInt(value) || 0 : prev.editingTime?.minutes || 0,
        seconds: field === 'seconds' ? parseInt(value) || 0 : prev.editingTime?.seconds || 0,
      }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="client" className="text-sm font-medium">
                Client
              </label>
              <Input
                id="client"
                name="client"
                value={formData.client}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="episodeTitle" className="text-sm font-medium">
                Episode Title
              </label>
              <Input
                id="episodeTitle"
                name="episodeTitle"
                value={formData.episodeTitle}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="type" className="text-sm font-medium">
                Type
              </label>
              <Input
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="invoicedAmount" className="text-sm font-medium">
                Invoiced Amount
              </label>
              <Input
                id="invoicedAmount"
                name="invoicedAmount"
                type="number"
                step="0.01"
                value={formData.invoicedAmount}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="paymentMethod" className="text-sm font-medium">
                Payment Method
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select payment method</option>
                <option value="Venmo">Venmo</option>
                <option value="PayPal">PayPal</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="earnedAfterFees" className="text-sm font-medium">
                Earned After Fees
              </label>
              <Input
                id="earnedAfterFees"
                name="earnedAfterFees"
                type="number"
                step="0.01"
                value={formData.earnedAfterFees}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="billedMinutes" className="text-sm font-medium">
                Billed Minutes
              </label>
              <Input
                id="billedMinutes"
                name="billedMinutes"
                type="number"
                value={formData.billedMinutes}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="dateInvoiced" className="text-sm font-medium">
                Date Invoiced
              </label>
              <Input
                id="dateInvoiced"
                name="dateInvoiced"
                type="date"
                value={formData.dateInvoiced ? new Date(formData.dateInvoiced).toISOString().split('T')[0] : ''}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="datePaid" className="text-sm font-medium">
                Date Paid
              </label>
              <Input
                id="datePaid"
                name="datePaid"
                type="date"
                value={formData.datePaid ? new Date(formData.datePaid).toISOString().split('T')[0] : ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="space-y-1">
              <label htmlFor="editingHours" className="text-sm font-medium">
                Hours
              </label>
              <Input
                id="editingHours"
                name="editingTime.hours"
                type="number"
                min="0"
                value={formData.editingTime?.hours || 0}
                onChange={(e) => handleEditingTimeChange('hours', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="editingMinutes" className="text-sm font-medium">
                Minutes
              </label>
              <Input
                id="editingMinutes"
                name="editingTime.minutes"
                type="number"
                min="0"
                max="59"
                value={formData.editingTime?.minutes || 0}
                onChange={(e) => handleEditingTimeChange('minutes', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="editingSeconds" className="text-sm font-medium">
                Seconds
              </label>
              <Input
                id="editingSeconds"
                name="editingTime.seconds"
                type="number"
                min="0"
                max="59"
                value={formData.editingTime?.seconds || 0}
                onChange={(e) => handleEditingTimeChange('seconds', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1 mt-3">
            <label htmlFor="note" className="text-sm font-medium">
              Note
            </label>
            <Input
              id="note"
              name="note"
              value={formData.note}
              onChange={handleChange}
            />
          </div>

          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h3 className="text-sm font-medium mb-2">Invoice Stats</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Earned per delivered minute:</p>
                <p className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.perMinute)}/min</p>
              </div>
              <div>
                <p className="text-muted-foreground">Earned per hour worked:</p>
                <p className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.perHourWorked)}/hr</p>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 