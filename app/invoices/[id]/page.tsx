'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download } from 'lucide-react';

interface TimeEntry {
  hours: number;
  minutes: number;
  seconds: number;
}

interface Rate {
  episodeType: string;
  rateType: 'Per delivered minute' | 'Hourly' | 'Flat rate';
  rate: number;
}

interface Invoice {
  _id: string;
  client: string;
  episodeTitle: string;
  type: string;
  invoicedAmount: number;
  billedMinutes: number;
  length: TimeEntry[];
  paymentMethod: string;
  editingTime: TimeEntry[];
  dateInvoiced: string;
  datePaid: string;
  note: string;
}

interface Client {
  _id: string;
  name: string;
  rates: Rate[];
}

interface InvoicePageProps {
  params: {
    id: string;
  };
}

// Convert time entries to decimal hours, rounded to 2 decimal places
const calculateDecimalHours = (entries: TimeEntry[]): number => {
  const totalSeconds = entries.reduce((acc, entry) => {
    return acc + 
      (entry.hours * 3600) + 
      (entry.minutes * 60) + 
      entry.seconds;
  }, 0);
  
  return Number((totalSeconds / 3600).toFixed(2));
};

// Convert time entries to decimal minutes, rounded to 2 decimal places
const calculateDecimalMinutes = (entries: TimeEntry[]): number => {
  const totalSeconds = entries.reduce((acc, entry) => {
    return acc + 
      (entry.hours * 3600) + 
      (entry.minutes * 60) + 
      entry.seconds;
  }, 0);
  
  return Number((totalSeconds / 60).toFixed(2));
};

export default function InvoicePage({ params }: InvoicePageProps) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchInvoice = useCallback(async () => {
    try {
      const response = await fetch(`/api/invoices/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch invoice');
      const data = await response.json();
      
      // Initialize arrays if they don't exist and normalize type
      setInvoice({
        ...data,
        type: data.type === 'Podcast video' ? 'Video' : data.type === 'Podcast' ? 'Podcast' : data.type,
        editingTime: Array.isArray(data.editingTime) ? data.editingTime : [
          {
            hours: data.editingTime?.hours || 0,
            minutes: data.editingTime?.minutes || 0,
            seconds: data.editingTime?.seconds || 0
          }
        ],
        length: Array.isArray(data.length) ? data.length : [
          {
            hours: data.length?.hours || 0,
            minutes: data.length?.minutes || 0,
            seconds: data.length?.seconds || 0
          }
        ]
      });

      // Fetch client data
      const clientResponse = await fetch(`/api/clients/${data.client}`);
      if (!clientResponse.ok) throw new Error('Failed to fetch client');
      const clientData = await clientResponse.json();
      setClient(clientData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  // Calculate billed amount based on type and rates
  const calculateBilledAmount = useCallback((): { billed: number; invoicedAmount: number } => {
    if (!invoice || !client) return { billed: 0, invoicedAmount: 0 };

    const rate = client.rates.find(r => 
      r.episodeType === (invoice.type === 'Video' ? 'Podcast video' : 'Podcast')
    );
    if (!rate) return { billed: 0, invoicedAmount: 0 };

    if (rate.rateType === 'Flat rate') {
      return {
        billed: 1, // For flat rate, billed quantity is always 1
        invoicedAmount: rate.rate
      };
    } else if (invoice.type === 'Video') {
      const hours = calculateDecimalHours(invoice.editingTime);
      return {
        billed: hours,
        invoicedAmount: Number((hours * rate.rate).toFixed(2))
      };
    } else {
      const minutes = calculateDecimalMinutes(invoice.length);
      return {
        billed: minutes,
        invoicedAmount: Number((minutes * rate.rate).toFixed(2))
      };
    }
  }, [invoice, client]);

  useEffect(() => {
    if (invoice && client) {
      const { billed, invoicedAmount } = calculateBilledAmount();
      setInvoice(prev => ({
        ...prev!,
        billedMinutes: billed,
        invoicedAmount: invoicedAmount
      }));
    }
  }, [invoice, client, calculateBilledAmount]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleSave = async () => {
    if (!invoice) return;

    setSaving(true);
    try {
      // Convert type back to MongoDB format before saving
      const saveData = {
        ...invoice,
        type: invoice.type === 'Video' ? 'Podcast video' : invoice.type === 'Podcast' ? 'Podcast' : invoice.type
      };

      const response = await fetch(`/api/invoices/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });

      if (!response.ok) throw new Error('Failed to update invoice');
      
      router.refresh();
    } catch (error) {
      console.error('Error updating invoice:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    
    try {
      // Send current invoice state to get PDF with current values
      const response = await fetch(`/api/invoices/${params.id}/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...invoice,
          // Convert type back to MongoDB format
          type: invoice.type === 'Video' ? 'Podcast video' : invoice.type === 'Podcast' ? 'Podcast' : invoice.type,
          // Ensure we use the calculated values
          billedMinutes: calculateBilledAmount().billed,
          invoicedAmount: calculateBilledAmount().invoicedAmount
        }),
      });
      
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      
      // Generate filename
      const filename = `${invoice.client.toLowerCase().replace(/\s+/g, '-')}-${invoice.episodeTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!invoice) return <div>Invoice not found</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Invoice</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleDownloadPDF}
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <div className="space-y-6">
            <div>
              <Label htmlFor="client" className="mb-2 block">Client</Label>
              <Input
                id="client"
                value={invoice.client}
                onChange={(e) => setInvoice({ ...invoice, client: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="episodeTitle" className="mb-2 block">Episode Title</Label>
              <Input
                id="episodeTitle"
                value={invoice.episodeTitle}
                onChange={(e) => setInvoice({ ...invoice, episodeTitle: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="type" className="mb-2 block">Type</Label>
              <Select
                value={invoice.type}
                onValueChange={(value) => setInvoice({ ...invoice, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Video">Video</SelectItem>
                  <SelectItem value="Podcast">Podcast</SelectItem>
                  <SelectItem value="Misc">Misc</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="billedAmount" className="mb-2 block">
                {invoice.type === 'Video' ? 'Billed Hours' : 'Billed Minutes'}
              </Label>
              <Input
                id="billedAmount"
                type="number"
                value={calculateBilledAmount().billed}
                disabled
              />
            </div>

            <div>
              <Label htmlFor="invoicedAmount" className="mb-2 block">Invoiced Amount</Label>
              <Input
                id="invoicedAmount"
                value={formatCurrency(calculateBilledAmount().invoicedAmount)}
                disabled
              />
              {client && invoice && (
                <div className="mt-2 text-sm text-muted-foreground">
                  {(() => {
                    const rate = client.rates.find(r => 
                      r.episodeType === (invoice.type === 'Video' ? 'Podcast video' : 'Podcast')
                    );
                    if (!rate) return 'No rate found';
                    
                    const { billed } = calculateBilledAmount();
                    if (rate.rateType === 'Flat rate') {
                      return `Flat rate: ${formatCurrency(rate.rate)}`;
                    }
                    
                    return `${formatCurrency(rate.rate)} × ${billed} ${rate.rateType === 'Hourly' ? 'hours' : 'minutes'} = ${formatCurrency(rate.rate * billed)}`;
                  })()}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="mb-2 block">Editing Time</Label>
              {invoice.editingTime.map((timeEntry, index) => (
                <div key={index} className="mb-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`editingHours-${index}`} className="mb-2 block">Hours</Label>
                      <Input
                        id={`editingHours-${index}`}
                        type="number"
                        value={timeEntry.hours}
                        onChange={(e) => {
                          const newEditingTime = [...invoice.editingTime];
                          newEditingTime[index] = {
                            ...timeEntry,
                            hours: parseInt(e.target.value) || 0
                          };
                          setInvoice({
                            ...invoice,
                            editingTime: newEditingTime
                          });
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`editingMinutes-${index}`} className="mb-2 block">Minutes</Label>
                      <Input
                        id={`editingMinutes-${index}`}
                        type="number"
                        value={timeEntry.minutes}
                        onChange={(e) => {
                          const newEditingTime = [...invoice.editingTime];
                          newEditingTime[index] = {
                            ...timeEntry,
                            minutes: parseInt(e.target.value) || 0
                          };
                          setInvoice({
                            ...invoice,
                            editingTime: newEditingTime
                          });
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`editingSeconds-${index}`} className="mb-2 block">Seconds</Label>
                      <Input
                        id={`editingSeconds-${index}`}
                        type="number"
                        value={timeEntry.seconds}
                        onChange={(e) => {
                          const newEditingTime = [...invoice.editingTime];
                          newEditingTime[index] = {
                            ...timeEntry,
                            seconds: parseInt(e.target.value) || 0
                          };
                          setInvoice({
                            ...invoice,
                            editingTime: newEditingTime
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm"
                className="mt-2"
                onClick={() => {
                  setInvoice({
                    ...invoice,
                    editingTime: [
                      ...invoice.editingTime,
                      { hours: 0, minutes: 0, seconds: 0 }
                    ]
                  });
                }}
              >
                + Add Time
              </Button>
            </div>

            <div>
              <Label className="mb-2 block">Episode Length</Label>
              {invoice.length.map((timeEntry, index) => (
                <div key={index} className="mb-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`lengthHours-${index}`} className="mb-2 block">Hours</Label>
                      <Input
                        id={`lengthHours-${index}`}
                        type="number"
                        value={timeEntry.hours}
                        onChange={(e) => {
                          const newLength = [...invoice.length];
                          newLength[index] = {
                            ...timeEntry,
                            hours: parseInt(e.target.value) || 0
                          };
                          setInvoice({
                            ...invoice,
                            length: newLength
                          });
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`lengthMinutes-${index}`} className="mb-2 block">Minutes</Label>
                      <Input
                        id={`lengthMinutes-${index}`}
                        type="number"
                        value={timeEntry.minutes}
                        onChange={(e) => {
                          const newLength = [...invoice.length];
                          newLength[index] = {
                            ...timeEntry,
                            minutes: parseInt(e.target.value) || 0
                          };
                          setInvoice({
                            ...invoice,
                            length: newLength
                          });
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`lengthSeconds-${index}`} className="mb-2 block">Seconds</Label>
                      <Input
                        id={`lengthSeconds-${index}`}
                        type="number"
                        value={timeEntry.seconds}
                        onChange={(e) => {
                          const newLength = [...invoice.length];
                          newLength[index] = {
                            ...timeEntry,
                            seconds: parseInt(e.target.value) || 0
                          };
                          setInvoice({
                            ...invoice,
                            length: newLength
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm"
                className="mt-2"
                onClick={() => {
                  setInvoice({
                    ...invoice,
                    length: [
                      ...invoice.length,
                      { hours: 0, minutes: 0, seconds: 0 }
                    ]
                  });
                }}
              >
                + Add Time
              </Button>
            </div>

            <div>
              <Label htmlFor="dateInvoiced" className="mb-2 block">Date Invoiced</Label>
              <Input
                id="dateInvoiced"
                type="date"
                value={invoice.dateInvoiced.split('T')[0]}
                onChange={(e) => setInvoice({ ...invoice, dateInvoiced: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="datePaid" className="mb-2 block">Date Paid</Label>
              <Input
                id="datePaid"
                type="date"
                value={invoice.datePaid?.split('T')[0] || ''}
                onChange={(e) => setInvoice({ ...invoice, datePaid: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="note" className="mb-2 block">Note</Label>
              <Input
                id="note"
                value={invoice.note || ''}
                onChange={(e) => setInvoice({ ...invoice, note: e.target.value })}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 