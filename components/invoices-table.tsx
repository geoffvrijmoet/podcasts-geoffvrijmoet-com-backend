"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Download, CreditCard } from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export function InvoicesTable({ hideStats = false }: { hideStats?: boolean }) {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/invoices");
      if (!response.ok) {
        throw new Error("Failed to fetch invoices");
      }
      const data = await response.json();
      setInvoices(data.invoices);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (invoiceId: string) => {
    router.push(`/invoices/${invoiceId}`);
  };

  const handleDownloadPDF = async (invoiceId: string) => {
    try {
      // Get invoice details first
      const detailsResponse = await fetch(`/api/invoices/${invoiceId}`);
      if (!detailsResponse.ok) throw new Error('Failed to get invoice details');
      const invoice = await detailsResponse.json();
      
      // Generate filename
      const filename = `${invoice.client.toLowerCase().replace(/\s+/g, '-')}-${invoice.episodeTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      
      // Get PDF
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`);
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
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

  const handlePaymentLink = (invoiceId: string) => {
    window.open(`https://pay.podcasts.geoffvrijmoet.com/invoice/${invoiceId}`, '_blank');
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const searchLower = search.toLowerCase();
    return (
      invoice.client.toLowerCase().includes(searchLower) ||
      invoice.episodeTitle.toLowerCase().includes(searchLower) ||
      invoice.type.toLowerCase().includes(searchLower)
    );
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div>Loading invoices...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      {!hideStats && (
        <div className="flex justify-between items-center">
          <div className="flex gap-10 text-2xl font-medium">
            <div className="flex flex-col">
              <span className="text-green-600">
                {formatCurrency(
                  filteredInvoices.reduce((sum, inv) => sum + inv.earnedAfterFees, 0)
                )}
              </span>
              <span className="text-sm text-muted-foreground">total</span>
            </div>
            <div className="flex flex-col">
              <span className="text-yellow-600">
                {formatCurrency(
                  filteredInvoices
                    .filter(invoice => !invoice.datePaid)
                    .reduce((sum, invoice) => sum + invoice.earnedAfterFees, 0)
                )}
              </span>
              <span className="text-sm text-muted-foreground">unpaid</span>
            </div>
            <div className="flex flex-col">
              <span className="text-blue-600">
                {formatCurrency(
                  (() => {
                    const amounts = filteredInvoices.map(inv => inv.earnedAfterFees);
                    if (amounts.length === 0) return 0;
                    
                    const dates = filteredInvoices
                      .map(inv => new Date(inv.dateInvoiced))
                      .filter(date => !isNaN(date.getTime()));
                    
                    if (dates.length === 0) return 0;
                    
                    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
                    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
                    const monthsDiff = (maxDate.getFullYear() - minDate.getFullYear()) * 12 + 
                      (maxDate.getMonth() - minDate.getMonth()) + 1;
                    
                    const total = amounts.reduce((sum, amount) => sum + amount, 0);
                    return total / monthsDiff;
                  })()
                )}
              </span>
              <span className="text-sm text-muted-foreground">monthly</span>
            </div>
            <div className="flex flex-col">
              <span className="text-purple-600">
                {(() => {
                  const totalInvoiced = filteredInvoices.reduce((sum, inv) => sum + inv.invoicedAmount, 0);
                  const totalEarned = filteredInvoices.reduce((sum, inv) => sum + inv.earnedAfterFees, 0);
                  if (totalInvoiced === 0) return '0';
                  return ((totalEarned / totalInvoiced) * 100).toFixed(1);
                })()}%
              </span>
              <span className="text-sm text-muted-foreground">margin</span>
            </div>
          </div>
        </div>
      )}

      <Card>
        <div className="p-4">
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm mb-4"
          />
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead colSpan={7} className="border-r">Invoice Details</TableHead>
                  <TableHead colSpan={2} className="bg-muted text-center">Performance Stats</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Episode Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Invoiced Amount</TableHead>
                  <TableHead className="text-right">Earned After Fees</TableHead>
                  <TableHead>Date Invoiced</TableHead>
                  <TableHead className="border-r">Date Paid</TableHead>
                  <TableHead className="bg-muted text-right">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Earned per</span>
                      <span>Minute</span>
                    </div>
                  </TableHead>
                  <TableHead className="bg-muted text-right">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Earned per</span>
                      <span>Hour</span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => {
                  const stats = calculateStats(
                    invoice.earnedAfterFees,
                    invoice.billedMinutes,
                    invoice.editingTime
                  );
                  
                  return (
                    <TableRow 
                      key={invoice._id}
                      onClick={() => handleRowClick(invoice._id)}
                      className={`group cursor-pointer transition-colors ${
                        invoice.datePaid 
                          ? 'bg-green-50 hover:bg-green-100' 
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <TableCell className="w-[50px]">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              router.push(`/invoices/${invoice._id}`);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleDownloadPDF(invoice._id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handlePaymentLink(invoice._id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{invoice.client}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link 
                            href={`/invoices/${invoice._id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {invoice.episodeTitle}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>{invoice.type}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(invoice.invoicedAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(invoice.earnedAfterFees)}
                      </TableCell>
                      <TableCell>{formatDate(invoice.dateInvoiced)}</TableCell>
                      <TableCell className="border-r">{formatDate(invoice.datePaid)}</TableCell>
                      <TableCell className="bg-muted/50 text-right font-medium">
                        {formatCurrency(stats.perMinute)}/min
                      </TableCell>
                      <TableCell className="bg-muted/50 text-right font-medium">
                        {formatCurrency(stats.perHourWorked)}/hr
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>
    </div>
  );
} 