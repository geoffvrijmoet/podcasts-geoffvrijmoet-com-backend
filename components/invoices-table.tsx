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
import { InvoiceEditForm } from "./invoice-edit-form";
import { Pencil, Download } from "lucide-react";

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

export function InvoicesTable() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);

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

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsEditDialogOpen(true);
  };

  const handleDownloadPDF = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`);
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Invoices</h2>
        <Button 
          onClick={() => setIsNewDialogOpen(true)}
          className="bg-primary hover:bg-primary/90"
        >
          New Invoice
        </Button>
      </div>

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
                      onClick={() => handleEdit(invoice)}
                      className="group cursor-pointer transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="w-[50px]">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleEdit(invoice);
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
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{invoice.client}</TableCell>
                      <TableCell>{invoice.episodeTitle}</TableCell>
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

      {editingInvoice && (
        <InvoiceEditForm
          invoice={editingInvoice}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={fetchInvoices}
          mode="edit"
        />
      )}

      <InvoiceEditForm
        open={isNewDialogOpen}
        onOpenChange={setIsNewDialogOpen}
        onSave={fetchInvoices}
        mode="create"
      />
    </div>
  );
} 