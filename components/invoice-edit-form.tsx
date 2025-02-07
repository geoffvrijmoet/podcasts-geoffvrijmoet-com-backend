"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Command } from "cmdk";

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
  lengthEntries?: TimeEntry[];
  paymentMethod: string;
  editingTime: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  timeEntries?: TimeEntry[];
  billableHours: number;
  runningHourlyTotal: number;
  ratePerMinute: number;
  dateInvoiced: string;
  datePaid: string;
  note: string;
}

// Add TimeEntry type
type TimeEntry = {
  hours: number;
  minutes: number;
  seconds: number;
};

interface InvoiceEditFormProps {
  invoice?: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  mode?: 'edit' | 'create';
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

const emptyInvoice: Partial<Invoice> = {
  client: '',
  episodeTitle: '',
  type: 'Podcast',
  earnedAfterFees: 0,
  invoicedAmount: 0,
  billedMinutes: 0,
  length: { hours: 0, minutes: 0, seconds: 0 },
  editingTime: { hours: 0, minutes: 0, seconds: 0 },
  paymentMethod: '',
  dateInvoiced: '',
  datePaid: '',
  note: '',
};

export function InvoiceEditForm({ invoice, open, onOpenChange, onSave, mode = 'edit' }: InvoiceEditFormProps) {
  console.log('🔵 [1. Component Mount/Render]', { mode, invoice });

  const [formData, setFormData] = useState<Partial<Invoice>>(() => {
    const initialData = mode === 'edit' ? {
      client: invoice?.client || '',
      episodeTitle: invoice?.episodeTitle || '',
      type: invoice?.type || '',
      earnedAfterFees: invoice?.earnedAfterFees || 0,
      invoicedAmount: invoice?.invoicedAmount || 0,
      billedMinutes: invoice?.billedMinutes || 0,
      paymentMethod: invoice?.paymentMethod || '',
      dateInvoiced: invoice?.dateInvoiced || '',
      datePaid: invoice?.datePaid || '',
      note: invoice?.note || '',
      editingTime: invoice?.editingTime || { hours: 0, minutes: 0, seconds: 0 },
      length: invoice?.length || { hours: 0, minutes: 0, seconds: 0 },
    } : emptyInvoice;
    console.log('🟡 [2. Initial Form Data]', initialData);
    return initialData;
  });

  // Track whether we're in the middle of an update
  const isUpdatingRef = useRef(false);

  // Update timeEntries initialization
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(() => {
    const initialEntries = mode === 'edit' && invoice?.timeEntries ? 
      invoice.timeEntries : 
      [invoice?.editingTime || { hours: 0, minutes: 0, seconds: 0 }];
    console.log('🟡 [3. Initial Time Entries]', initialEntries);
    return initialEntries;
  });

  // Update lengthEntries initialization
  const [lengthEntries, setLengthEntries] = useState<TimeEntry[]>(() => {
    const initialEntries = mode === 'edit' && invoice?.lengthEntries ? 
      invoice.lengthEntries : 
      [invoice?.length || { hours: 0, minutes: 0, seconds: 0 }];
    console.log('🟡 [3. Initial Length Entries]', initialEntries);
    return initialEntries;
  });

  const [stats, setStats] = useState(() => {
    const initialStats = calculateStats(
      mode === 'edit' ? (invoice?.earnedAfterFees || 0) : 0,
      mode === 'edit' ? (invoice?.billedMinutes || 0) : 0,
      mode === 'edit' ? (invoice?.editingTime || { hours: 0, minutes: 0, seconds: 0 }) : { hours: 0, minutes: 0, seconds: 0 }
    );
    console.log('🟡 [4. Initial Stats]', initialStats);
    return initialStats;
  });

  // Combined effect to handle all calculations
  useEffect(() => {
    console.log('🔵 [5. Calculation Effect Triggered]', {
      invoicedAmount: formData.invoicedAmount,
      paymentMethod: formData.paymentMethod,
      earnedAfterFees: formData.earnedAfterFees,
      billedMinutes: formData.billedMinutes,
      editingTime: formData.editingTime
    });

    if (isUpdatingRef.current) {
      console.log('🔴 [5a. Update Already in Progress - Skipping]');
      return;
    }
    
    try {
      console.log('🟢 [5b. Starting Update Cycle]');
      isUpdatingRef.current = true;
      
      const updates: Partial<Invoice> = {};
      let hasUpdates = false;

      // Calculate earnedAfterFees if needed
      if (formData.invoicedAmount !== undefined && formData.paymentMethod) {
        console.log('🟡 [5c. Calculating EarnedAfterFees]', {
          amount: formData.invoicedAmount,
          method: formData.paymentMethod
        });
        
        const earnedAfterFees = calculateEarnedAfterFees(
          formData.invoicedAmount,
          formData.paymentMethod
        );
        
        if (earnedAfterFees !== formData.earnedAfterFees) {
          updates.earnedAfterFees = Number(earnedAfterFees.toFixed(2));
          hasUpdates = true;
          console.log('🟢 [5d. EarnedAfterFees Updated]', {
            old: formData.earnedAfterFees,
            new: updates.earnedAfterFees
          });
        }
      }

      // Calculate stats if needed
      console.log('🟡 [5e. Calculating Stats]');
      const newStats = calculateStats(
        updates.earnedAfterFees || formData.earnedAfterFees || 0,
        formData.billedMinutes || 0,
        formData.editingTime || { hours: 0, minutes: 0, seconds: 0 }
      );

      if (newStats.perMinute !== stats.perMinute || 
          newStats.perHourWorked !== stats.perHourWorked) {
        console.log('🟢 [5f. Stats Updated]', {
          old: stats,
          new: newStats
        });
        setStats(newStats);
      }

      // Apply updates if any
      if (hasUpdates) {
        console.log('🟢 [5g. Applying Form Updates]', updates);
        setFormData(prev => ({
          ...prev,
          ...updates
        }));
      }
    } finally {
      console.log('🔵 [5h. Update Cycle Complete]');
      isUpdatingRef.current = false;
    }
  }, [
    formData.invoicedAmount,
    formData.paymentMethod,
    formData.earnedAfterFees,
    formData.billedMinutes,
    formData.editingTime
  ]);

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Create the data to send, including both totals and individual entries
      const dataToSend = {
        ...formData,
        timeEntries: timeEntries,  // Add individual time entries
        lengthEntries: lengthEntries,  // Add individual length entries
        editingTime: sumTimeEntries(timeEntries),  // Ensure total is updated
        length: sumTimeEntries(lengthEntries),  // Ensure total is updated
      };

      const response = await fetch(`/api/invoices${mode === 'edit' ? `/${invoice?._id}` : ''}`, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${mode === 'edit' ? 'update' : 'create'} invoice`);
      }

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} invoice:`, error);
    } finally {
      setSaving(false);
    }
  };

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseFloat(value) : value;
    console.log('🔵 [6. Form Field Change]', { field: name, value: newValue });
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const [clients, setClients] = useState<string[]>([]);

  // Fetch unique clients when form opens
  useEffect(() => {
    async function fetchClients() {
      try {
        const response = await fetch("/api/invoices");
        const data = await response.json();
        // Safely handle the data structure and filter out empty/null values
        const uniqueClients = [...new Set(
          (data?.invoices || [])
            .map((inv: Invoice) => inv.client)
            .filter((client: string) => client && client.trim() !== '')
        )] as string[];
        setClients(uniqueClients);
      } catch (error) {
        console.error("Error fetching clients:", error);
        setClients([]);
      }
    }
    fetchClients();
  }, []);

  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [filteredClients, setFilteredClients] = useState<string[]>([]);

  // Add client filtering function
  const handleClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleChange(e);
    
    // Filter clients based on input
    const matches = clients.filter(client => 
      client.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredClients(matches);
    setShowClientDropdown(true);
  };

  // Add client selection function
  const handleClientSelect = (client: string) => {
    setFormData(prev => ({ ...prev, client }));
    setShowClientDropdown(false);
  };

  // Add click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!(event.target as HTMLElement).closest('#client')) {
        setShowClientDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add function to handle adding a new length entry
  const addLengthEntry = () => {
    setLengthEntries([...lengthEntries, { hours: 0, minutes: 0, seconds: 0 }]);
  };

  // Add function to handle removing a length entry
  const removeLengthEntry = (index: number) => {
    if (lengthEntries.length > 1) {
      setLengthEntries(lengthEntries.filter((_, i) => i !== index));
    }
  };

  // Update length entry
  const updateLengthEntry = (index: number, field: keyof TimeEntry, value: number) => {
    console.log('🔵 [8. Length Entry Update]', { index, field, value });
    
    setLengthEntries(prevEntries => {
      const newLengthEntries = [...prevEntries];
      newLengthEntries[index] = { ...newLengthEntries[index], [field]: value };
      
      // Calculate total length
      const totalLength = sumTimeEntries(newLengthEntries);
      console.log('🟡 [8a. Calculated Total Length]', { totalLength });
      
      // Update form data with new total length
      console.log('🟢 [8b. Updating Form Data with Total Length]');
      setFormData(prev => ({ ...prev, length: totalLength }));
      
      return newLengthEntries;
    });
  };

  // Add function to handle adding a new time entry
  const addTimeEntry = () => {
    setTimeEntries([...timeEntries, { hours: 0, minutes: 0, seconds: 0 }]);
  };

  // Add function to handle removing a time entry
  const removeTimeEntry = (index: number) => {
    if (timeEntries.length > 1) {
      setTimeEntries(timeEntries.filter((_, i) => i !== index));
    }
  };

  // Update time entry
  const updateTimeEntry = (index: number, field: keyof TimeEntry, value: number) => {
    console.log('🔵 [7. Time Entry Update]', { index, field, value });
    
    setTimeEntries(prevEntries => {
      const newTimeEntries = [...prevEntries];
      newTimeEntries[index] = { ...newTimeEntries[index], [field]: value };
      
      // Calculate total time
      const totalTime = sumTimeEntries(newTimeEntries);
      console.log('🟡 [7a. Calculated Total Time]', { totalTime });
      
      // Update form data with new total time
      console.log('🟢 [7b. Updating Form Data with Total Time]');
      setFormData(prev => ({ ...prev, editingTime: totalTime }));
      
      return newTimeEntries;
    });
  };

  // Add function to sum up time entries
  const sumTimeEntries = (entries: TimeEntry[]) => {
    const total = entries.reduce(
      (acc, entry) => {
        let totalSeconds = acc.seconds + entry.seconds;
        let totalMinutes = acc.minutes + entry.minutes + Math.floor(totalSeconds / 60);
        const totalHours = acc.hours + entry.hours + Math.floor(totalMinutes / 60);
        
        totalSeconds = totalSeconds % 60;
        totalMinutes = totalMinutes % 60;

        return {
          hours: totalHours,
          minutes: totalMinutes,
          seconds: totalSeconds
        };
      },
      { hours: 0, minutes: 0, seconds: 0 }
    );

    return total;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Invoice' : 'New Invoice'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="client" className="text-sm font-medium">
                Client
              </label>
              <div className="relative">
                <Input
                  id="client"
                  name="client"
                  value={formData.client}
                  onChange={handleClientChange}
                  onFocus={() => setShowClientDropdown(true)}
                  placeholder="Select or type new client..."
                  className="w-full"
                />
                {showClientDropdown && filteredClients.length > 0 && (
                  <div className="absolute top-full left-0 w-full z-50 mt-1 rounded-md border bg-white text-popover-foreground shadow-md">
                    <Command className="w-full">
                      <Command.List className="max-h-[200px] overflow-y-auto p-1">
                        {filteredClients.map((client) => (
                          <Command.Item
                            key={client}
                            value={client}
                            className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground hover:bg-primary hover:text-primary-foreground cursor-pointer bg-white"
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevent input blur
                              handleClientSelect(client);
                            }}
                          >
                            {client}
                          </Command.Item>
                        ))}
                      </Command.List>
                    </Command>
                  </div>
                )}
                {mode === 'create' && formData.client && !clients.includes(formData.client) && (
                  <div className="absolute -bottom-6 left-0 text-xs text-muted-foreground">
                    Will create new client: &quot;{formData.client}&quot;
                  </div>
                )}
              </div>
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
              <label htmlFor="type" className="text-sm font-medium block">
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
              <label htmlFor="datePaid" className="text-sm font-medium block">
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

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 gap-6">
              {/* Episode Length Section */}
              <div className="space-y-4">
                <label className="text-sm font-medium">Episode Length (Final Duration)</label>
                
                {lengthEntries.map((entry, index) => (
                  <div key={index} className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Hours</label>
                        <Input
                          type="number"
                          min="0"
                          value={entry.hours}
                          onChange={(e) => updateLengthEntry(index, 'hours', Number(e.target.value))}
                          className="transition-colors duration-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground block">Minutes</label>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          value={entry.minutes}
                          onChange={(e) => updateLengthEntry(index, 'minutes', Number(e.target.value))}
                          className="transition-colors duration-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground block">Seconds</label>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          value={entry.seconds}
                          onChange={(e) => updateLengthEntry(index, 'seconds', Number(e.target.value))}
                          className="transition-colors duration-500"
                        />
                      </div>
                    </div>
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLengthEntry(index)}
                        className="text-red-500"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLengthEntry}
                  className="mt-2"
                >
                  Add Length +
                </Button>
              </div>

              {/* Time Spent Editing Section */}
              <div className="space-y-4">
                <label className="text-sm font-medium">Time Spent Editing</label>
                
                {timeEntries.map((entry, index) => (
                  <div key={index} className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Hours</label>
                        <Input
                          type="number"
                          min="0"
                          value={entry.hours}
                          onChange={(e) => updateTimeEntry(index, 'hours', Number(e.target.value))}
                          className="transition-colors duration-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground block">Minutes</label>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          value={entry.minutes}
                          onChange={(e) => updateTimeEntry(index, 'minutes', Number(e.target.value))}
                          className="transition-colors duration-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground block">Seconds</label>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          value={entry.seconds}
                          onChange={(e) => updateTimeEntry(index, 'seconds', Number(e.target.value))}
                          className="transition-colors duration-500"
                        />
                      </div>
                    </div>
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTimeEntry(index)}
                        className="text-red-500"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTimeEntry}
                  className="mt-2"
                >
                  Add Time +
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-1 mt-4">
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
              {saving ? `${mode === 'edit' ? 'Saving' : 'Creating'}...` : (mode === 'edit' ? 'Save Changes' : 'Create Invoice')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 